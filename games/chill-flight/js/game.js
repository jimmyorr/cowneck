import {
    CHUNK_SIZE, SEGMENTS, WATER_LEVEL, MOUNTAIN_LEVEL,
    BASE_FLIGHT_SPEED, TURN_SPEED, STATION_DATA
} from './constants.js';
import { db, auth, ref, set, onValue } from './firebase-config.js';
import { initMultiplayer, syncLocation, getPlaneColor } from './multiplayer.js';
import { simplex, generateChunk, getElevation } from './world.js';
import { createPlane } from './plane.js';
import { initAudio, playProceduralNote } from './audio.js';
import { initInput } from './input.js';
import { updateHUD, updateSky } from './ui.js';

// --- State ---
const state = {
    playerUid: null,
    playerName: localStorage.getItem('chill_flight_name') || 'Player 1',
    planeColor: parseInt(localStorage.getItem('chill_flight_color')) || 0xe74c3c,
    flightSpeedMultiplier: 1.0,
    daySpeedMultiplier: 1.0,
    mouseX: 0,
    mouseY: 0,
    currentStation: 0,
    isPaused: false,
    onProfileLoaded: null,
    onToggleHeadlight: null
};

// --- Three.js Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const skyGroup = new THREE.Group();
scene.add(skyGroup);

// Lights
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
scene.add(dirLight);

// Geometries & Materials
const geometries = {
    treeTrunk: new THREE.CylinderGeometry(0.2, 0.5, 3, 6),
    treeLeaves: new THREE.ConeGeometry(2, 6, 6),
    houseBody: new THREE.BoxGeometry(10, 8, 10),
    houseRoof: new THREE.BoxGeometry(12, 2, 12),
    houseWindow: new THREE.PlaneGeometry(2, 2),
    cloud: new THREE.BoxGeometry(1, 1, 1),
    birdBody: new THREE.BoxGeometry(1, 1, 4),
    birdHead: new THREE.ConeGeometry(0.5, 1.5, 4),
    birdWing: new THREE.BoxGeometry(6, 0.1, 2)
};
geometries.birdHead.rotateX(-Math.PI / 2);
geometries.birdHead.translate(0, 0, -2);

const houseWindowMats = Array.from({ length: 5 }, () => new THREE.MeshStandardMaterial({
    color: 0x333333,
    emissive: 0xffd700,
    emissiveIntensity: 0
}));

const materials = {
    terrain: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.8 }),
    treeTrunk: new THREE.MeshStandardMaterial({ color: 0x5D4037 }),
    treeLeaves: new THREE.MeshStandardMaterial({ color: 0x2E7D32 }),
    snowTreeTrunk: new THREE.MeshStandardMaterial({ color: 0x3E2723 }),
    snowTreeLeaves: new THREE.MeshStandardMaterial({ color: 0xD7E9F7 }),
    houseBody: new THREE.MeshStandardMaterial({ color: 0x8D6E63 }),
    houseRoof: new THREE.MeshStandardMaterial({ color: 0x4E342E }),
    houseWindows: houseWindowMats,
    cloud: new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, flatShading: true }),
    hawk: new THREE.MeshStandardMaterial({ color: 0x442200, flatShading: true })
};

// Celestial
const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
skyGroup.add(sunMesh);
const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 32), new THREE.MeshBasicMaterial({ color: 0xddddff }));
skyGroup.add(moonMesh);

const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, transparent: true, opacity: 0 });
const starsGeo = new THREE.BufferGeometry();
const starPositions = [];
for (let i = 0; i < 5000; i++) {
    const r = 9000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
}
starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starsGeo, starsMat);
skyGroup.add(stars);

scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0x87ceeb, 0.0003);

// --- Initialization ---
const playerPlane = createPlane(state.playerUid, state.planeColor);
scene.add(playerPlane.group);

const otherPlayers = initMultiplayer(scene, playerPlane.group, state, geometries, materials);
const keys = initInput(state);

state.onToggleHeadlight = () => {
    const active = playerPlane.headlight.intensity === 0;
    playerPlane.headlight.intensity = active ? 2 : 0;
    playerPlane.headlightGlow.intensity = active ? 0.1 : 0;
    const mobileBtn = document.getElementById('mobile-hdgt');
    if (mobileBtn) mobileBtn.classList.toggle('active', active);
};

// --- Chunk Management ---
const chunks = new Map();
function updateChunks() {
    const pX = Math.floor(playerPlane.group.position.x / CHUNK_SIZE);
    const pZ = Math.floor(playerPlane.group.position.z / CHUNK_SIZE);
    const range = 2;

    for (let x = pX - range; x <= pX + range; x++) {
        for (let z = pZ - range; z <= pZ + range; z++) {
            const key = `${x},${z}`;
            if (!chunks.has(key)) {
                const chunk = generateChunk(x, z, geometries, materials);
                chunks.set(key, chunk);
                scene.add(chunk);
            }
        }
    }

    chunks.forEach((chunk, key) => {
        const [cx, cz] = key.split(',').map(Number);
        if (Math.abs(cx - pX) > range + 1 || Math.abs(cz - pZ) > range + 1) {
            scene.remove(chunk);
            chunks.delete(key);
        }
    });
}

