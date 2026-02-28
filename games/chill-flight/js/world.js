import { CHUNK_SIZE, SEGMENTS, WATER_LEVEL, MOUNTAIN_LEVEL } from './constants.js';

// A compact, self-contained 2D simplex noise generator
const SimplexNoise = function () {
    var F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    var p = new Uint8Array(256);
    for (var i = 0; i < 256; i++) p[i] = Math.floor(Math.random() * 256);
    var perm = new Uint8Array(512);
    var permMod12 = new Uint8Array(512);
    for (var i = 0; i < 512; i++) {
        perm[i] = p[i & 255];
        permMod12[i] = (perm[i] % 12);
    }
    const grad3 = new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]);
    return {
        noise2D: function (xin, yin) {
            var n0, n1, n2;
            var s = (xin + yin) * F2;
            var i = Math.floor(xin + s);
            var j = Math.floor(yin + s);
            var t = (i + j) * G2;
            var X0 = i - t;
            var Y0 = j - t;
            var x0 = xin - X0;
            var y0 = yin - Y0;
            var i1, j1;
            if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
            var x1 = x0 - i1 + G2;
            var y1 = y0 - j1 + G2;
            var x2 = x0 - 1.0 + 2.0 * G2;
            var y2 = y0 - 1.0 + 2.0 * G2;
            var ii = i & 255;
            var jj = j & 255;
            var gi0 = permMod12[ii + perm[jj]] * 3;
            var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
            var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
            var t0 = 0.5 - x0 * x0 - y0 * y0;
            if (t0 < 0) n0 = 0.0;
            else {
                t0 *= t0;
                n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0);
            }
            var t1 = 0.5 - x1 * x1 - y1 * y1;
            if (t1 < 0) n1 = 0.0;
            else {
                t1 *= t1;
                n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
            }
            var t2 = 0.5 - x2 * x2 - y2 * y2;
            if (t2 < 0) n2 = 0.0;
            else {
                t2 *= t2;
                n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
            }
            return 70.0 * (n0 + n1 + n2);
        }
    };
};

export const simplex = SimplexNoise();

export function getBiome(x, z) {
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

export function getElevation(x, z) {
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

export function generateChunk(chunkX, chunkZ, geometries, materials) {
    const group = new THREE.Group();
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
        const colorWater = new THREE.Color(0x40C4FF);
        const colorIcyWater = new THREE.Color(0x88CCFF);
        const colorDesertWater = new THREE.Color(0x00CED1);

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
                if (desertFactor > 0) colorObj.lerp(new THREE.Color(0xF4A460), desertFactor);
                if (Math.random() < (desertFactor > 0.5 ? 0.002 : 0.005)) {
                    housePositions.push({ x: localX, y: height, z: localZ, rotY: Math.random() * Math.PI * 2 });
                }
            }
        }
        colors.push(colorObj.r, colorObj.g, colorObj.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, materials.terrain);
    mesh.position.set(worldOffsetX, 0, worldOffsetZ);
    group.add(mesh);

    const dummy = new THREE.Object3D();
    if (treePositions.length > 0) {
        const trunkInst = new THREE.InstancedMesh(geometries.treeTrunk, materials.treeTrunk, treePositions.length);
        const leavesInst = new THREE.InstancedMesh(geometries.treeLeaves, materials.treeLeaves, treePositions.length);
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
        group.add(trunkInst); group.add(leavesInst);
    }

    if (snowTreePositions.length > 0) {
        const trunkInst = new THREE.InstancedMesh(geometries.treeTrunk, materials.snowTreeTrunk, snowTreePositions.length);
        const leavesInst = new THREE.InstancedMesh(geometries.treeLeaves, materials.snowTreeLeaves, snowTreePositions.length);
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
        group.add(trunkInst); group.add(leavesInst);
    }

    if (housePositions.length > 0) {
        const bodyInst = new THREE.InstancedMesh(geometries.houseBody, materials.houseBody, housePositions.length);
        const roofInst = new THREE.InstancedMesh(geometries.houseRoof, materials.houseRoof, housePositions.length);
        const windowPools = [];
        const poolCounts = [0, 0, 0, 0, 0];
        const houseToPool = [];
        housePositions.forEach((pos, idx) => {
            const poolId = Math.floor(Math.random() * 5);
            houseToPool[idx] = poolId;
            poolCounts[poolId]++;
        });
        for (let i = 0; i < 5; i++) {
            windowPools[i] = new THREE.InstancedMesh(geometries.houseWindow, materials.houseWindows[i], poolCounts[i] * 2);
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
        group.add(bodyInst); group.add(roofInst);
    }

    let cloudiness = (simplex.noise2D(chunkX * 0.1 + 500, chunkZ * 0.1) + 1) / 2;
    const cloudThreshold = 0.5;
    cloudiness = cloudiness < cloudThreshold ? 0 : (cloudiness - cloudThreshold) / (1 - cloudThreshold);
    const numClouds = Math.floor(cloudiness * 40);
    for (let i = 0; i < numClouds; i++) {
        const cx = (Math.random() - 0.5) * CHUNK_SIZE;
        const cz = (Math.random() - 0.5) * CHUNK_SIZE;
        const cy = 350 + Math.random() * 150;
        const cloudGroup = new THREE.Group();
        const parts = 3 + Math.floor(Math.random() * 3);
        for (let p = 0; p < parts; p++) {
            const mesh = new THREE.Mesh(geometries.cloud, materials.cloud);
            mesh.position.set((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 50);
            mesh.scale.set(40 + Math.random() * 60, 20 + Math.random() * 30, 40 + Math.random() * 60);
            mesh.rotation.y = Math.random() * Math.PI;
            cloudGroup.add(mesh);
        }
        cloudGroup.position.set(worldOffsetX + cx, cy, worldOffsetZ + cz);
        group.add(cloudGroup);
    }

    group.userData.birds = [];
    if (Math.random() < 0.20) {
        const baseX = worldOffsetX + (Math.random() - 0.5) * CHUNK_SIZE;
        const baseZ = worldOffsetZ + (Math.random() - 0.5) * CHUNK_SIZE;
        let baseY = Math.min(400, getElevation(baseX, baseZ) + 150 + Math.random() * 200);
        const baseRotationY = Math.random() * Math.PI * 2;
        const createBird = (mat, scale) => {
            const bird = new THREE.Group();
            const body = new THREE.Mesh(geometries.birdBody, mat);
            const head = new THREE.Mesh(geometries.birdHead, mat);
            const wingL = new THREE.Mesh(geometries.birdWing, mat);
            const wingR = new THREE.Mesh(geometries.birdWing, mat);
            wingL.rotation.y = Math.PI;
            bird.add(body); bird.add(head); bird.add(wingL); bird.add(wingR);
            bird.scale.set(scale, scale, scale);
            bird.userData.wings = [wingL, wingR];
            return bird;
        };
        const numBirds = 1 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numBirds; i++) {
            const bird = createBird(materials.hawk, 1.0);
            bird.position.set(baseX + (Math.random() - 0.5) * 40, baseY + (Math.random() - 0.5) * 20, baseZ + (Math.random() - 0.5) * 40);
            bird.rotation.y = baseRotationY;
            bird.userData.speed = 0.5 + Math.random() * 0.5;
            bird.userData.phase = Math.random() * Math.PI * 2;
            group.add(bird);
            group.userData.birds.push(bird);
        }
    }
    return group;
}
