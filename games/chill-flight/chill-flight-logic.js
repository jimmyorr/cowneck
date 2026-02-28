// --- CHILL FLIGHT LOGIC ---
// Pure, side-effect-free functions extracted for testability.
// Works in both Node.js (CommonJS) and the browser (exposes window.ChillFlightLogic).

(function (exports) {

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
    // Maps a position within a 210-second cycle to a normalized progress value [0, 1).
    // Segments (in seconds):
    //   0   – 60  → day    (progress 0.25 – 0.50)
    //   60  – 120 → sunset (progress 0.50 – 0.75)
    //   120 – 180 → night  (progress 0.75 – 1.00)
    //   180 – 210 → sunrise(progress 0.00 – 0.25)
    function computeTimeOfDay(secondsInCycle) {
        if (secondsInCycle < 60) {
            return 0.25 + (secondsInCycle / 60) * 0.25;
        } else if (secondsInCycle < 120) {
            return 0.5 + ((secondsInCycle - 60) / 60) * 0.25;
        } else if (secondsInCycle < 180) {
            return 0.75 + ((secondsInCycle - 120) / 60) * 0.25;
        } else {
            return ((secondsInCycle - 180) / 30) * 0.25;
        }
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

        let n = simplex.noise2D(x * 0.001, z * 0.001) * heightScale;

        if (biome > 0.2) {
            const t = Math.min(1, (biome - 0.2) * 3);
            let ridge = 1.0 - Math.abs(simplex.noise2D(x * 0.0008, z * 0.0008));
            n += (ridge * 220 - 100) * t * (1 - westFactor);
        }

        n += simplex.noise2D(x * 0.003, z * 0.003) * roughness;
        n += simplex.noise2D(x * 0.01, z * 0.01) * rockiness;

        if (biome < -0.4) {
            const clusterChance = simplex.noise2D(x * 0.0002, z * 0.0002);
            if (clusterChance > 0.4) {
                const islandNoise = simplex.noise2D(x * 0.005, z * 0.005);
                if (islandNoise > 0) {
                    n += islandNoise * 80 * (clusterChance - 0.4) * 2;
                }
            }
        }

        n += offset;

        if (n < WATER_LEVEL) {
            if (x < 0 && westFactor > 0.5) {
                n = _lerp(n, WATER_LEVEL + 5, (westFactor - 0.5) * 2);
            } else {
                n = WATER_LEVEL;
            }
        }
        return n;
    }

    // --- EXPORTS ---
    exports.PLANE_COLORS = PLANE_COLORS;
    exports.getPlaneColor = getPlaneColor;
    exports.computeTimeOfDay = computeTimeOfDay;
    exports.computeInputPosition = computeInputPosition;
    exports.computeHeadingDirection = computeHeadingDirection;
    exports.getBiome = getBiome;
    exports.getElevation = getElevation;

}(typeof module !== 'undefined' ? module.exports : (window.ChillFlightLogic = {})));
