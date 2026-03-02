// --- CHILL FLIGHT LOGIC ---
// Pure, side-effect-free functions extracted for testability.
// Works in both Node.js (CommonJS) and the browser (exposes window.ChillFlightLogic).

(function (exports) {

    // --- WORLD SEED ---
    // Controls all procedural world generation. Change this to produce a different world.
    // TODO: in a future iteration, allow overriding via ?seed=N URL param or the pause-menu UI.
    const WORLD_SEED = 42;

    // --- SEEDED PRNG: Mulberry32 ---
    // Returns a closure that produces deterministic floats in [0, 1).
    // Usage: const rng = mulberry32(seed); rng(); // next value
    function mulberry32(seed) {
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    // Per-chunk seeded PRNG. Derives a unique seed from (WORLD_SEED, chunkX, chunkZ) so
    // each chunk's detail generation (trees, clouds, birds) is identical regardless of
    // which order chunks are loaded—critical for multiplayer consistency.
    function chunkRng(chunkX, chunkZ) {
        const s = (WORLD_SEED * 1000003) ^ (chunkX * 374761393 + chunkZ * 1234567891);
        return mulberry32(s);
    }

    // --- PLANE COLOR ---
    // Deterministic color picker based on a hash of the user's UID.
    const PLANE_COLORS = [
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

    function getPlaneColor(uid) {
        if (!uid) return PLANE_COLORS[0];
        let hash = 0;
        for (let i = 0; i < uid.length; i++) {
            hash = uid.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % PLANE_COLORS.length;
        return PLANE_COLORS[index];
    }

    // --- DAY / NIGHT WARP ---
    // Maps a position within a 330-second cycle to a normalized progress value [0, 1).
    // Segments (in seconds):
    //   0   –  60 → day     (progress 0.25 – 0.50)  [60s]
    //   60  – 180 → sunset  (progress 0.50 – 0.75) [120s]
    //   180 – 210 → night   (progress 0.75 – 1.00)  [30s]
    //   210 – 330 → sunrise (progress 0.00 – 0.25) [120s]
    function computeTimeOfDay(secondsInCycle) {
        const CYCLE_DURATION_S = 300;
        const linearProgress = (secondsInCycle % CYCLE_DURATION_S) / CYCLE_DURATION_S;
        const warpAmplitude = 0.07;
        // Progress 0.0 = Midnight (6 hours before Sunrise at 0.25)
        const currentWarpedProgress = linearProgress + warpAmplitude * Math.sin(4 * Math.PI * linearProgress);
        return currentWarpedProgress;
    }

    // --- INPUT NORMALIZATION ---
    // Maps client pixel coordinates to a normalized range:
    //   x: [-1 (left), +1 (right)]
    //   y: [+1 (top),  -1 (bottom)]
    function computeInputPosition(clientX, clientY, width, height) {
        return {
            x: (clientX / width) * 2 - 1,
            y: -(clientY / height) * 2 + 1
        };
    }

    // --- COMPASS HEADING ---
    // Converts a plane's Y-rotation (radians) to one of 8 compass direction strings.
    function computeHeadingDirection(rotationY) {
        const dirs = ['N', 'NW', 'W', 'SW', 'S', 'SE', 'E', 'NE'];
        let heading = rotationY % (Math.PI * 2);
        if (heading < 0) heading += Math.PI * 2;
        const deg = heading * (180 / Math.PI);
        const sector = Math.floor(((deg + 22.5) % 360) / 45);
        return dirs[sector];
    }

    // --- BIOME ---
    // Returns a biome value in [-1, 1] for a given world (x, z) position.
    // Requires a simplex noise object with a noise2D(x, y) method.
    function getBiome(x, z, simplex) {
        let noise = simplex.noise2D(x * 0.00005 + 1000, z * 0.00005 + 1000) * 0.5;
        const mapScale = 10000;
        let biomeBase = 0;

        if (x > 0) biomeBase -= Math.min(1, x / mapScale);

        if (z > 0) {
            let mtnInf = Math.min(1, z / mapScale);
            if (x < 0) {
                const westDamp = Math.max(0, Math.min(1, 1 + x / 5000));
                mtnInf *= westDamp;
            }
            biomeBase += mtnInf;
        }

        return Math.max(-1, Math.min(1, biomeBase + noise));
    }

    // --- ELEVATION ---
    // Returns the terrain height (always >= WATER_LEVEL) for a given world (x, z) position.
    // Requires a simplex noise object and a constants object { WATER_LEVEL, MOUNTAIN_LEVEL }.
    // The lerp argument defaults to a simple linear interpolation if not provided.
    function getElevation(x, z, simplex, constants, lerp) {
        const { WATER_LEVEL } = constants;
        const _lerp = lerp || function (a, b, t) { return a + (b - a) * t; };

        const biome = getBiome(x, z, simplex);

        let heightScale = 150;
        let offset = 60;
        let roughness = 50;
        let rockiness = 10;

        const westFactor = Math.max(0, Math.min(1, -x / 4500));

        // Noise damping for Ocean Biomes (biome < -0.2)
        // This makes the water perfectly flat by reducing the amplitude of terrain noise.
        let oceanDamping = 1.0;
        if (biome < -0.1) {
            oceanDamping = Math.max(0, 1.0 - ((-0.1 - biome) * 4));
            oceanDamping = Math.pow(oceanDamping, 2); // Sharper transition
        }

        if (biome < -0.2) {
            const t = Math.min(1, (-0.2 - biome) * 3);
            offset = _lerp(60, -55, t);
            heightScale = _lerp(150, 100, t);
            roughness = _lerp(50, 20, t);
        } else if (biome > 0.2) {
            const t = Math.min(1, (biome - 0.2) * 3);
            offset = _lerp(60, 20, t);
            heightScale = _lerp(150, 250, t);
            roughness = _lerp(50, 100, t);
            rockiness = _lerp(10, 30, t);
        }

        if (x < 0) {
            heightScale *= (1 - westFactor * 0.8);
            offset = _lerp(offset, 65, westFactor);
            roughness *= (1 - westFactor * 0.7);
            rockiness *= (1 - westFactor * 0.9);
        }

        let n = simplex.noise2D(x * 0.001, z * 0.001) * heightScale * oceanDamping;

        if (biome > 0.2) {
            const t = Math.min(1, (biome - 0.2) * 3);
            let ridge = 1.0 - Math.abs(simplex.noise2D(x * 0.0008, z * 0.0008));
            n += (ridge * 220 - 100) * t * (1 - westFactor);
        }

        n += simplex.noise2D(x * 0.003, z * 0.003) * roughness * oceanDamping;
        n += simplex.noise2D(x * 0.01, z * 0.01) * rockiness * oceanDamping;

        if (biome < -0.4) {
            const clusterChance = simplex.noise2D(x * 0.0002, z * 0.0002);
            if (clusterChance > 0.4) {
                const islandNoise = simplex.noise2D(x * 0.005, z * 0.005);
                if (islandNoise > 0) {
                    n += islandNoise * 80 * (clusterChance - 0.4) * 2 * oceanDamping;
                }
            }
        }

        n += offset;

        // --- RIVER CARVING LOGIC ---
        // Define a meandering path running East-West around the equator (Z = 0)
        // Use multiple frequencies of noise for more natural, unpredictable bends
        let riverCenterZ = simplex.noise2D(x * 0.0003, 0) * 800; // Master sweeping curve
        riverCenterZ += simplex.noise2D(x * 0.001, 100) * 200;    // Tighter, secondary zig-zags

        const distToRiver = Math.abs(z - riverCenterZ);

        // Vary the width of the river to break up uniformity
        const widthNoise = simplex.noise2D(x * 0.0005, 200);
        const widthVariation = (widthNoise + 1) * 0.5; // Map from [-1, 1] to [0, 1]

        const riverWidth = 80 + (widthVariation * 220); // River width fluctuates between 80 and 300
        const riverBankWidth = 100 + (widthVariation * 100); // Bank width also fluctuates


        // Calculate river factor
        let riverFactor = 0;
        if (distToRiver <= riverWidth) {
            riverFactor = 1.0;
        } else if (distToRiver < riverWidth + riverBankWidth) {
            // Smooth transition zone
            const t = (distToRiver - riverWidth) / riverBankWidth;
            // Smoothstep curve for natural banks
            riverFactor = 1.0 - (t * t * (3 - 2 * t));
        }

        if (riverFactor > 0) {
            // Carve down to just below water level
            n = _lerp(n, WATER_LEVEL - 2, riverFactor);
        }

        // Strict water level clamping
        if (n < WATER_LEVEL) {
            n = WATER_LEVEL;
        }
        return n;
    }

    // --- EXPORTS ---
    exports.WORLD_SEED = WORLD_SEED;
    exports.mulberry32 = mulberry32;
    exports.chunkRng = chunkRng;
    exports.PLANE_COLORS = PLANE_COLORS;
    exports.getPlaneColor = getPlaneColor;
    exports.computeTimeOfDay = computeTimeOfDay;
    exports.computeInputPosition = computeInputPosition;
    exports.computeHeadingDirection = computeHeadingDirection;
    exports.getBiome = getBiome;
    exports.getElevation = getElevation;

}(typeof module !== 'undefined' ? module.exports : (window.ChillFlightLogic = {})));
