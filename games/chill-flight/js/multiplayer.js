import {
    db,
    auth,
    ref,
    set,
    onChildAdded,
    onChildChanged,
    onChildRemoved,
    onDisconnect,
    get,
    signInAnonymously,
    onValue
} from './firebase-config.js';
import { ENABLE_MULTIPLAYER_HEADLIGHTS, BASE_FLIGHT_SPEED } from './constants.js';

export function getPlaneColor(uid) {
    const colors = [
        0xe74c3c, // Sunset Red
        0x3498db, // Sky Blue
        0x2ecc71, // Emerald
        0xf1c40f, // Amber
        0x9b59b6, // Amethyst
        0x34495e, // Slate
        0xe67e22, // Orange
        0x1abc9c, // Turquoise
        0xd35400, // Pumpkin
        0xc0392b  // Dark Red
    ];
    if (!uid) return colors[0];
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
        hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

export function createOtherPlaneMesh(uid, forcedColor, geometries, materials) {
    const group = new THREE.Group();
    const color = forcedColor !== undefined ? forcedColor : getPlaneColor(uid);
    const planeMat = new THREE.MeshStandardMaterial({ color: color, flatShading: true });

    const body = new THREE.Mesh(geometries.body, planeMat);
    group.add(body);

    const cp = new THREE.Mesh(geometries.cockpit, materials.cockpit);
    cp.position.set(0, 2.5, -2);
    group.add(cp);

    const w = new THREE.Mesh(geometries.wing, materials.wing);
    w.position.set(0, 0, -1);
    group.add(w);

    const t = new THREE.Mesh(geometries.tail, materials.wing);
    t.position.set(0, 0, 7);
    group.add(t);

    const r = new THREE.Mesh(geometries.rudder, planeMat);
    r.position.set(0, 2.5, 7);
    group.add(r);

    let headlight = null;
    let headlightGlow = null;

    if (ENABLE_MULTIPLAYER_HEADLIGHTS) {
        headlight = new THREE.SpotLight(0xffd1a3, 0);
        headlight.position.set(0, 0, -10);
        const headlightTarget = new THREE.Object3D();
        headlightTarget.position.set(0, -20, -100);
        group.add(headlightTarget);
        headlight.target = headlightTarget;
        headlight.angle = Math.PI / 4;
        headlight.penumbra = 1.0;
        headlight.distance = 1500;
        headlight.decay = 2.0;

        headlightGlow = new THREE.PointLight(0xffd1a3, 0, 50);
        headlightGlow.position.set(0, 5, 0);
        group.add(headlightGlow);
        group.add(headlight);
    }

    const propGroup = new THREE.Group();
    propGroup.position.set(0, 0, -8.5);
    group.add(propGroup);

    const propCenter = new THREE.Mesh(geometries.propCenter, materials.propCenter);
    propGroup.add(propCenter);

    const blade1 = new THREE.Mesh(geometries.propBlade, materials.propBlade);
    const blade2 = new THREE.Mesh(geometries.propBlade, materials.propBlade);
    blade2.rotation.z = Math.PI / 2;
    propGroup.add(blade1);
    propGroup.add(blade2);

    group.userData = {
        headlight: headlight,
        headlightGlow: headlightGlow,
        propeller: propGroup
    };

    return group;
}

export function initMultiplayer(scene, planeGroup, state, geometries, materials) {
    const otherPlayers = new Map();
    let playerUid = null;

    window.serverTimeOffset = 0;
    const offsetRef = ref(db, ".info/serverTimeOffset");
    onValue(offsetRef, (snap) => {
        window.serverTimeOffset = snap.val() || 0;
    });

    signInAnonymously(auth).then((result) => {
        playerUid = result.user.uid;
        state.playerUid = playerUid;

        const profileRef = ref(db, 'users/' + playerUid);
        const sessionRef = ref(db, 'players/' + playerUid);

        const updatePlayerProfile = () => {
            set(profileRef, {
                name: state.playerName,
                color: state.planeColor,
                updatedAt: new Date().toISOString()
            });
            set(sessionRef, {
                name: state.playerName,
                color: state.planeColor,
                lastSeen: new Date().toISOString()
            });
        };

        get(profileRef).then((snapshot) => {
            if (snapshot.exists()) {
                const profile = snapshot.val();
                state.playerName = profile.name || state.playerName;
                state.planeColor = profile.color !== undefined ? profile.color : state.planeColor;
                localStorage.setItem('chill_flight_name', state.playerName);
                localStorage.setItem('chill_flight_color', state.planeColor.toString());
            }
            updatePlayerProfile();
            if (state.onProfileLoaded) state.onProfileLoaded();
        });

        onDisconnect(sessionRef).remove();

        // Initial sync
        set(ref(db, 'players/' + playerUid + '/position'), {
            x: Number(planeGroup.position.x.toFixed(1)),
            y: Number(planeGroup.position.y.toFixed(1)),
            z: Number(planeGroup.position.z.toFixed(1)),
            rotX: Number(planeGroup.rotation.x.toFixed(3)),
            rotY: Number(planeGroup.rotation.y.toFixed(3)),
            rotZ: Number(planeGroup.rotation.z.toFixed(3)),
            speedMult: Number(state.flightSpeedMultiplier.toFixed(2)),
            headlightsOn: false,
            updatedAt: new Date().toISOString()
        });

        const playersRef = ref(db, 'players');
        onChildAdded(playersRef, (snapshot) => {
            const snapKey = snapshot.key;
            if (snapKey === playerUid) return;
            const data = snapshot.val();
            const posData = data.position || {};
            if (!posData.x && posData.x !== 0) return;

            if (posData.updatedAt) {
                const packetTime = new Date(posData.updatedAt).getTime();
                const now = Date.now() + (window.serverTimeOffset || 0);
                if (now - packetTime > 10000) return;
            }

            if (otherPlayers.has(snapKey)) {
                const oldP = otherPlayers.get(snapKey);
                scene.remove(oldP.mesh);
                otherPlayers.delete(snapKey);
            }

            const mesh = createOtherPlaneMesh(snapKey, data.color, geometries, materials);
            scene.add(mesh);
            otherPlayers.set(snapKey, {
                mesh,
                targetPos: new THREE.Vector3(posData.x || 0, posData.y || 200, posData.z || 0),
                targetRotX: posData.rotX || 0,
                targetRotY: posData.rotY || 0,
                targetRotZ: posData.rotZ || 0,
                targetSpeedMult: posData.speedMult !== undefined ? posData.speedMult : 1,
                targetQuat: new THREE.Quaternion(),
                lastReceivedMs: Date.now()
            });
        });

        onChildChanged(playersRef, (snapshot) => {
            const snapKey = snapshot.key;
            if (snapKey === playerUid) return;
            const data = snapshot.val();
            const p = otherPlayers.get(snapKey);

            if (data.position) {
                if (data.position.updatedAt) {
                    const packetTime = new Date(data.position.updatedAt).getTime();
                    const now = Date.now() + (window.serverTimeOffset || 0);
                    if (now - packetTime > 10000) {
                        if (p) {
                            scene.remove(p.mesh);
                            otherPlayers.delete(snapKey);
                        }
                        return;
                    }
                }

                if (!p) return;

                if (data.color !== undefined) {
                    p.mesh.children.forEach(child => {
                        if (child.isMesh && child.geometry.type === 'BoxGeometry' && child.geometry.parameters.width === 4) {
                            if (child.material && child.material.color) {
                                child.material.color.setHex(data.color);
                            }
                        }
                    });
                }

                p.targetPos.set(data.position.x, data.position.y, data.position.z);
                p.targetRotX = data.position.rotX;
                p.targetRotY = data.position.rotY;
                p.targetRotZ = data.position.rotZ;
                p.targetSpeedMult = data.position.speedMult;
                p.lastReceivedMs = Date.now();

                if (data.position.updatedAt) {
                    const packetTime = new Date(data.position.updatedAt).getTime();
                    const now = Date.now() + (window.serverTimeOffset || 0);
                    let latencySecs = (now - packetTime) / 1000;
                    if (latencySecs > 0 && latencySecs < 2.0) {
                        const targetEuler = new THREE.Euler(p.targetRotX, p.targetRotY, p.targetRotZ, 'YXZ');
                        const forward = new THREE.Vector3(0, 0, -1).applyEuler(targetEuler);
                        p.targetPos.add(forward.multiplyScalar(BASE_FLIGHT_SPEED * p.targetSpeedMult * 60 * latencySecs));
                    }
                }
            }
        });

        onChildRemoved(playersRef, (snapshot) => {
            const p = otherPlayers.get(snapshot.key);
            if (p) {
                scene.remove(p.mesh);
                otherPlayers.delete(snapshot.key);
            }
        });
    });

    return otherPlayers;
}

export function syncLocation(db, playerUid, planeGroup, flightSpeedMultiplier) {
    if (!db || !playerUid) return;
    const debugMenu = document.getElementById('debug-menu');
    if (debugMenu && debugMenu.style.display === 'block') return;

    let headlightsOn = false;
    planeGroup.children.forEach(c => {
        if (c.type === 'SpotLight' && c.intensity > 0) headlightsOn = true;
    });

    set(ref(db, 'players/' + playerUid + '/position'), {
        x: Number(planeGroup.position.x.toFixed(1)),
        y: Number(planeGroup.position.y.toFixed(1)),
        z: Number(planeGroup.position.z.toFixed(1)),
        rotX: Number(planeGroup.rotation.x.toFixed(3)),
        rotY: Number(planeGroup.rotation.y.toFixed(3)),
        rotZ: Number(planeGroup.rotation.z.toFixed(3)),
        speedMult: Number(flightSpeedMultiplier.toFixed(2)),
        headlightsOn: headlightsOn,
        updatedAt: new Date().toISOString()
    });
}
