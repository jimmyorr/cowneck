// --- CONSTANTS ---
// Terrain parameters
const CHUNK_SIZE = 1500;
let SEGMENTS = 40;
const WATER_LEVEL = 40;
const MOUNTAIN_LEVEL = 180;
let RENDER_DISTANCE = 2;

// Flight parameters
const BASE_FLIGHT_SPEED = 2.5;
const TURN_SPEED = 0.03;
let flightSpeedMultiplier = 1;

// Feature Flags
const ENABLE_PAGODAS = false;
const ENABLE_BARNS = false;
const ENABLE_MONASTERIES = true;
const ENABLE_CASTLE_RUINS = false;

const THEME = new URLSearchParams(window.location.search).get('theme') || 'standard';

function createMaterial(params) {
    // Make a copy of params to avoid mutating the original
    const newParams = { ...params };

    switch (THEME) {
        case 'toon':
            delete newParams.roughness;
            delete newParams.metalness;
            delete newParams.envMap;
            delete newParams.envMapIntensity;
            return new THREE.MeshToonMaterial(newParams);

        case 'basic':
            // Flat, unlit colors - completely ignores lighting
            delete newParams.roughness;
            delete newParams.metalness;
            return new THREE.MeshBasicMaterial(newParams);

        case 'phong':
            // Shiny, plastic-like appearance
            delete newParams.roughness;
            delete newParams.metalness;
            newParams.shininess = 60; // Add some specular shine
            return new THREE.MeshPhongMaterial(newParams);

        case 'lambert':
            // Matte, non-shiny surface (often used for retro low-poly)
            delete newParams.roughness;
            delete newParams.metalness;
            return new THREE.MeshLambertMaterial(newParams);

        case 'normal':
            // Psychedelic look based on object normals (ignores color completely)
            return new THREE.MeshNormalMaterial({ flatShading: params.flatShading });

        case 'wireframe':
            // The Matrix or Tron aesthetic - just lines!
            newParams.wireframe = true;
            return new THREE.MeshBasicMaterial(newParams);

        case 'standard':
        default:
            return new THREE.MeshStandardMaterial(params);
    }
}