// --- Radio ---
let audioCtx = null;
function setStation(id) {
    state.currentStation = id;
    const nameEl = document.getElementById('station-name');
    if (nameEl) nameEl.innerText = STATION_DATA[id]?.name || '';

    // UI logic for active buttons
    document.querySelectorAll('.station-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-station') === id.toString());
    });

    if (id > 0 && !audioCtx) {
        audioCtx = initAudio();
    }
}

// --- Main Loop ---
const clock = new THREE.Clock();
let timeOfDay = Math.PI / 4; // 6am

function animate() {
    requestAnimationFrame(animate);
    if (state.isPaused) return;

    const delta = clock.getDelta();

    // Time logic
    const CYCLE_DURATION_MS = 210000;
    const now = Date.now() + (window.serverTimeOffset || 0);
    const secondsInCycle = (now % CYCLE_DURATION_MS) / 1000;
    let warpedProgress;
    if (secondsInCycle < 60) warpedProgress = 0.25 + (secondsInCycle / 60) * 0.25;
    else if (secondsInCycle < 120) warpedProgress = 0.5 + ((secondsInCycle - 60) / 60) * 0.25;
    else if (secondsInCycle < 180) warpedProgress = 0.75 + ((secondsInCycle - 120) / 60) * 0.25;
    else warpedProgress = ((secondsInCycle - 180) / 30) * 0.25;
    timeOfDay = warpedProgress * Math.PI * 2;

    // Movement
    if (keys.ArrowUp) state.flightSpeedMultiplier = Math.min(2.0, state.flightSpeedMultiplier + delta * 0.5);
    if (keys.ArrowDown) state.flightSpeedMultiplier = Math.max(0, state.flightSpeedMultiplier - delta * 0.5);

    playerPlane.group.rotation.x = THREE.MathUtils.lerp(playerPlane.group.rotation.x, state.mouseY * (Math.PI / 4), TURN_SPEED);
    playerPlane.group.rotation.z = THREE.MathUtils.lerp(playerPlane.group.rotation.z, -state.mouseX * (Math.PI / 3), TURN_SPEED);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(playerPlane.group.quaternion);
    playerPlane.group.position.add(forward.multiplyScalar(BASE_FLIGHT_SPEED * state.flightSpeedMultiplier));

    const elev = getElevation(playerPlane.group.position.x, playerPlane.group.position.z);
    if (playerPlane.group.position.y < elev + 5.5) playerPlane.group.position.y = elev + 5.5;

    // Propeller
    playerPlane.propeller.rotation.z += 15 * Math.max(0.2, state.flightSpeedMultiplier) * delta;

    // Update modules
    updateChunks();
    const weatherNoise = (simplex.noise2D(playerPlane.group.position.x * 0.00001, playerPlane.group.position.z * 0.00001) + 1) / 2;
    updateSky(timeOfDay, sunMesh, moonMesh, dirLight, skyGroup, camera, scene, hemiLight, starsMat, weatherNoise);
    updateHUD(timeOfDay, playerPlane.group, state.flightSpeedMultiplier, BASE_FLIGHT_SPEED);

    // Camera
    const camOffset = new THREE.Vector3(0, 5, 25).applyQuaternion(playerPlane.group.quaternion);
    camera.position.lerp(playerPlane.group.position.clone().add(camOffset), 0.1);
    camera.lookAt(playerPlane.group.position);

    // Sync
    if (Math.floor(clock.elapsedTime * 10) % 2 === 0) {
        syncLocation(db, state.playerUid, playerPlane.group, state.flightSpeedMultiplier);
    }

    if (state.currentStation >= 4) {
        playProceduralNote(state.currentStation);
    }

    renderer.render(scene, camera);
}

animate();

// Event listeners for UI
document.querySelectorAll('.station-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const s = btn.getAttribute('data-station');
        setStation(s === 'procedural' ? 4 : parseInt(s));
    });
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Implementation of pause and customization
const pauseOverlay = document.getElementById('pause-overlay');
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        state.isPaused = !state.isPaused;
        pauseOverlay.style.display = state.isPaused ? 'flex' : 'none';
        if (!state.isPaused) clock.getDelta();
    }
});
document.getElementById('resume-btn').addEventListener('click', () => {
    state.isPaused = false;
    pauseOverlay.style.display = 'none';
    clock.getDelta();
});
