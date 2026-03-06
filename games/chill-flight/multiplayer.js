// --- FIREBASE MULTIPLAYER ---
// This MUST be a <script type="module"> because Firebase uses ESM CDN imports.
// All game globals (planeGroup, scene, otherPlayers, etc.) are available as window globals
// because the plain <script> tags before this have run synchronously.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, onDisconnect, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCPeDeN9w52WynaSSasPIeGYZCO7Dq6IRw",
    authDomain: "chill-flight.firebaseapp.com",
    databaseURL: "https://chill-flight-default-rtdb.firebaseio.com",
    projectId: "chill-flight",
    storageBucket: "chill-flight.firebasestorage.app",
    messagingSenderId: "164886656663",
    appId: "1:164886656663:web:249418e3fe76d60a4d1bd2",
    measurementId: "G-N6RGBLQCZ8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

const ENABLE_MULTIPLAYER_HEADLIGHTS = false;
// Scope all Firebase paths under the world seed so players on different seeds
// are completely isolated from each other.
const worldPrefix = `world/${ChillFlightLogic.WORLD_SEED}`;
// otherPlayers must be on window so game.js (a plain script) can read it
// Module-scoped const/let never lands on window, unlike top-level var in plain <script>s
window.otherPlayers = new Map();
let playerUid = null;
let multiplayerActive = false;

// --- OFFLINE / ONLINE INDICATOR ---
function setMultiplayerOfflineBanner(isOffline) {
    const title = document.getElementById('online-title');
    if (!title) return;
    if (isOffline) {
        title.textContent = 'OFFLINE';
        title.style.color = 'rgba(255,100,100,0.7)';
    } else {
        title.textContent = 'ONLINE';
        title.style.color = '';
    }
}

// Listen to Firebase .info/connected for real-time connection state
const connectedRef = ref(db, '.info/connected');
onValue(connectedRef, (snap) => {
    const isConnected = snap.val() === true;
    setMultiplayerOfflineBanner(!isConnected);
    if (!isConnected && multiplayerActive) {
        // Remove all remote planes so stale players don't persist
        window.otherPlayers.forEach((p) => {
            if (typeof scene !== 'undefined') scene.remove(p.mesh);
        });
        window.otherPlayers.clear();
    }
});

// Also respond to browser-level network events
window.addEventListener('offline', () => {
    console.log('Network offline — multiplayer paused.');
    setMultiplayerOfflineBanner(true);
    window.otherPlayers.forEach((p) => {
        if (typeof scene !== 'undefined') scene.remove(p.mesh);
    });
    window.otherPlayers.clear();
});

window.addEventListener('online', () => {
    console.log('Network online — Firebase will reconnect automatically.');
    // Firebase SDK reconnects itself; the connectedRef listener above will update the banner
});

// Global server offset for deterministic time
window.serverTimeOffset = 0;
const offsetRef = ref(db, ".info/serverTimeOffset");
onValue(offsetRef, (snap) => {
    window.serverTimeOffset = snap.val() || 0;
});

// Expose DB globally for debug menu & periodic sync in game.js
window.firebaseDB = db;

