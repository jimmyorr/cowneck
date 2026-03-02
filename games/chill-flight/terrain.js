// --- PROCEDURAL TERRAIN & CHUNKS ---
// Dependencies: THREE, simplex, CHUNK_SIZE, SEGMENTS, WATER_LEVEL, MOUNTAIN_LEVEL, scene

const chunks = new Map();

// Materials for terrain
const terrainMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.8
});

const waterMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    metalness: 0.1,
    roughness: 0.05,
    flatShading: true
});

// Reusable tree geometries for forest instances
const treeTrunkGeo = new THREE.CylinderGeometry(2, 2, 10, 5);
treeTrunkGeo.translate(0, 5, 0);
const treeLeavesGeo = new THREE.ConeGeometry(8, 20, 5);
treeLeavesGeo.translate(0, 15, 0);

const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });
const treeLeavesMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32, flatShading: true });
const snowTreeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x4E342E, flatShading: true });
const snowTreeLeavesMat = new THREE.MeshStandardMaterial({ color: 0xE0F7FA, flatShading: true });

// Autumn & Cherry Blossom materials
const autumnLeavesMat1 = new THREE.MeshStandardMaterial({ color: 0xD35400, flatShading: true }); // Burnt Orange
const autumnLeavesMat2 = new THREE.MeshStandardMaterial({ color: 0xF39C12, flatShading: true }); // Orange
const autumnLeavesMat3 = new THREE.MeshStandardMaterial({ color: 0xC0392B, flatShading: true }); // Strong Red
const cherryBlossomMat = new THREE.MeshStandardMaterial({ color: 0xF8BBD0, flatShading: true }); // Pink

// Reusable house geometries
const houseBodyGeo = new THREE.BoxGeometry(10, 8, 10);
houseBodyGeo.translate(0, 4, 0);
const houseRoofGeo = new THREE.ConeGeometry(8.5, 6, 4);
houseRoofGeo.rotateY(Math.PI / 4);
houseRoofGeo.translate(0, 11, 0);
const houseWindowGeo = new THREE.BoxGeometry(2.5, 3.5, 0.5);

const houseBodyMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, flatShading: true });
const houseRoofMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });

// Window Materials (5 variations for staggered lighting)
const houseWindowMats = [];
for (let i = 0; i < 5; i++) {
    houseWindowMats.push(new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: 0xFFD54F,
        emissiveIntensity: 0.0,
        roughness: 0
    }));
}

// Bird geometry
const birdBodyGeo = new THREE.BoxGeometry(1, 0.8, 4);
const birdWingGeo = new THREE.BoxGeometry(6, 0.1, 2);
birdWingGeo.translate(3, 0, 0);
const birdHeadGeo = new THREE.ConeGeometry(0.5, 1.5, 4);
birdHeadGeo.rotateX(-Math.PI / 2);
birdHeadGeo.translate(0, 0, -2);
const hawkMat = new THREE.MeshStandardMaterial({ color: 0x442200, flatShading: true });

// Windmill geometries
const windmillBaseGeo = new THREE.CylinderGeometry(5, 8, 30, 6);
windmillBaseGeo.translate(0, 15, 0);
const windmillBladesGeo = new THREE.BoxGeometry(2, 30, 0.5);
windmillBladesGeo.translate(0, 15, 0); // Rotate around bottom center
const windmillBaseMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, flatShading: true });
const windmillBladesMat = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, flatShading: true });

// Lighthouse geometries
const lighthousePieceGeo = new THREE.CylinderGeometry(8, 8, 20, 8);
const lighthouseTopGeo = new THREE.SphereGeometry(10, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
lighthouseTopGeo.translate(0, 60, 0);

const lighthouseRedMat = new THREE.MeshStandardMaterial({ color: 0xC62828, flatShading: true });
const lighthouseWhiteMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, flatShading: true });

// Pier geometries
const pierDeckGeo = new THREE.BoxGeometry(15, 2, 30);
pierDeckGeo.translate(0, 1, 15); // Extend from shore
const pierPostGeo = new THREE.CylinderGeometry(1, 1, 10, 6);
const woodMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });

