// --- SCENE, CAMERA, RENDERER, LIGHTS, SKY ---
// Dependencies: THREE (CDN)

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0d8ef);
scene.fog = new THREE.FogExp2(0xa0d8ef, 0.00005);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Lights
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemiLight.position.set(0, 500, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xfff0dd, 0.8);
scene.add(dirLight);

const moonLight = new THREE.DirectionalLight(0xbad2ff, 0.3); // Cool moonlight
scene.add(moonLight);

// --- DAY / NIGHT CYCLE SETUP ---
// timeOfDay goes from 0 to 2PI (0 = midnight, PI/2 = 6am, PI = noon, 3PI/2 = 6pm)
let timeOfDay = Math.PI * (5.5 / 12); // Start at 05:30 to catch the heart of the sunrise transition
const BASE_DAY_SPEED = 0.02;
let daySpeedMultiplier = 1;

// Sky Objects Group (follows player, hosts celestial bodies)
const skyGroup = new THREE.Group();
scene.add(skyGroup);

// Sun
const sunGeo = new THREE.SphereGeometry(400, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffddaa, fog: false });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
skyGroup.add(sunMesh);

// Moon
const moonGeo = new THREE.SphereGeometry(240, 32, 32);
const moonMat = new THREE.MeshBasicMaterial({ color: 0xddddff, fog: false });
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
skyGroup.add(moonMesh);

// Stars
const starsGeo = new THREE.BufferGeometry();
const starsCount = 2000;
const starsPos = new Float32Array(starsCount * 3);
const _starsRng = ChillFlightLogic.mulberry32(ChillFlightLogic.WORLD_SEED + 1);
for (let i = 0; i < starsCount * 3; i += 3) {
    const u = _starsRng();
    const v = _starsRng();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 7000 + _starsRng() * 2000;
    starsPos[i] = r * Math.sin(phi) * Math.cos(theta);
    starsPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
    starsPos[i + 2] = r * Math.cos(phi);
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 20, sizeAttenuation: true, fog: false, transparent: true });
const starsMesh = new THREE.Points(starsGeo, starsMat);
skyGroup.add(starsMesh);