function createOtherPlaneMesh(uid, forcedColor) {
    const group = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(4, 4, 16);
    const color = forcedColor !== undefined ? forcedColor : getPlaneColor(uid);
    const mat = createMaterial({ color: color, flatShading: true });
    const body = new THREE.Mesh(bodyGeo, mat);
    group.add(body);
    const cp = new THREE.Mesh(windowGeo, windowMat);
    cp.position.set(0, 2.5, -2);
    group.add(cp);
    const w = new THREE.Mesh(wingGeo, wingMat);
    w.position.set(0, 0, -1);
    group.add(w);
    const t = new THREE.Mesh(tailGeo, wingMat);
    t.position.set(0, 0, 7);
    group.add(t);
    const r = new THREE.Mesh(rudderGeo, mat);
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

    const propCenterGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
    propCenterGeo.rotateX(Math.PI / 2);
    const propCenter = new THREE.Mesh(propCenterGeo, createMaterial({ color: 0x333333 }));
    propGroup.add(propCenter);

    const bladeGeo = new THREE.BoxGeometry(12, 0.4, 0.4);
    const bladeMat = createMaterial({ color: 0x222222 });
    const blade1 = new THREE.Mesh(bladeGeo, bladeMat);
    const blade2 = new THREE.Mesh(bladeGeo, bladeMat);
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

signInAnonymously(auth)
    .then((result) => {
        playerUid = result.user.uid;
        multiplayerActive = true;
        window.currentUserUid = playerUid;
        console.log("Logged in anonymously! ID:", playerUid);

        if (planeMat) {
            if (!hasSavedColor) {
                planeColor = getPlaneColor(playerUid);
            }
            planeMat.color.setHex(planeColor);

            const nameInput = document.getElementById('player-name-input');
            if (nameInput) nameInput.value = playerName;
        }

        const profileRef = ref(db, `${worldPrefix}/users/` + playerUid);
        const sessionRef = ref(db, `${worldPrefix}/players/` + playerUid);

        const updatePlayerProfile = () => {
            set(profileRef, {
                name: playerName,
                color: planeColor,
                updatedAt: new Date().toISOString()
            });
            set(sessionRef, {
                name: playerName,
                color: planeColor,
                lastSeen: new Date().toISOString()
            });
        };

        get(profileRef).then((snapshot) => {
            if (snapshot.exists()) {
                const profile = snapshot.val();
                playerName = profile.name || playerName;
                planeColor = profile.color !== undefined ? profile.color : planeColor;
                console.log("Profile restored from Firebase:", playerName);
                localStorage.setItem('chill_flight_name', playerName);
                localStorage.setItem('chill_flight_color', planeColor.toString());
            } else {
                console.log("No Firebase profile found, using local defaults.");
            }

            if (planeMat) {
                planeMat.color.setHex(planeColor);
                const nameInput = document.getElementById('player-name-input');
                if (nameInput) nameInput.value = playerName;
            }

            updateActiveSwatch();
            updatePlayerProfile();
        });

        const nameInput = document.getElementById('player-name-input');
        const colorOptions = document.getElementById('plane-color-options');

        const updateActiveSwatch = () => {
            if (!colorOptions) return;
            colorOptions.querySelectorAll('.color-swatch').forEach(sw => {
                const swColor = parseInt(sw.getAttribute('data-color'));
                if (swColor === planeColor) {
                    sw.classList.add('active');
                } else {
                    sw.classList.remove('active');
                }
            });
        };

        // Initial UI sync
        updateActiveSwatch();

        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                playerName = e.target.value || window.defaultCallsign;
                localStorage.setItem('chill_flight_name', playerName);
                updatePlayerProfile();
            });
        }

        if (colorOptions) {
            colorOptions.addEventListener('click', (e) => {
                if (e.target.classList.contains('color-swatch')) {
                    planeColor = parseInt(e.target.getAttribute('data-color'));
                    localStorage.setItem('chill_flight_color', planeColor.toString());
                    if (planeMat) {
                        planeMat.color.setHex(planeColor);
                    }
                    updateActiveSwatch();
                    updatePlayerProfile();
                }
            });
        }

        onDisconnect(sessionRef).remove();

        const initialPos = planeGroup.position;
        const initialRot = planeGroup.rotation;
        set(ref(db, `${worldPrefix}/players/` + playerUid + '/position'), {
            x: Number(initialPos.x.toFixed(1)),
            y: Number(initialPos.y.toFixed(1)),
            z: Number(initialPos.z.toFixed(1)),
            rotX: Number(initialRot.x.toFixed(3)),
            rotY: Number(initialRot.y.toFixed(3)),
            rotZ: Number(initialRot.z.toFixed(3)),
            speedMult: Number(flightSpeedMultiplier.toFixed(2)),
            headlightsOn: false,
            updatedAt: new Date().toISOString()
        });

        const playersRef = ref(db, `${worldPrefix}/players`);
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

            const mesh = createOtherPlaneMesh(snapKey, data.color);

            if (ENABLE_MULTIPLAYER_HEADLIGHTS && mesh.userData.headlight) {
                const isLightsOn = posData.headlightsOn || false;
                mesh.userData.headlight.intensity = isLightsOn ? 2 : 0;
                mesh.userData.headlightGlow.intensity = isLightsOn ? 0.1 : 0;
            }

            scene.add(mesh);
            otherPlayers.set(snapshot.key, {
                mesh,
                name: data.name || "Player",
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

                // Update targets
                p.targetRotX = data.position.rotX || 0;
                p.targetRotY = data.position.rotY || 0;
                p.targetRotZ = data.position.rotZ || 0;
                p.targetSpeedMult = data.position.speedMult !== undefined ? data.position.speedMult : 1;
                p.lastReceivedMs = Date.now();
                if (data.name) p.name = data.name;

                // Set target position with latency compensation (Extrapolation)
                p.targetPos.set(data.position.x || 0, data.position.y || 200, data.position.z || 0);

                if (data.position.updatedAt) {
                    const packetTime = new Date(data.position.updatedAt).getTime();
                    const now = Date.now() + (window.serverTimeOffset || 0);
                    let latencySecs = (now - packetTime) / 1000;

                    // Only compensate for reasonable latency (up to 2 seconds)
                    if (latencySecs > 0 && latencySecs < 2.0) {
                        const targetEuler = new THREE.Euler(p.targetRotX, p.targetRotY, p.targetRotZ, 'XYZ');
                        const forward = new THREE.Vector3(0, 0, -1).applyEuler(targetEuler);
                        // Extrapolate: move the target position forward by how much time has passed since it was sent
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

        // Local GC: remove stale players after 10 seconds
        setInterval(() => {
            const now = Date.now();
            const expirationTime = 10000;
            otherPlayers.forEach((p, key) => {
                if (now - p.lastReceivedMs > expirationTime) {
                    console.log("Removing inactive player locally:", key);
                    scene.remove(p.mesh);
                    otherPlayers.delete(key);
                }
            });
        }, 5000);

        // Periodic position sync every 200ms
        setInterval(() => {
            if (!navigator.onLine) return;
            if (!window.firebaseDB) return;
            const debugMenu = document.getElementById('debug-menu');
            if (debugMenu && debugMenu.style.display === 'block') return;

            const pos = planeGroup.position;
            const rot = planeGroup.rotation;

            let headlightsOn = false;
            planeGroup.children.forEach(c => {
                if (c.type === 'SpotLight' && c.intensity > 0) headlightsOn = true;
            });

            set(ref(db, `${worldPrefix}/players/` + playerUid + '/position'), {
                x: Number(pos.x.toFixed(1)),
                y: Number(pos.y.toFixed(1)),
                z: Number(pos.z.toFixed(1)),
                rotX: Number(rot.x.toFixed(3)),
                rotY: Number(rot.y.toFixed(3)),
                rotZ: Number(rot.z.toFixed(3)),
                speedMult: Number(flightSpeedMultiplier.toFixed(2)),
                headlightsOn: headlightsOn,
                updatedAt: new Date().toISOString()
            });
        }, 200);
    })
    .catch((error) => {
        console.warn("Firebase auth failed (offline or config error):", error.code || error.message);
        setMultiplayerOfflineBanner(true);
        // Game continues without multiplayer — no crash
    });