// Campfire geometries
const fireLogGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 6);
fireLogGeo.rotateZ(Math.PI / 2);
const fireCoreGeo = new THREE.SphereGeometry(2, 8, 8);
const fireMat = new THREE.MeshStandardMaterial({ color: 0xFF4500, emissive: 0xFF4500, emissiveIntensity: 2.0 });

// Smoke geometry and material community
const smokeGeo = new THREE.BoxGeometry(2, 2, 2);
const smokeMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.4,
    flatShading: true
});

// Lighthouse Beam geometry - narrow (2) at lighthouse, wide (20) at tip community
const lighthouseBeamGeo = new THREE.CylinderGeometry(20, 2, 300, 16, 1, true);
lighthouseBeamGeo.rotateX(Math.PI / 2);
lighthouseBeamGeo.translate(0, 0, 150);
const lighthouseBeamMat = new THREE.MeshBasicMaterial({
    color: 0xFFFF99,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
});

function getBiome(x, z) {
    return ChillFlightLogic.getBiome(x, z, simplex);
}

function getElevation(x, z) {
    return ChillFlightLogic.getElevation(
        x, z, simplex,
        { WATER_LEVEL, MOUNTAIN_LEVEL },
        THREE.MathUtils.lerp
    );
}

function generateChunk(chunkX, chunkZ) {
    const rng = ChillFlightLogic.chunkRng(chunkX, chunkZ);
    const group = new THREE.Group();

    // 1. Generate Terrain Mesh
    const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, SEGMENTS, SEGMENTS);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position.array;
    const colors = [];
    const colorObj = new THREE.Color();

    const worldOffsetX = chunkX * CHUNK_SIZE;
    const worldOffsetZ = chunkZ * CHUNK_SIZE;

    const treePositions = [];
    const snowTreePositions = [];
    const autumnTree1Positions = [];
    const autumnTree2Positions = [];
    const autumnTree3Positions = [];
    const cherryTreePositions = [];
    const housePositions = [];
    const windmillPositions = [];
    let lighthousePos = null;
    const pierPositions = [];
    const campfirePositions = [];
    const chimneySmokePositions = [];
    let hasWater = false;

    for (let i = 0; i < positions.length; i += 3) {
        const localX = positions[i];
        const localZ = positions[i + 2];
        const worldX = worldOffsetX + localX;
        const worldZ = worldOffsetZ + localZ;

        const height = getElevation(worldX, worldZ);
        positions[i + 1] = height;

        const northInfluence = Math.max(0, -worldZ / 4500);
        const tempNoise = simplex.noise2D(worldX * 0.0001, worldZ * 0.0001);
        const snowFactor = Math.max(0, Math.min(1, (northInfluence + tempNoise * 0.05 - 0.8) * 5));

        const southInfluence = Math.max(0, worldZ / 4500);
        const desertFactor = Math.max(0, Math.min(1, (southInfluence + tempNoise * 0.05 - 0.8) * 5));

        const colorPlains = new THREE.Color(0x7CB342);
        const colorForest = new THREE.Color(0x388E3C);
        const colorSnow = new THREE.Color(0xFFFFFF);
        const colorDesert = new THREE.Color(0xE2725B);
        const colorSand = new THREE.Color(0xE0E0A8);
        const colorDesertSand = new THREE.Color(0xF4A460);
        const colorWater = new THREE.Color(0x40C4FF);
        const colorIcyWater = new THREE.Color(0x88CCFF);
        const colorDesertWater = new THREE.Color(0x00CED1);
        const colorFoam = new THREE.Color(0xEEEEEE);

        const temperature = tempNoise - (northInfluence * 1.5);
        const isSnowBiome = snowFactor > 0.5;

        if (height <= WATER_LEVEL + 2) {
            if (height <= WATER_LEVEL) {
                hasWater = true;
                positions[i + 1] = height - 5; // Drop seafloor so moving water waves don't clip into it
                colorObj.copy(colorSand);
                if (snowFactor > 0) colorObj.lerp(new THREE.Color(0x999999), snowFactor);
                if (desertFactor > 0) colorObj.lerp(colorDesertSand, desertFactor);
            } else if (height <= WATER_LEVEL + 0.5) {
                colorObj.copy(colorFoam);
                if (snowFactor > 0) colorObj.lerp(colorSnow, snowFactor);
            } else {
                colorObj.copy(colorSand);
                if (snowFactor > 0) colorObj.lerp(new THREE.Color(0xDDDDDD), snowFactor);
                if (desertFactor > 0) colorObj.lerp(new THREE.Color(0xF4A460), desertFactor);
            }
        } else if (height > MOUNTAIN_LEVEL || (snowFactor > 0.5 && height > MOUNTAIN_LEVEL - 50)) {
            if (height > MOUNTAIN_LEVEL + 40 || snowFactor > 0.8) {
                colorObj.copy(colorSnow);
            } else {
                colorObj.setHex(desertFactor > 0.5 ? 0xCD853F : 0x7F8C8D);
            }
        } else {
            const isForest = simplex.noise2D(worldX * 0.005 + 100, worldZ * 0.005) > 0.2;
            const autumnNoise = simplex.noise2D(worldX * 0.0003 + 500, worldZ * 0.0003 + 500);
            const cherryNoise = simplex.noise2D(worldX * 0.0005 + 1000, worldZ * 0.0005 + 1000);

            // Normalize density so higher SEGMENTS doesn't mean more trees/houses
            const densityFactor = 40 / SEGMENTS;
            const densityScale = densityFactor * densityFactor;

            if (isForest) {
                colorObj.copy(colorForest);
                if (snowFactor > 0) colorObj.lerp(new THREE.Color(0x8BA192), snowFactor);
                if (desertFactor > 0) colorObj.lerp(new THREE.Color(0xA0522D), desertFactor);

                // Color the terrain slightly based on trees
                if (autumnNoise > 0.4 && snowFactor < 0.2) {
                    colorObj.lerp(new THREE.Color(0x6D4C41), 0.3); // Brownish ground for autumn
                } else if (cherryNoise > 0.6 && snowFactor < 0.2) {
                    colorObj.lerp(new THREE.Color(0xF8BBD0), 0.2); // Pinkish ground for blossoms
                }

                const treeRoll = rng();
                if (treeRoll < (desertFactor > 0.5 ? 0.05 : 0.15) * densityScale) {
                    if (snowFactor > 0.4) {
                        snowTreePositions.push({ x: localX, y: height, z: localZ });
                    } else if (desertFactor < 0.6) {
                        if (cherryNoise > 0.65) {
                            cherryTreePositions.push({ x: localX, y: height, z: localZ });
                        } else if (autumnNoise > 0.45) {
                            const variety = rng();
                            if (variety < 0.33) autumnTree1Positions.push({ x: localX, y: height, z: localZ });
                            else if (variety < 0.66) autumnTree2Positions.push({ x: localX, y: height, z: localZ });
                            else autumnTree3Positions.push({ x: localX, y: height, z: localZ });
                        } else {
                            treePositions.push({ x: localX, y: height, z: localZ });
                        }
                    }
                } else if (treeRoll < (desertFactor > 0.5 ? 0.051 : 0.155) * densityScale) {
                    // Campfires in forest community - mutually exclusive with trees
                    const offX = (rng() - 0.5) * 15;
                    const offZ = (rng() - 0.5) * 15;
                    const h = getElevation(worldX + offX, worldZ + offZ);
                    campfirePositions.push({ x: localX + offX, y: h, z: localZ + offZ });
                }
            } else {
                colorObj.copy(colorPlains);
                if (snowFactor > 0) colorObj.lerp(new THREE.Color(0xFAFAFA), snowFactor);
                if (desertFactor > 0) colorObj.lerp(colorDesertSand, desertFactor);

                if (rng() < (desertFactor > 0.5 ? 0.002 : 0.005) * densityScale) {
                    housePositions.push({ x: localX, y: height, z: localZ, rotY: rng() * Math.PI * 2 });
                    // Chimney smoke for houses in snowy areas
                    if (snowFactor > 0.3) {
                        chimneySmokePositions.push({ x: localX, y: height + 10, z: localZ });
                    }
                } else if (rng() < 0.001 * densityScale && height > WATER_LEVEL + 5 && height < MOUNTAIN_LEVEL - 100 && desertFactor < 0.3 && snowFactor < 0.3) {
                    // Windmills in temperate plains
                    windmillPositions.push({ x: localX, y: height, z: localZ, rotY: rng() * Math.PI * 2 });
                } else if (!lighthousePos && rng() < 0.002 * densityScale && worldX > 3000 && height > WATER_LEVEL && height < WATER_LEVEL + 10) {
                    // Lighthouses on Eastern islands - Max 1 per chunk community
                    lighthousePos = { x: localX, y: height, z: localZ, rotY: rng() * Math.PI * 2 };
                }

                // Piers near shore community
                if (height > WATER_LEVEL + 0.5 && height < WATER_LEVEL + 3 && rng() < 0.15 * densityScale) { // Increased from 0.05 community
                    // Check neighbors to align with water community
                    const hN = getElevation(worldX, worldZ - 20);
                    const hS = getElevation(worldX, worldZ + 20);
                    const hE = getElevation(worldX + 20, worldZ);
                    const hW = getElevation(worldX - 20, worldZ);

                    let angleToWater = -1;
                    if (hN <= WATER_LEVEL) angleToWater = Math.PI;
                    else if (hS <= WATER_LEVEL) angleToWater = 0;
                    else if (hE <= WATER_LEVEL) angleToWater = -Math.PI / 2;
                    else if (hW <= WATER_LEVEL) angleToWater = Math.PI / 2;

                    if (angleToWater !== -1) {
                        pierPositions.push({ x: localX, y: height, z: localZ, rotY: angleToWater });
                    }
                }
            }
        }

        colors.push(colorObj.r, colorObj.g, colorObj.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, terrainMaterial);
    mesh.position.set(worldOffsetX, 0, worldOffsetZ);
    group.add(mesh);

    // 1.5 Generate Water Plane
    if (hasWater) {
        const wSegments = Math.max(1, Math.floor(SEGMENTS / 4));
        const waterGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, wSegments, wSegments);
        waterGeo.rotateX(-Math.PI / 2);
        const wPositions = waterGeo.attributes.position.array;
        const wColors = [];
        for (let i = 0; i < wPositions.length; i += 3) {
            const worldX = worldOffsetX + wPositions[i];
            const worldZ = worldOffsetZ + wPositions[i + 2];

            wPositions[i + 1] = WATER_LEVEL;

            const tempNoise = simplex.noise2D(worldX * 0.0001, worldZ * 0.0001);
            const northInfluence = Math.max(0, -worldZ / 4500);
            const southInfluence = Math.max(0, worldZ / 4500);
            const snowFactor = Math.max(0, Math.min(1, (northInfluence + tempNoise * 0.05 - 0.8) * 5));
            const desertFactor = Math.max(0, Math.min(1, (southInfluence + tempNoise * 0.05 - 0.8) * 5));

            const colorObj = new THREE.Color(0x40C4FF);
            if (snowFactor > 0) colorObj.lerp(new THREE.Color(0x88CCFF), snowFactor);
            if (desertFactor > 0) colorObj.lerp(new THREE.Color(0x00CED1), desertFactor);

            wColors.push(colorObj.r, colorObj.g, colorObj.b);
        }
        waterGeo.setAttribute('color', new THREE.Float32BufferAttribute(wColors, 3));
        const waterMesh = new THREE.Mesh(waterGeo, waterMaterial);
        waterMesh.position.set(worldOffsetX, 0, worldOffsetZ);
        group.add(waterMesh);
        group.userData.water = waterMesh; // accessible for animation!
    }

    // 2. Generate Trees
    const dummy = new THREE.Object3D();

    if (treePositions.length > 0) {
        const trunkInst = new THREE.InstancedMesh(treeTrunkGeo, treeTrunkMat, treePositions.length);
        const leavesInst = new THREE.InstancedMesh(treeLeavesGeo, treeLeavesMat, treePositions.length);

        treePositions.forEach((pos, index) => {
            const scale = 0.8 + rng() * 0.6;
            dummy.position.set(pos.x, pos.y, pos.z);
            dummy.scale.set(scale, scale, scale);
            dummy.rotation.y = rng() * Math.PI * 2;
            dummy.updateMatrix();
            trunkInst.setMatrixAt(index, dummy.matrix);
            leavesInst.setMatrixAt(index, dummy.matrix);
        });

        trunkInst.position.set(worldOffsetX, 0, worldOffsetZ);
        leavesInst.position.set(worldOffsetX, 0, worldOffsetZ);
        group.add(trunkInst);
        group.add(leavesInst);
    }

    // --- NEW TREE VARIATIONS ---
    const treeVariations = [
        { pos: autumnTree1Positions, mat: autumnLeavesMat1 },
        { pos: autumnTree2Positions, mat: autumnLeavesMat2 },
        { pos: autumnTree3Positions, mat: autumnLeavesMat3 },
        { pos: cherryTreePositions, mat: cherryBlossomMat }
    ];

    treeVariations.forEach(variation => {
        if (variation.pos.length > 0) {
            const trunkInst = new THREE.InstancedMesh(treeTrunkGeo, treeTrunkMat, variation.pos.length);
            const leavesInst = new THREE.InstancedMesh(treeLeavesGeo, variation.mat, variation.pos.length);

            variation.pos.forEach((pos, index) => {
                const scale = 0.8 + rng() * 0.6;
                dummy.position.set(pos.x, pos.y, pos.z);
                dummy.scale.set(scale, scale, scale);
                dummy.rotation.y = rng() * Math.PI * 2;
                dummy.updateMatrix();
                trunkInst.setMatrixAt(index, dummy.matrix);
                leavesInst.setMatrixAt(index, dummy.matrix);
            });

            trunkInst.position.set(worldOffsetX, 0, worldOffsetZ);
            leavesInst.position.set(worldOffsetX, 0, worldOffsetZ);
            group.add(trunkInst);
            group.add(leavesInst);
        }
    });

    // 2.5 Generate Houses
    if (housePositions.length > 0) {
        const bodyInst = new THREE.InstancedMesh(houseBodyGeo, houseBodyMat, housePositions.length);
        const roofInst = new THREE.InstancedMesh(houseRoofGeo, houseRoofMat, housePositions.length);

        const windowPools = [];
        const poolCounts = [0, 0, 0, 0, 0];
        const houseToPool = [];

        housePositions.forEach((pos, idx) => {
            const poolId = Math.floor(rng() * 5);
            houseToPool[idx] = poolId;
            poolCounts[poolId]++;
        });

        for (let i = 0; i < 5; i++) {
            windowPools[i] = new THREE.InstancedMesh(houseWindowGeo, houseWindowMats[i], poolCounts[i] * 2);
            windowPools[i].position.set(worldOffsetX, 0, worldOffsetZ);
            group.add(windowPools[i]);
        }

        const poolIndices = [0, 0, 0, 0, 0];

        housePositions.forEach((pos, index) => {
            dummy.position.set(pos.x, pos.y, pos.z);
            dummy.rotation.set(0, pos.rotY, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();

            bodyInst.setMatrixAt(index, dummy.matrix);
            roofInst.setMatrixAt(index, dummy.matrix);

            const poolId = houseToPool[index];
            const pIdx = poolIndices[poolId];

            const frontOffset = new THREE.Vector3(0, 4, 5.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), pos.rotY);
            const backOffset = new THREE.Vector3(0, 4, -5.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), pos.rotY);

            dummy.position.set(pos.x + frontOffset.x, pos.y + frontOffset.y, pos.z + frontOffset.z);
            dummy.rotation.set(0, pos.rotY, 0);
            dummy.updateMatrix();
            windowPools[poolId].setMatrixAt(pIdx * 2, dummy.matrix);

            dummy.position.set(pos.x + backOffset.x, pos.y + backOffset.y, pos.z + backOffset.z);
            dummy.rotation.set(0, pos.rotY, 0);
            dummy.updateMatrix();
            windowPools[poolId].setMatrixAt(pIdx * 2 + 1, dummy.matrix);

            poolIndices[poolId]++;
        });

        bodyInst.position.set(worldOffsetX, 0, worldOffsetZ);
        roofInst.position.set(worldOffsetX, 0, worldOffsetZ);
        group.add(bodyInst);
        group.add(roofInst);
    }

    // 2.7 Generate Windmills
    if (windmillPositions.length > 0) {
        const baseInst = new THREE.InstancedMesh(windmillBaseGeo, windmillBaseMat, windmillPositions.length);
        const bladesInst = new THREE.InstancedMesh(windmillBladesGeo, windmillBladesMat, windmillPositions.length * 4);

        windmillPositions.forEach((pos, index) => {
            // Base
            dummy.position.set(pos.x, pos.y, pos.z);
            dummy.rotation.set(0, pos.rotY, 0);
            dummy.scale.set(1.5, 1.5, 1.5);
            dummy.updateMatrix();
            baseInst.setMatrixAt(index, dummy.matrix);

            // Blades (initial state, will be updated in animate)
            for (let b = 0; b < 4; b++) {
                const bladeIdx = index * 4 + b;
                dummy.position.set(pos.x, pos.y + 45, pos.z);
                const hubOffset = new THREE.Vector3(0, 0, 8.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), pos.rotY);
                dummy.position.add(hubOffset);
                dummy.rotation.set(0, pos.rotY, (b * Math.PI / 2));
                dummy.updateMatrix();
                bladesInst.setMatrixAt(bladeIdx, dummy.matrix);
            }
        });

        baseInst.position.set(worldOffsetX, 0, worldOffsetZ);
        bladesInst.position.set(worldOffsetX, 0, worldOffsetZ);
        group.add(baseInst);
        group.add(bladesInst);

        // Store blade info for animation
        group.userData.windmillBlades = bladesInst;
        group.userData.windmillPositions = windmillPositions;
    }

    // 2.9 Generate Lighthouses
    if (lighthousePos) {
        const piece1Inst = new THREE.InstancedMesh(lighthousePieceGeo, lighthouseRedMat, 1);
        const piece2Inst = new THREE.InstancedMesh(lighthousePieceGeo, lighthouseWhiteMat, 1);
        const piece3Inst = new THREE.InstancedMesh(lighthousePieceGeo, lighthouseRedMat, 1);
        const topInst = new THREE.InstancedMesh(lighthouseTopGeo, lighthouseWhiteMat, 1);

        const pos = lighthousePos;
        dummy.position.set(pos.x, pos.y + 10, pos.z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        piece1Inst.setMatrixAt(0, dummy.matrix);

        dummy.position.set(pos.x, pos.y + 30, pos.z);
        dummy.updateMatrix();
        piece2Inst.setMatrixAt(0, dummy.matrix);

        dummy.position.set(pos.x, pos.y + 50, pos.z);
        dummy.updateMatrix();
        piece3Inst.setMatrixAt(0, dummy.matrix);

        dummy.position.set(pos.x, pos.y, pos.z);
        dummy.rotation.set(0, pos.rotY, 0);
        dummy.updateMatrix();
        topInst.setMatrixAt(0, dummy.matrix);

        const pieces = [piece1Inst, piece2Inst, piece3Inst, topInst];
        pieces.forEach(p => {
            p.position.set(worldOffsetX, 0, worldOffsetZ);
            group.add(p);
        });

        // Beam
        const beam = new THREE.Mesh(lighthouseBeamGeo, lighthouseBeamMat);
        beam.position.set(pos.x + worldOffsetX, pos.y + 65, pos.z + worldOffsetZ);
        beam.rotation.y = pos.rotY;
        beam.rotation.x = 0.15; // Tilt slightly downward community
        group.add(beam);
        group.userData.lighthouseBeam = beam;

        // Functional Light (SpotLight)
        const spotLight = new THREE.SpotLight(0xFFFF99, 50, 600, Math.PI / 8, 0.5, 1);
        spotLight.position.set(pos.x + worldOffsetX, pos.y + 65, pos.z + worldOffsetZ);
        // Initial target position matching beam rotation and tilted down community
        spotLight.target.position.set(
            pos.x + worldOffsetX + Math.sin(pos.rotY) * 100,
            pos.y + 65 - 15, // Aim lower community
            pos.z + worldOffsetZ + Math.cos(pos.rotY) * 100
        );
        group.add(spotLight);
        group.add(spotLight.target);
        group.userData.lighthouseLight = spotLight;
        group.userData.lighthouseTarget = spotLight.target;
    }

    // 2.95 Generate Piers
    if (pierPositions.length > 0) {
        const deckInst = new THREE.InstancedMesh(pierDeckGeo, woodMat, pierPositions.length);
        const postInst = new THREE.InstancedMesh(pierPostGeo, woodMat, pierPositions.length * 4);

        pierPositions.forEach((pos, index) => {
            dummy.position.set(pos.x, pos.y - 1, pos.z);
            dummy.rotation.set(0, pos.rotY, 0);
            dummy.updateMatrix();
            deckInst.setMatrixAt(index, dummy.matrix);

            // Posts
            const offsets = [[-6, 10], [6, 10], [-6, 25], [6, 25]];
            offsets.forEach((off, i) => {
                const p = new THREE.Vector3(off[0], -5, off[1]).applyAxisAngle(new THREE.Vector3(0, 1, 0), pos.rotY);
                dummy.position.set(pos.x + p.x, pos.y + p.y, pos.z + p.z);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                postInst.setMatrixAt(index * 4 + i, dummy.matrix);
            });
        });

        deckInst.position.set(worldOffsetX, 0, worldOffsetZ);
        postInst.position.set(worldOffsetX, 0, worldOffsetZ);
        group.add(deckInst);
        group.add(postInst);
    }

    // 2.96 Generate Campfires
    if (campfirePositions.length > 0) {
        const logInst = new THREE.InstancedMesh(fireLogGeo, woodMat, campfirePositions.length * 3);
        const coreInst = new THREE.InstancedMesh(fireCoreGeo, fireMat, campfirePositions.length);
        const smokeInst = new THREE.InstancedMesh(smokeGeo, smokeMat, campfirePositions.length * 5); // 5 particles per fire community

        campfirePositions.forEach((pos, index) => {
            // Logs in a tripod/teepee shape
            for (let i = 0; i < 3; i++) {
                dummy.position.set(pos.x, pos.y + 1, pos.z);
                dummy.rotation.set(0.5, (i * Math.PI * 2 / 3), 0);
                dummy.updateMatrix();
                logInst.setMatrixAt(index * 3 + i, dummy.matrix);
            }
            // Fire core
            dummy.position.set(pos.x, pos.y + 2, pos.z);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            coreInst.setMatrixAt(index, dummy.matrix);

            // Smoke community
            for (let i = 0; i < 5; i++) {
                dummy.position.set(pos.x, pos.y + 5 + i * 5, pos.z);
                dummy.scale.set(1 + i * 0.5, 1 + i * 0.5, 1 + i * 0.5);
                dummy.updateMatrix();
                smokeInst.setMatrixAt(index * 5 + i, dummy.matrix);
            }
        });

        logInst.position.set(worldOffsetX, 0, worldOffsetZ);
        coreInst.position.set(worldOffsetX, 0, worldOffsetZ);
        smokeInst.position.set(worldOffsetX, 0, worldOffsetZ);
        group.add(logInst);
        group.add(coreInst);
        group.add(smokeInst);

        group.userData.campfires = coreInst;
        group.userData.campfireSmoke = smokeInst;
        group.userData.campfirePositions = campfirePositions;
    }

    // 2.97 Generate Chimney Smoke
    if (chimneySmokePositions.length > 0) {
        const whiteSmokeMat = new THREE.MeshStandardMaterial({
            color: 0xDDDDDD,
            transparent: true,
            opacity: 0.6,
            flatShading: true
        });
        const chimneySmokeInst = new THREE.InstancedMesh(smokeGeo, whiteSmokeMat, chimneySmokePositions.length * 4);

        chimneySmokePositions.forEach((pos, index) => {
            for (let i = 0; i < 4; i++) {
                dummy.position.set(pos.x, pos.y + i * 4, pos.z);
                dummy.scale.set(0.8 + i * 0.3, 0.8 + i * 0.3, 0.8 + i * 0.3);
                dummy.updateMatrix();
                chimneySmokeInst.setMatrixAt(index * 4 + i, dummy.matrix);
            }
        });

        chimneySmokeInst.position.set(worldOffsetX, 0, worldOffsetZ);
        group.add(chimneySmokeInst);

        group.userData.chimneySmoke = chimneySmokeInst;
        group.userData.chimneySmokePositions = chimneySmokePositions;
    }

    // 3. Generate Clouds
    let cloudiness = (simplex.noise2D(chunkX * 0.1 + 500, chunkZ * 0.1) + 1) / 2;
    const cloudThreshold = 0.5;
    if (cloudiness < cloudThreshold) {
        cloudiness = 0;
    } else {
        cloudiness = (cloudiness - cloudThreshold) / (1 - cloudThreshold);
    }

    const numClouds = Math.floor(cloudiness * 40);

    const cloudGeo = new THREE.BoxGeometry(1, 1, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        flatShading: true,
        roughness: 1.0
    });

    for (let i = 0; i < numClouds; i++) {
        const cx = (rng() - 0.5) * CHUNK_SIZE;
        const cz = (rng() - 0.5) * CHUNK_SIZE;
        const cy = 350 + rng() * 150;

        const cloudGroup = new THREE.Group();
        const parts = 3 + Math.floor(rng() * 3);
        for (let p = 0; p < parts; p++) {
            const mesh = new THREE.Mesh(cloudGeo, cloudMat);
            mesh.position.set((rng() - 0.5) * 50, (rng() - 0.5) * 20, (rng() - 0.5) * 50);
            mesh.scale.set(40 + rng() * 60, 20 + rng() * 30, 40 + rng() * 60);
            mesh.rotation.y = rng() * Math.PI;
            cloudGroup.add(mesh);
        }
        cloudGroup.position.set(worldOffsetX + cx, cy, worldOffsetZ + cz);
        cloudGroup.userData.isCloud = true;
        group.add(cloudGroup);
    }

    // Store clouds for easy access in animate loop
    group.userData.clouds = group.children.filter(c => c.userData.isCloud);

    // 4. Generate Birds
    group.userData.birds = [];

    if (rng() < 0.20) {
        const baseX = worldOffsetX + (rng() - 0.5) * CHUNK_SIZE;
        const baseZ = worldOffsetZ + (rng() - 0.5) * CHUNK_SIZE;
        let baseY = getElevation(baseX, baseZ) + 150 + rng() * 200;
        if (baseY > 400) baseY = 400;

        const baseRotationY = rng() * Math.PI * 2;

        function assembleBird(mat, scale) {
            const bird = new THREE.Group();
            const body = new THREE.Mesh(birdBodyGeo, mat);
            const head = new THREE.Mesh(birdHeadGeo, mat);
            const wingL = new THREE.Mesh(birdWingGeo, mat);
            const wingR = new THREE.Mesh(birdWingGeo, mat);
            wingL.rotation.y = Math.PI;
            bird.add(body); bird.add(head); bird.add(wingL); bird.add(wingR);
            bird.scale.set(scale, scale, scale);
            bird.userData.wings = [wingL, wingR];
            return bird;
        }

        const hawk = assembleBird(hawkMat, 4.0);
        hawk.position.set(baseX, baseY, baseZ);
        hawk.rotation.y = baseRotationY;

        hawk.userData.type = 'hawk';
        hawk.userData.speed = 0.4;
        hawk.userData.circleSpeed = 0.3 + rng() * 0.2;
        hawk.userData.circleRadius = 150 + rng() * 100;
        hawk.userData.circleCenter = new THREE.Vector3(baseX, baseY, baseZ);
        hawk.userData.angle = rng() * Math.PI * 2;
        hawk.userData.flapPhase = 0;
        hawk.userData.flapSpeed = 2;

        group.add(hawk);
        group.userData.birds.push(hawk);
    }

    scene.add(group);
    return group;
}

function updateChunks() {
    const currentChunkX = Math.round(planeGroup.position.x / CHUNK_SIZE);
    const currentChunkZ = Math.round(planeGroup.position.z / CHUNK_SIZE);
    const renderDistance = RENDER_DISTANCE;

    for (let x = -renderDistance; x <= renderDistance; x++) {
        for (let z = -renderDistance; z <= renderDistance; z++) {
            const cx = currentChunkX + x;
            const cz = currentChunkZ + z;
            const key = `${cx},${cz}`;
            if (!chunks.has(key)) {
                chunks.set(key, generateChunk(cx, cz));
            }
        }
    }

    chunks.forEach((group, key) => {
        const [cx, cz] = key.split(',').map(Number);
        if (Math.abs(cx - currentChunkX) > renderDistance + 1 ||
            Math.abs(cz - currentChunkZ) > renderDistance + 1) {
            group.traverse(child => {
                if (child.isMesh || child.isInstancedMesh) {
                    child.geometry.dispose();
                }
            });
            scene.remove(group);
            chunks.delete(key);
        }
    });
}
