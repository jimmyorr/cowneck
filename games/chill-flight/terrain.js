// --- PROCEDURAL TERRAIN & CHUNKS ---
// Dependencies: THREE, simplex, CHUNK_SIZE, SEGMENTS, WATER_LEVEL, MOUNTAIN_LEVEL, scene

const chunks = new Map();

// Materials for terrain
const terrainMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.8
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

function getBiome(x, z) {
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

function getElevation(x, z) {
    const biome = getBiome(x, z);

    let heightScale = 150;
    let offset = 60;
    let roughness = 50;
    let rockiness = 10;

    const westFactor = Math.max(0, Math.min(1, -x / 4500));

    if (biome < -0.2) {
        const t = Math.min(1, (-0.2 - biome) * 3);
        offset = THREE.MathUtils.lerp(60, -55, t);
        heightScale = THREE.MathUtils.lerp(150, 100, t);
        roughness = THREE.MathUtils.lerp(50, 20, t);
    } else if (biome > 0.2) {
        const t = Math.min(1, (biome - 0.2) * 3);
        offset = THREE.MathUtils.lerp(60, 20, t);
        heightScale = THREE.MathUtils.lerp(150, 250, t);
        roughness = THREE.MathUtils.lerp(50, 100, t);
        rockiness = THREE.MathUtils.lerp(10, 30, t);
    }

    if (x < 0) {
        heightScale *= (1 - westFactor * 0.8);
        offset = THREE.MathUtils.lerp(offset, 65, westFactor);
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
            n = THREE.MathUtils.lerp(n, WATER_LEVEL + 5, (westFactor - 0.5) * 2);
        } else {
            n = WATER_LEVEL;
        }
    }
    return n;
}

function generateChunk(chunkX, chunkZ) {
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
    const housePositions = [];

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

        const temperature = tempNoise - (northInfluence * 1.5);
        const isSnowBiome = snowFactor > 0.5;

        if (height <= WATER_LEVEL + 2) {
            if (height <= WATER_LEVEL) {
                colorObj.copy(colorWater);
                if (snowFactor > 0) colorObj.lerp(colorIcyWater, snowFactor);
                if (desertFactor > 0) colorObj.lerp(colorDesertWater, desertFactor);
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
            if (isForest) {
                colorObj.copy(colorForest);
                if (snowFactor > 0) colorObj.lerp(new THREE.Color(0x8BA192), snowFactor);
                if (desertFactor > 0) colorObj.lerp(new THREE.Color(0xA0522D), desertFactor);

                if (Math.random() < (desertFactor > 0.5 ? 0.05 : 0.15)) {
                    if (snowFactor > 0.4) snowTreePositions.push({ x: localX, y: height, z: localZ });
                    else if (desertFactor < 0.6) treePositions.push({ x: localX, y: height, z: localZ });
                }
            } else {
                colorObj.copy(colorPlains);
                if (snowFactor > 0) colorObj.lerp(new THREE.Color(0xFAFAFA), snowFactor);
                if (desertFactor > 0) colorObj.lerp(colorDesertSand, desertFactor);

                if (Math.random() < (desertFactor > 0.5 ? 0.002 : 0.005)) {
                    housePositions.push({ x: localX, y: height, z: localZ, rotY: Math.random() * Math.PI * 2 });
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

    // 2. Generate Trees
    const dummy = new THREE.Object3D();

    if (treePositions.length > 0) {
        const trunkInst = new THREE.InstancedMesh(treeTrunkGeo, treeTrunkMat, treePositions.length);
        const leavesInst = new THREE.InstancedMesh(treeLeavesGeo, treeLeavesMat, treePositions.length);

        treePositions.forEach((pos, index) => {
            const scale = 0.8 + Math.random() * 0.6;
            dummy.position.set(pos.x, pos.y, pos.z);
            dummy.scale.set(scale, scale, scale);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            dummy.updateMatrix();
            trunkInst.setMatrixAt(index, dummy.matrix);
            leavesInst.setMatrixAt(index, dummy.matrix);
        });

        trunkInst.position.set(worldOffsetX, 0, worldOffsetZ);
        leavesInst.position.set(worldOffsetX, 0, worldOffsetZ);
        group.add(trunkInst);
        group.add(leavesInst);
    }

    if (snowTreePositions.length > 0) {
        const trunkInst = new THREE.InstancedMesh(treeTrunkGeo, snowTreeTrunkMat, snowTreePositions.length);
        const leavesInst = new THREE.InstancedMesh(treeLeavesGeo, snowTreeLeavesMat, snowTreePositions.length);

        snowTreePositions.forEach((pos, index) => {
            const scale = 0.8 + Math.random() * 0.6;
            dummy.position.set(pos.x, pos.y, pos.z);
            dummy.scale.set(scale, scale, scale);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            dummy.updateMatrix();
            trunkInst.setMatrixAt(index, dummy.matrix);
            leavesInst.setMatrixAt(index, dummy.matrix);
        });

        trunkInst.position.set(worldOffsetX, 0, worldOffsetZ);
        leavesInst.position.set(worldOffsetX, 0, worldOffsetZ);
        group.add(trunkInst);
        group.add(leavesInst);
    }

    // 2.5 Generate Houses
    if (housePositions.length > 0) {
        const bodyInst = new THREE.InstancedMesh(houseBodyGeo, houseBodyMat, housePositions.length);
        const roofInst = new THREE.InstancedMesh(houseRoofGeo, houseRoofMat, housePositions.length);

        const windowPools = [];
        const poolCounts = [0, 0, 0, 0, 0];
        const houseToPool = [];

        housePositions.forEach((pos, idx) => {
            const poolId = Math.floor(Math.random() * 5);
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
        const cx = (Math.random() - 0.5) * CHUNK_SIZE;
        const cz = (Math.random() - 0.5) * CHUNK_SIZE;
        const cy = 350 + Math.random() * 150;

        const cloudGroup = new THREE.Group();
        const parts = 3 + Math.floor(Math.random() * 3);
        for (let p = 0; p < parts; p++) {
            const mesh = new THREE.Mesh(cloudGeo, cloudMat);
            mesh.position.set((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 50);
            mesh.scale.set(40 + Math.random() * 60, 20 + Math.random() * 30, 40 + Math.random() * 60);
            mesh.rotation.y = Math.random() * Math.PI;
            cloudGroup.add(mesh);
        }
        cloudGroup.position.set(worldOffsetX + cx, cy, worldOffsetZ + cz);
        group.add(cloudGroup);
    }

    // 4. Generate Birds
    group.userData.birds = [];

    if (Math.random() < 0.20) {
        const baseX = worldOffsetX + (Math.random() - 0.5) * CHUNK_SIZE;
        const baseZ = worldOffsetZ + (Math.random() - 0.5) * CHUNK_SIZE;
        let baseY = getElevation(baseX, baseZ) + 150 + Math.random() * 200;
        if (baseY > 400) baseY = 400;

        const baseRotationY = Math.random() * Math.PI * 2;

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
        hawk.userData.circleSpeed = 0.3 + Math.random() * 0.2;
        hawk.userData.circleRadius = 150 + Math.random() * 100;
        hawk.userData.circleCenter = new THREE.Vector3(baseX, baseY, baseZ);
        hawk.userData.angle = Math.random() * Math.PI * 2;
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
    const renderDistance = 1;

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
