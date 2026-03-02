// --- GAME LOOP, INPUT & CONTROLS ---
// Dependencies: THREE, scene, camera, renderer, planeGroup, propGroup, skyGroup,
//               sunMesh, moonMesh, dirLight, hemiLight, starsMat, timeOfDay, daySpeedMultiplier,
//               houseWindowMats, chunks, updateChunks, getElevation,
//               CHUNK_SIZE, WATER_LEVEL, BASE_FLIGHT_SPEED, TURN_SPEED, flightSpeedMultiplier,
//               pontoonGroup, pontoonL, pontoonR, hingeLF, hingeLB, hingeRF, hingeRB,
//               headlight, headlightGlow, otherPlayers (set by multiplayer.js),
//               audioCtx, currentStation, ytPlayer, ytPlayerReady, setStation

// --- INPUT ---
let mouseX = 0;
let mouseY = 0;
let mouseControlActive = false; // becomes true once the mouse moves; cleared by arrow-key presses
let windowJustFocused = false;  // absorbs the first mousemove after returning to the tab
let targetPitch = 0;
let targetRoll = 0;

function updateInputPosition(clientX, clientY) {
    const pos = ChillFlightLogic.computeInputPosition(clientX, clientY, window.innerWidth, window.innerHeight);
    mouseX = pos.x;
    mouseY = pos.y;
}

window.addEventListener('mousemove', (e) => {
    if (!e.target.closest('#cockpit-ui') && !e.target.closest('#debug-menu') && !e.target.closest('.title')) {
        updateInputPosition(e.clientX, e.clientY);
        if (windowJustFocused) {
            // Silently sync position without steering — swallows the spurious
            // move event browsers fire when the window regains focus.
            windowJustFocused = false;
        } else {
            mouseControlActive = true;
        }
    }
});

window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0 && !e.target.closest('#cockpit-ui') && !e.target.closest('#debug-menu') && !e.target.closest('.title')) {
        updateInputPosition(e.touches[0].clientX, e.touches[0].clientY);
        mouseControlActive = true;
        windowJustFocused = false; // Touch starts should always count as immediate interaction
    }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        if (!e.target.closest('#cockpit-ui') && !isPaused) {
            e.preventDefault();
        }
        if (!e.target.closest('#cockpit-ui') && !e.target.closest('#debug-menu') && !e.target.closest('.title')) {
            updateInputPosition(e.touches[0].clientX, e.touches[0].clientY);
            mouseControlActive = true;
        }
    }
}, { passive: false });

window.addEventListener('touchend', () => { });

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    const ytContainer = document.getElementById('yt-container');
    if (currentStation === 2 || currentStation === 3) {
        ytContainer.style.display = window.innerWidth <= 768 ? 'none' : 'block';
    }
});

// --- CHILL MODE & EXPLOSIONS ---
let isChillMode = true;
let isExploded = false;
let explosionParticles = null;
const crashOverlay = document.getElementById('crash-overlay');
const chillCheckbox = document.getElementById('chill-checkbox');
const titleChill = document.getElementById('title-chill');
let lastY = 250; // track for ascent/descent detection

function updateModeUI() {
    if (isChillMode) {
        titleChill.classList.remove('strike');
    } else {
        titleChill.classList.add('strike');
    }
}

if (chillCheckbox) {
    chillCheckbox.addEventListener('change', (e) => {
        isChillMode = e.target.checked;
        localStorage.setItem('chill_flight_mode_chill', isChillMode);
        updateModeUI();
    });
}

function createExplosion(pos) {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = pos.x;
        positions[i * 3 + 1] = pos.y;
        positions[i * 3 + 2] = pos.z;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 2 + Math.random() * 8;
        velocities[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
        velocities[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
        velocities[i * 3 + 2] = speed * Math.cos(phi);

        const r = 1.0;
        const g = 0.3 + Math.random() * 0.5;
        const b = 0.0;
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 4,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    return {
        mesh: particles,
        velocities: velocities,
        startTime: Date.now(),
        duration: 2000
    };
}

function updateExplosionParticles(delta) {
    if (!explosionParticles) return;

    const elapsed = Date.now() - explosionParticles.startTime;
    if (elapsed > explosionParticles.duration) {
        scene.remove(explosionParticles.mesh);
        explosionParticles.mesh.geometry.dispose();
        explosionParticles.mesh.material.dispose();
        explosionParticles.mesh = null;
        explosionParticles = null;
        return;
    }

    const positions = explosionParticles.mesh.geometry.attributes.position.array;
    const vels = explosionParticles.velocities;
    for (let i = 0; i < positions.length; i++) {
        positions[i] += vels[i] * delta * 15;
        // gravity
        if (i % 3 === 1) vels[i] -= 9.8 * delta * 2;
    }
    explosionParticles.mesh.geometry.attributes.position.needsUpdate = true;
    explosionParticles.mesh.material.opacity = 1.0 - (elapsed / explosionParticles.duration);
}

function triggerExplosion() {
    if (isExploded) return;
    isExploded = true;
    explosionParticles = createExplosion(planeGroup.position);
    planeGroup.visible = false;
    flightSpeedMultiplier = 0;

    setTimeout(() => {
        crashOverlay.style.display = 'flex';
    }, 1500);
}

const respawnBtn = document.getElementById('respawn-btn');
if (respawnBtn) {
    respawnBtn.addEventListener('click', () => {
        isExploded = false;
        planeGroup.visible = true;
        planeGroup.position.set(planeGroup.position.x, 250, planeGroup.position.z);
        planeGroup.rotation.set(0, planeGroup.rotation.y, 0);
        flightSpeedMultiplier = 1;
        crashOverlay.style.display = 'none';
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    });
}

// --- PAUSE ---
let isPaused = false;
const pauseOverlay = document.getElementById('pause-overlay');

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseOverlay.style.display = 'flex';
        if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
        if (ytPlayerReady && (currentStation === 2 || currentStation === 3)) ytPlayer.pauseVideo();
    } else {
        pauseOverlay.style.display = 'none';
        clock.getDelta(); // clear accumulated time so plane doesn't skip

        const isProcedural = (currentStation === 1 || (currentStation >= 4 && currentStation <= 6));
        if (isProcedural && audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
            nextNoteTime = audioCtx.currentTime + 0.1;
        }
        if (ytPlayerReady && (currentStation === 2 || currentStation === 3)) ytPlayer.playVideo();
    }
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || (isPaused && e.key === 'Enter')) {
        togglePause();
    }
});

document.getElementById('game-title').addEventListener('click', () => {
    togglePause();
});

document.getElementById('resume-btn').addEventListener('click', () => {
    togglePause();
});

// Distance selection
const distanceSelect = document.getElementById('distance-select');
if (distanceSelect) {
    distanceSelect.addEventListener('change', (e) => {
        RENDER_DISTANCE = parseInt(e.target.value);
        localStorage.setItem('chill_flight_distance', RENDER_DISTANCE);
        console.log(`Draw distance changed: RENDER_DISTANCE = ${RENDER_DISTANCE}`);

        // Clear all existing chunks to force regeneration
        chunks.forEach((group, key) => {
            group.traverse(child => {
                if (child.isMesh || child.isInstancedMesh) {
                    child.geometry.dispose();
                }
            });
            scene.remove(group);
        });
        chunks.clear();
    });
}
const qualitySelect = document.getElementById('quality-select');
if (qualitySelect) {
    qualitySelect.addEventListener('change', (e) => {
        SEGMENTS = parseInt(e.target.value);
        localStorage.setItem('chill_flight_quality', SEGMENTS);
        console.log(`Quality changed: SEGMENTS = ${SEGMENTS}`);

        // Clear all existing chunks to force regeneration
        chunks.forEach((group, key) => {
            group.traverse(child => {
                if (child.isMesh || child.isInstancedMesh) {
                    child.geometry.dispose();
                }
            });
            scene.remove(group);
        });
        chunks.clear();

        // The animate loop will call updateChunks() next frame and rebuild everything
    });
}

// --- MOBILE UI ADJUSTMENTS ---
if (window.innerWidth <= 768) {
    const cockpitUI = document.getElementById('cockpit-ui');
    cockpitUI.style.width = '95%';
    cockpitUI.style.bottom = '10px';
    cockpitUI.style.padding = '10px';
    cockpitUI.style.gap = '5px';
    cockpitUI.style.flexWrap = 'wrap';
    cockpitUI.style.justifyContent = 'center';

    const radioModule = document.getElementById('cockpit-radio-module');
    if (radioModule) {
        radioModule.style.borderLeft = 'none';
        radioModule.style.paddingLeft = '0';
        radioModule.style.marginLeft = '0';
        radioModule.style.marginTop = '0';
        radioModule.style.borderTop = 'none';
        radioModule.style.paddingTop = '0';
        radioModule.style.justifyContent = 'center';
    }

    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
        mobileControls.style.display = 'flex';
    }

    const ytContainer = document.getElementById('yt-container');
    ytContainer.style.bottom = '120px';
    ytContainer.style.right = '10px';
    ytContainer.style.width = '180px';
    ytContainer.style.height = '101px';
}

// --- MAIN GAME LOOP ---
const clock = new THREE.Clock();

// --- PERSISTENCE ---
const savedQuality = localStorage.getItem('chill_flight_quality');
if (savedQuality) {
    SEGMENTS = parseInt(savedQuality);
    if (qualitySelect) qualitySelect.value = savedQuality;
}
const savedDistance = localStorage.getItem('chill_flight_distance');
if (savedDistance) {
    RENDER_DISTANCE = parseInt(savedDistance);
    if (distanceSelect) distanceSelect.value = savedDistance;
}
const savedChill = localStorage.getItem('chill_flight_mode_chill');
if (savedChill !== null) {
    isChillMode = (savedChill === 'true');
    if (chillCheckbox) chillCheckbox.checked = isChillMode;
    updateModeUI();
}

// Initial chunk generation
updateChunks();

const fpsCounterEl = document.getElementById('debug-fps');

function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const delta = clock.getDelta();

    if (isPaused) return;

    if (isExploded) {
        updateExplosionParticles(delta);
    } else {
        // --- DAY/NIGHT CYCLE ---
        const debugMenu = document.getElementById('debug-menu');
        const isDebugMode = (debugMenu && debugMenu.style.display === 'block');

        const CYCLE_DURATION_MS = 300000;

        if (isDebugMode) {
            timeOfDay += delta * (2 * Math.PI / (CYCLE_DURATION_MS / 1000)) * daySpeedMultiplier;
        } else {
            const serverNow = Date.now() + (window.serverTimeOffset || 0);
            const secondsInCycle = (serverNow % CYCLE_DURATION_MS) / 1000;
            const currentWarpedProgress = ChillFlightLogic.computeTimeOfDay(secondsInCycle);
            timeOfDay = currentWarpedProgress * Math.PI * 2;
        }

        if (timeOfDay > Math.PI * 2) timeOfDay -= Math.PI * 2;
        if (timeOfDay < 0) timeOfDay += Math.PI * 2;

        // Window glow
        houseWindowMats.forEach((mat, i) => {
            const offset = i * 0.05;
            const localSunY = -Math.cos(timeOfDay - offset);
            const nightValue = Math.max(0, (-localSunY + 0.1) * 2);
            mat.emissiveIntensity = Math.min(2.0, nightValue);
        });

        // Update other players (interpolate & dead reckoning)
        if (typeof otherPlayers !== 'undefined') {
            otherPlayers.forEach((p) => {
                const targetEuler = new THREE.Euler(p.targetRotX || 0, p.targetRotY || 0, p.targetRotZ || 0, 'XYZ');
                const forward = new THREE.Vector3(0, 0, -1).applyEuler(targetEuler);
                p.targetPos.add(forward.multiplyScalar(BASE_FLIGHT_SPEED * (p.targetSpeedMult || 1) * 60 * delta));

                const dist = p.mesh.position.distanceTo(p.targetPos);
                if (dist > 500) {
                    p.mesh.position.copy(p.targetPos);
                    p.mesh.rotation.set(p.targetRotX || 0, p.targetRotY || 0, p.targetRotZ || 0);
                } else {
                    p.mesh.position.lerp(p.targetPos, delta * 12.0);
                    if (p.targetQuat) {
                        p.targetQuat.setFromEuler(targetEuler);
                        p.mesh.quaternion.slerp(p.targetQuat, delta * 12.0);
                    } else {
                        p.mesh.rotation.x = THREE.MathUtils.lerp(p.mesh.rotation.x, p.targetRotX || 0, delta * 12.0);
                        p.mesh.rotation.y = THREE.MathUtils.lerp(p.mesh.rotation.y, p.targetRotY || 0, delta * 12.0);
                        p.mesh.rotation.z = THREE.MathUtils.lerp(p.mesh.rotation.z, p.targetRotZ || 0, delta * 12.0);
                    }
                }

                if (p.targetSpeedMult > 0 && p.mesh.userData.propeller) {
                    const spinSpeed = 15 * Math.max(0.2, p.targetSpeedMult);
                    p.mesh.userData.propeller.rotation.z += spinSpeed * delta;
                }
            });
        }

        // Spin the propeller
        if (flightSpeedMultiplier > 0) {
            const spinSpeed = 15 * Math.max(0.2, flightSpeedMultiplier);
            propGroup.rotation.z += spinSpeed * delta;
        }

        // Animate pontoons
        if (isDeployingPontoons && !isRetractingPontoons && pontoonDeploymentProgress < 1) {
            pontoonDeploymentProgress += delta * 0.5;
            if (pontoonDeploymentProgress > 1) pontoonDeploymentProgress = 1;
            const t = pontoonDeploymentProgress;
            const easeOut = 1 - Math.pow(1 - t, 3);

            pontoonGroup.scale.setScalar(easeOut);

            const leftRotAngle = (Math.PI / 2) * (1 - easeOut);
            pontoonL.rotation.z = leftRotAngle;
            hingeLF.rotation.z = leftRotAngle;
            hingeLB.rotation.z = leftRotAngle;
            const rightRotAngle = -(Math.PI / 2) * (1 - easeOut);
            pontoonR.rotation.z = rightRotAngle;
            hingeRF.rotation.z = rightRotAngle;
            hingeRB.rotation.z = rightRotAngle;
            pontoonL.position.y = -0.5 - (4.0 * easeOut);
            pontoonR.position.y = -0.5 - (4.0 * easeOut);
        } else if (isRetractingPontoons && pontoonDeploymentProgress > 0) {
            pontoonDeploymentProgress -= delta * 0.4;
            if (pontoonDeploymentProgress < 0) {
                pontoonDeploymentProgress = 0;
                isRetractingPontoons = false;
                isDeployingPontoons = false;
                pontoonGroup.visible = false;
            }
            const t = pontoonDeploymentProgress;
            const easeOut = 1 - Math.pow(1 - t, 3);

            pontoonGroup.scale.setScalar(easeOut);

            const leftRotAngle = (Math.PI / 2) * (1 - easeOut);
            pontoonL.rotation.z = leftRotAngle;
            hingeLF.rotation.z = leftRotAngle;
            hingeLB.rotation.z = leftRotAngle;
            const rightRotAngle = -(Math.PI / 2) * (1 - easeOut);
            pontoonR.rotation.z = rightRotAngle;
            hingeRF.rotation.z = rightRotAngle;
            hingeRB.rotation.z = rightRotAngle;
            pontoonL.position.y = -0.5 - (4.0 * easeOut);
            pontoonR.position.y = -0.5 - (4.0 * easeOut);
        }

        // Plane rotation control
        const maxPitch = Math.PI / 4;
        const maxRoll = Math.PI / 3;
        let effMouseX = (mouseControlActive && Math.abs(mouseX) >= 0.15) ? mouseX : 0;
        let effMouseY = (mouseControlActive && Math.abs(mouseY) >= 0.15) ? mouseY : 0;

        if (flightSpeedMultiplier > 0) {
            targetPitch = effMouseY * maxPitch;
            targetRoll = -effMouseX * (maxRoll * 1.25);
        } else {
            targetPitch = 0;
            targetRoll = 0;
        }

        let isBarrelRolling = false;
        let isClampedRoll = false;
        let isLooping = false;
        const manualRollSpeed = 4.0;
        const manualLoopSpeed = 2.5;
        if (flightSpeedMultiplier > 0) {
            if (keys.ArrowLeft && keys.ArrowRight) {
                if (doubleTap.ArrowLeft && doubleTap.ArrowRight) {
                    // Double-tap both: dive straight down
                    const target = -Math.PI / 2;
                    planeGroup.rotation.x = Math.max(target, planeGroup.rotation.x - manualLoopSpeed * delta);
                } else {
                    // Single hold both: loop up
                    planeGroup.rotation.x += manualLoopSpeed * delta;
                }
                isLooping = true;
            } else if (keys.ArrowLeft) {
                if (doubleTap.ArrowLeft) {
                    // Double-tap: full barrel roll
                    planeGroup.rotation.z += manualRollSpeed * delta;
                } else {
                    // Single-tap: bank to 90° and hold
                    const target = Math.PI / 2;
                    planeGroup.rotation.z = Math.min(target, planeGroup.rotation.z + manualRollSpeed * delta);
                    isClampedRoll = true;
                }
                isBarrelRolling = true;
            } else if (keys.ArrowRight) {
                if (doubleTap.ArrowRight) {
                    // Double-tap: full barrel roll
                    planeGroup.rotation.z -= manualRollSpeed * delta;
                } else {
                    // Single-tap: bank to -90° and hold
                    const target = -Math.PI / 2;
                    planeGroup.rotation.z = Math.max(target, planeGroup.rotation.z - manualRollSpeed * delta);
                    isClampedRoll = true;
                }
                isBarrelRolling = true;
            }
        }

        if (!isLooping) {
            while (planeGroup.rotation.x > targetPitch + Math.PI) planeGroup.rotation.x -= 2 * Math.PI;
            while (planeGroup.rotation.x < targetPitch - Math.PI) planeGroup.rotation.x += 2 * Math.PI;
            planeGroup.rotation.x = THREE.MathUtils.lerp(planeGroup.rotation.x, targetPitch, TURN_SPEED);
        }

        if (!isBarrelRolling) {
            while (planeGroup.rotation.z > targetRoll + Math.PI) planeGroup.rotation.z -= 2 * Math.PI;
            while (planeGroup.rotation.z < targetRoll - Math.PI) planeGroup.rotation.z += 2 * Math.PI;
            planeGroup.rotation.z = THREE.MathUtils.lerp(planeGroup.rotation.z, targetRoll, TURN_SPEED);
        }

        if (flightSpeedMultiplier > 0) {
            let turningRoll = (isBarrelRolling && !isClampedRoll) ? targetRoll : planeGroup.rotation.z;
            planeGroup.rotation.y += turningRoll * 0.025;
        }

        // Move forward
        planeGroup.translateZ(-(BASE_FLIGHT_SPEED * flightSpeedMultiplier));

        // Speed controls
        const controlBaseAlt = Math.max(0, planeGroup.position.y - 45.5);
        const controlAlt = Math.round(controlBaseAlt * 25);
        const accelRate = 0.8 * delta;

        if (keys.ArrowDown) {
            keys.ArrowUp = false;
            if (flightSpeedMultiplier > 0.5) {
                flightSpeedMultiplier = Math.max(0.5, flightSpeedMultiplier - accelRate);
            } else if (flightSpeedMultiplier <= 0.5 && controlAlt === 0) {
                flightSpeedMultiplier = Math.max(0, flightSpeedMultiplier - accelRate);
            }
        } else if (keys.ArrowUp) {
            if (flightSpeedMultiplier === 0) {
                flightSpeedMultiplier = 0.5;
            } else {
                flightSpeedMultiplier = Math.min(10, flightSpeedMultiplier + accelRate);
            }
        }

        // Ground avoidance
        const terrainHeight = getElevation(planeGroup.position.x, planeGroup.position.z);
        let isWater = terrainHeight <= WATER_LEVEL + 0.1;
        const minFlightHeight = isWater ? terrainHeight + 5.5 : terrainHeight + 30;

        if (planeGroup.position.y < minFlightHeight) {
            if (!isChillMode && !isWater && planeGroup.position.y < terrainHeight + 4) {
                triggerExplosion();
            }

            planeGroup.position.y = THREE.MathUtils.lerp(planeGroup.position.y, minFlightHeight + (isWater ? 0 : 5), 0.05);

            if (isWater && planeGroup.position.y < minFlightHeight + 2) {
                if (!pontoonGroup.visible) {
                    pontoonGroup.visible = true;
                    isDeployingPontoons = true;
                }
                if (flightSpeedMultiplier > 0.5) {
                    flightSpeedMultiplier = THREE.MathUtils.lerp(flightSpeedMultiplier, 0.5, 0.015);
                }
                targetPitch = THREE.MathUtils.lerp(targetPitch, 0, 0.05);
                targetRoll = THREE.MathUtils.lerp(targetRoll, 0, 0.05);
            }
        }

        const maxFlightHeight = 1046;
        if (planeGroup.position.y > maxFlightHeight) {
            planeGroup.position.y = maxFlightHeight;
        }

        if (controlAlt >= 500 && pontoonGroup.visible && !isRetractingPontoons) {
            isRetractingPontoons = true;
        }

        const currentY = planeGroup.position.y;
        const isDescending = currentY < lastY;
        lastY = currentY;

        if (isWater && controlAlt < 1000 && isDescending && !pontoonGroup.visible) {
            pontoonGroup.visible = true;
            isDeployingPontoons = true;
        }

        // Camera follow
        const speedFactor = (flightSpeedMultiplier - 0.5) / 9.5;
        const zOffset = THREE.MathUtils.lerp(40, 60, speedFactor);
        const yOffset = THREE.MathUtils.lerp(12, 20, speedFactor);
        const targetFov = THREE.MathUtils.lerp(60, 85, speedFactor);

        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.05);
        camera.updateProjectionMatrix();

        const cameraOffset = new THREE.Vector3(0, yOffset, zOffset);
        const idealCameraPos = cameraOffset.clone().applyMatrix4(planeGroup.matrixWorld);
        camera.position.lerp(idealCameraPos, 0.1);

        const lookOffset = new THREE.Vector3(0, 0, -20);
        const idealLookTarget = lookOffset.applyMatrix4(planeGroup.matrixWorld);

        const currentLookTarget = new THREE.Vector3();
        camera.getWorldDirection(currentLookTarget);
        currentLookTarget.add(camera.position);
        currentLookTarget.lerp(idealLookTarget, 0.1);

        if (isLooping) {
            const idealUp = new THREE.Vector3(0, 1, 0).applyQuaternion(planeGroup.quaternion);
            camera.up.lerp(idealUp, 0.1).normalize();
        } else {
            camera.up.lerp(new THREE.Vector3(0, 1, 0), 0.1).normalize();
        }

        camera.lookAt(currentLookTarget);

        // Update terrain chunks
        updateChunks();

        // Celestial positions
        const orbitRadius = 8000;
        const sunY = -Math.cos(timeOfDay);
        const sunX = Math.sin(timeOfDay);
        const sunZ = Math.cos(timeOfDay) * 0.3;
        const dayFactor = Math.max(0, Math.min(1, (sunY + 0.5) * 2)); // 0.0 at SunY=-0.5 (4 AM), 1.0 at SunY=0 (6 AM)

        // Animate Water and Birds
        chunks.forEach(chunkGroup => {
            // Animate Water
            if (chunkGroup.userData.water) {
                const waterMesh = chunkGroup.userData.water;
                const waterTime = now * 0.0015;
                const wPositions = waterMesh.geometry.attributes.position.array;
                const wx = waterMesh.position.x;
                const wz = waterMesh.position.z;
                for (let i = 0; i < wPositions.length; i += 3) {
                    const worldX = wx + wPositions[i];
                    const worldZ = wz + wPositions[i + 2];
                    // Gentle wave math using world coordinates so chunks tile seamlessly
                    wPositions[i + 1] = WATER_LEVEL + Math.sin(waterTime + worldX * 0.02) * 0.8 + Math.cos(waterTime * 0.8 + worldZ * 0.015) * 0.8;
                }
                waterMesh.geometry.attributes.position.needsUpdate = true;
                waterMesh.geometry.computeVertexNormals();
            }

            if (chunkGroup.userData.birds) {
                chunkGroup.userData.birds.forEach(bird => {
                    const data = bird.userData;
                    const flap = Math.sin(clock.elapsedTime * data.flapSpeed + data.flapPhase) * 0.5;
                    if (data.wings) {
                        data.wings[0].rotation.z = flap;
                        data.wings[1].rotation.z = -flap;
                    }
                    bird.translateZ(-(data.speed * delta * 50));

                    if (data.type === 'hawk') {
                        data.angle += data.circleSpeed * delta;
                        const targetX = data.circleCenter.x + Math.cos(data.angle) * data.circleRadius;
                        const targetZ = data.circleCenter.z + Math.sin(data.angle) * data.circleRadius;
                        bird.rotation.z = 0.3;
                        bird.lookAt(
                            data.circleCenter.x + Math.cos(data.angle + 0.1) * data.circleRadius,
                            bird.position.y,
                            data.circleCenter.z + Math.sin(data.angle + 0.1) * data.circleRadius
                        );
                        bird.position.set(targetX, bird.position.y, targetZ);
                    }
                });
            }

            // Animate Windmills
            if (chunkGroup.userData.windmillBlades && chunkGroup.userData.windmillPositions) {
                const bladesInst = chunkGroup.userData.windmillBlades;
                const windmillPositions = chunkGroup.userData.windmillPositions;
                const windmillRotation = performance.now() * 0.001 * 1.5;
                const dummy = new THREE.Object3D();

                windmillPositions.forEach((pos, index) => {
                    for (let b = 0; b < 4; b++) {
                        const bladeIdx = index * 4 + b;
                        dummy.position.set(pos.x, pos.y + 45, pos.z);
                        const hubOffset = new THREE.Vector3(0, 0, 8.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), pos.rotY);
                        dummy.position.add(hubOffset);
                        dummy.rotation.set(0, pos.rotY, (b * Math.PI / 2) + windmillRotation);
                        dummy.updateMatrix();
                        bladesInst.setMatrixAt(bladeIdx, dummy.matrix);
                    }
                });
                bladesInst.instanceMatrix.needsUpdate = true;
            }

            // Animate Lighthouse Beam
            if (chunkGroup.userData.lighthouseBeam) {
                const beam = chunkGroup.userData.lighthouseBeam;
                beam.rotation.y += delta * 0.1; // Slow, relaxing beacon community
                // Pulse opacity slightly
                beam.material.opacity = 0.2 + Math.sin(performance.now() * 0.005) * 0.1;

                // Rotate functional light target
                if (chunkGroup.userData.lighthouseTarget && chunkGroup.userData.lighthouseLight) {
                    const target = chunkGroup.userData.lighthouseTarget;
                    const light = chunkGroup.userData.lighthouseLight;
                    const angle = beam.rotation.y;
                    target.position.set(
                        light.position.x + Math.sin(angle) * 100,
                        light.position.y - 15, // Aim lower community
                        light.position.z + Math.cos(angle) * 100
                    );
                    // Fade out lighthouse light during day
                    light.intensity = 50 * (1.0 - dayFactor * 0.95);
                }
            }

            // Animate Campfires
            if (chunkGroup.userData.campfires && chunkGroup.userData.campfirePositions) {
                const cores = chunkGroup.userData.campfires;
                const smoke = chunkGroup.userData.campfireSmoke;
                const positions = chunkGroup.userData.campfirePositions;
                const time = performance.now() * 0.01;
                const dummy = new THREE.Object3D();

                positions.forEach((pos, index) => {
                    // Animate Core community
                    const scale = 1.0 + Math.sin(time + index) * 0.2;
                    dummy.position.set(pos.x, pos.y + 2, pos.z);
                    dummy.scale.set(scale, scale, scale);
                    dummy.updateMatrix();
                    cores.setMatrixAt(index, dummy.matrix);

                    // Animate Smoke community
                    if (smoke) {
                        for (let i = 0; i < 5; i++) {
                            const smokeIdx = index * 5 + i;
                            const offsetTime = (performance.now() * 0.001 + i * 0.4) % 2.0; // 2 second cycle community
                            const rise = offsetTime * 40;
                            const drift = Math.sin(performance.now() * 0.002 + i) * 5;
                            const smokeScale = (1.0 + i * 0.5) * (1.0 + offsetTime * 0.5);

                            dummy.position.set(pos.x + drift, pos.y + 5 + rise, pos.z);
                            dummy.scale.set(smokeScale, smokeScale, smokeScale);
                            dummy.rotation.set(offsetTime, offsetTime, offsetTime);
                            dummy.updateMatrix();
                            smoke.setMatrixAt(smokeIdx, dummy.matrix);
                        }
                    }
                });
                cores.instanceMatrix.needsUpdate = true;
                if (smoke) smoke.instanceMatrix.needsUpdate = true;

                // Fade out campfires/smoke during day community
                if (cores.material) {
                    cores.material.emissiveIntensity = 2.0 * (1.0 - dayFactor * 0.8);
                }
                if (smoke && smoke.material) {
                    smoke.material.opacity = 0.4 * (1.0 - dayFactor * 0.5);
                }
            }

            // Animate Chimney Smoke
            if (chunkGroup.userData.chimneySmoke && chunkGroup.userData.chimneySmokePositions) {
                const smoke = chunkGroup.userData.chimneySmoke;
                const positions = chunkGroup.userData.chimneySmokePositions;
                const dummy = new THREE.Object3D();

                positions.forEach((pos, index) => {
                    for (let i = 0; i < 4; i++) {
                        const smokeIdx = index * 4 + i;
                        const offsetTime = (performance.now() * 0.001 + i * 0.6) % 2.4; // 2.4s cycle
                        const rise = offsetTime * 30; // Slower rise than campfires
                        const driftX = Math.sin(performance.now() * 0.001 + i) * 6;
                        const driftZ = Math.cos(performance.now() * 0.0012 + i) * 4;
                        const smokeScale = (0.8 + i * 0.3) * (1.0 + offsetTime * 0.6); // Expands more

                        dummy.position.set(pos.x + driftX, pos.y + rise, pos.z + driftZ);
                        dummy.scale.set(smokeScale, smokeScale, smokeScale);
                        dummy.rotation.set(offsetTime * 0.5, offsetTime * 0.5, offsetTime * 0.5);
                        dummy.updateMatrix();
                        smoke.setMatrixAt(smokeIdx, dummy.matrix);
                    }
                });

                smoke.instanceMatrix.needsUpdate = true;

                // Chimney smoke gets slightly more transparent during the day but doesn't vanish completely
                if (smoke.material) {
                    smoke.material.opacity = 0.6 - (dayFactor * 0.3);
                }
            }
        });

        // Update Cockpit HUD
        const hours = (timeOfDay / (Math.PI * 2)) * 24;
        const hh = Math.floor(hours).toString().padStart(2, '0');
        const mm = Math.floor((hours % 1) * 60).toString().padStart(2, '0');
        const timeStr = `${hh}:${mm}`;

        const dirStr = ChillFlightLogic.computeHeadingDirection(planeGroup.rotation.y);
        const latScale = 5000;
        const latVal = (-planeGroup.position.z / latScale);
        const lonVal = (planeGroup.position.x / latScale);
        const latStr = Math.abs(latVal).toFixed(3) + "\u00b0 " + (latVal >= 0 ? "N" : "S");
        const lonStr = Math.abs(lonVal).toFixed(3) + "\u00b0 " + (lonVal >= 0 ? "E" : "W");
        const coordStr = `${latStr} ${lonStr}`;
        const altStr = `${Math.round(Math.max(0, planeGroup.position.y - 45.5) * 25)}`;
        const spdStr = `${Math.round(BASE_FLIGHT_SPEED * flightSpeedMultiplier * 60)} KTS`;

        const cTime = document.getElementById('cockpit-time'); if (cTime) cTime.innerText = timeStr;
        const cDir = document.getElementById('cockpit-dir'); if (cDir) cDir.innerText = dirStr;
        const cCoords = document.getElementById('cockpit-coords'); if (cCoords) cCoords.innerText = coordStr;
        const cAlt = document.getElementById('cockpit-alt'); if (cAlt) cAlt.innerText = altStr;
        const cSpd = document.getElementById('cockpit-spd'); if (cSpd) cSpd.innerText = spdStr;

        sunMesh.position.set(sunX * orbitRadius, sunY * orbitRadius, sunZ * orbitRadius);
        moonMesh.position.set(-sunX * orbitRadius, -sunY * orbitRadius, -sunZ * orbitRadius);
        dirLight.position.copy(sunMesh.position).add(planeGroup.position);
        skyGroup.position.copy(camera.position);

        // Sky color / fog / weather
        // At 12:00 (PI), SunY = 1.0.

        let uncloudedSkyColor = new THREE.Color(0x050510);
        let uncloudedFogColor = new THREE.Color(0x020208);

        const daySky = new THREE.Color(0x87ceeb);
        const sunriseSky = new THREE.Color(0xff7b54);
        const goldenSky = new THREE.Color(0xffb26b);
        const twilightSky = new THREE.Color(0x2c3e50);

        if (dayFactor > 0.0) {
            let sunriseFactor = 1.0 - Math.min(1, Math.abs(sunY) * 2.5);
            sunriseFactor = Math.max(0, Math.pow(sunriseFactor, 1.5));
            uncloudedSkyColor.lerp(twilightSky, dayFactor * 0.4);
            uncloudedSkyColor.lerp(sunriseSky, sunriseFactor);
            if (sunY > -0.1 && sunY < 0.15) {
                let goldT = 1.0 - Math.abs(sunY - 0.02) * 10;
                uncloudedSkyColor.lerp(goldenSky, Math.max(0, goldT) * 0.6);
            }
            uncloudedSkyColor.lerp(daySky, dayFactor * (1.0 - sunriseFactor));
            uncloudedFogColor.copy(uncloudedSkyColor);
        }

        // Stars fade starting at 4 AM (-0.5) and disappear by roughly 5:15 AM (-0.2)
        let starFactor = Math.max(0, Math.min(1, (sunY + 0.2) / -0.3));
        starsMat.opacity = starFactor;

        hemiLight.intensity = THREE.MathUtils.lerp(0.1, 0.6, dayFactor);
        dirLight.intensity = THREE.MathUtils.lerp(0, 0.8, dayFactor);

        // Dynamic Weather (Drifting Fog & Clouds)
        const weatherTimeOffset = (now / 100000); // Very slow drift
        let weatherNoise = (simplex.noise2D((planeGroup.position.x / CHUNK_SIZE) * 0.1 + 500 + weatherTimeOffset, (planeGroup.position.z / CHUNK_SIZE) * 0.1 + weatherTimeOffset) + 1) / 2;
        const weatherThreshold = 0.7;
        weatherNoise = weatherNoise < weatherThreshold ? 0 : (weatherNoise - weatherThreshold) / (1 - weatherThreshold);

        // Cloud Drifting
        chunks.forEach(chunk => {
            if (chunk.userData.clouds) {
                chunk.userData.clouds.forEach(cloud => {
                    // Drift 2 units per second (very lazy)
                    cloud.position.x += delta * 2;
                    // Wrap clouds within the chunk (2000x2000)
                    const chunkCenterX = chunk.position.x;
                    if (cloud.position.x > chunkCenterX + 1000) {
                        cloud.position.x -= 2000;
                    }
                });
            }
        });

        const cloudyColor = new THREE.Color().setHex(0x0a0c10).lerp(new THREE.Color(0x8899aa), dayFactor);
        const finalSkyColor = uncloudedSkyColor.clone().lerp(cloudyColor, weatherNoise);
        const finalFogColor = uncloudedFogColor.clone().lerp(cloudyColor, weatherNoise);

        scene.background.lerp(finalSkyColor, 0.05);
        scene.fog.color.lerp(finalFogColor, 0.05);
        scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, THREE.MathUtils.lerp(0.00005, 0.0004, weatherNoise), 0.01);
    }

    renderer.render(scene, camera);

    // Update Online Players List (Desktop only)
    if (window.innerWidth > 768) {
        updatePlayerList();
    }
}

function updatePlayerList() {
    const listEl = document.getElementById('player-list');
    const containerEl = document.getElementById('online-players');
    if (!listEl || !containerEl) return;

    const players = [];
    // Self
    players.push({
        name: playerName,
        dist: 0,
        isSelf: true
    });

    // Others
    if (typeof otherPlayers !== 'undefined') {
        const playerHeading = planeGroup.rotation.y;

        otherPlayers.forEach((p, uid) => {
            // In Three.js, North is -Z, South is +Z, East is +X, West is -X
            const deltaX = p.mesh.position.x - planeGroup.position.x;
            const deltaZ = p.mesh.position.z - planeGroup.position.z;
            const dist = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ) * 0.3048; // convert to meters roughly

            // Absolute angle from North (-Z), CCW positive
            let absoluteAngle = Math.atan2(-deltaX, -deltaZ);

            // Calculate relative angle (clockwise) for the arrow mapping
            let relativeAngle = playerHeading - absoluteAngle;

            // Normalize to [0, 2PI]
            while (relativeAngle < 0) relativeAngle += Math.PI * 2;
            while (relativeAngle >= Math.PI * 2) relativeAngle -= Math.PI * 2;

            // Map angle to 8 directions (45 deg each) 
            // Arrows are ordered clockwise: Up, Up-Right, Right, etc.
            const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
            const arrowIdx = Math.floor(((relativeAngle * (180 / Math.PI) + 22.5) % 360) / 45);
            const dirEmoji = arrows[arrowIdx];

            players.push({
                uid: uid,
                name: p.name || "Player",
                dist: dist,
                dir: dirEmoji,
                isSelf: false
            });
        });
    }

    // Only show if there's more than one player (Self + at least one other)
    if (players.length > 1) {
        containerEl.classList.add('visible');
    } else {
        containerEl.classList.remove('visible');
    }

    // Sort by distance
    players.sort((a, b) => a.dist - b.dist);

    // Take top 5
    const top5 = players.slice(0, 5);

    // Render
    listEl.innerHTML = top5.map(p => `
        <div class="player-entry ${p.isSelf ? 'player-self' : ''}" ${p.uid ? `data-uid="${p.uid}" style="cursor: pointer;"` : ''}>
            <span class="player-name">${p.name}</span>
            <div class="player-info">
                <span class="player-dist">${p.isSelf ? '-' : Math.round(p.dist) + 'm'}</span>
                <span class="player-dir">${p.isSelf ? '-' : p.dir}</span>
            </div>
        </div>
    `).join('');
}

// Warp to player on click
const playerListEl = document.getElementById('player-list');
if (playerListEl) {
    playerListEl.addEventListener('click', (e) => {
        const entry = e.target.closest('.player-entry');
        if (entry && entry.dataset.uid) {
            const uid = entry.dataset.uid;
            if (typeof otherPlayers !== 'undefined') {
                const p = otherPlayers.get(uid);
                if (p && p.mesh && planeGroup) {
                    // Warp local plane to target player
                    planeGroup.position.copy(p.mesh.position);
                    planeGroup.position.y += 10; // offset slightly above
                    planeGroup.rotation.copy(p.mesh.rotation);
                    flightSpeedMultiplier = Math.max(0.5, p.targetSpeedMult || 0.5);

                    // Reset inputs
                    targetPitch = 0;
                    targetRoll = 0;

                    console.log(`Warped to player ${p.name}`);
                }
            }
        }
    });
}

// Start loop
window.onload = animate;

// --- KEY STATE ---
const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };

// Double-tap detection for barrel roll
const lastArrowTap = { ArrowLeft: 0, ArrowRight: 0 };
const doubleTap = { ArrowLeft: false, ArrowRight: false };
const DOUBLE_TAP_MS = 300;

// Mobile controls
const btnUp = document.getElementById('mobile-spd-up');
const btnDown = document.getElementById('mobile-spd-down');
const btnHdgt = document.getElementById('mobile-hdgt');

if (btnUp) {
    const down = (e) => { e.preventDefault(); e.stopPropagation(); keys.ArrowUp = true; };
    const up = (e) => { e.preventDefault(); e.stopPropagation(); keys.ArrowUp = false; };
    btnUp.addEventListener('pointerdown', down);
    btnUp.addEventListener('pointerup', up);
    btnUp.addEventListener('pointercancel', up);
    btnUp.addEventListener('pointerleave', up);
    btnUp.addEventListener('contextmenu', (e) => e.preventDefault());
}
if (btnDown) {
    const down = (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys.ArrowDown = true;
        keys.ArrowUp = false;
    };
    const up = (e) => { e.preventDefault(); e.stopPropagation(); keys.ArrowDown = false; };
    btnDown.addEventListener('pointerdown', down);
    btnDown.addEventListener('pointerup', up);
    btnDown.addEventListener('pointercancel', up);
    btnDown.addEventListener('pointerleave', up);
    btnDown.addEventListener('contextmenu', (e) => e.preventDefault());
}
if (btnHdgt) {
    const toggleHdgt = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (headlight.intensity === 0) {
            headlight.intensity = 2;
            headlightGlow.intensity = 0.1;
            btnHdgt.classList.add('active');
        } else {
            headlight.intensity = 0;
            headlightGlow.intensity = 0;
            btnHdgt.classList.remove('active');
        }
    };
    btnHdgt.addEventListener('touchstart', toggleHdgt);
    btnHdgt.addEventListener('mousedown', toggleHdgt);
}

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (e.key === 'ArrowLeft' || (key === 'a' && !e.shiftKey)) keys.ArrowLeft = true;
    if (e.key === 'ArrowRight' || (key === 'd' && !e.shiftKey)) keys.ArrowRight = true;
    if (e.key === 'ArrowUp' || (key === 'w' && !e.shiftKey)) keys.ArrowUp = true;
    if (e.key === 'ArrowDown' || (key === 's' && !e.shiftKey)) keys.ArrowDown = true;

    // Double-tap detection (ignore key-repeat events)
    if ((e.key === 'ArrowLeft' || (key === 'a' && !e.shiftKey) || e.key === 'ArrowRight' || (key === 'd' && !e.shiftKey)) && !e.repeat) {
        const tapKey = (e.key === 'ArrowLeft' || (key === 'a' && !e.shiftKey)) ? 'ArrowLeft' : 'ArrowRight';
        const now = performance.now();
        if (now - lastArrowTap[tapKey] < DOUBLE_TAP_MS) {
            doubleTap[tapKey] = true;
        }
        lastArrowTap[tapKey] = now;
    }

    // Any control key press hands control to keyboard; clear mouse until it moves again
    const isControlKey = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(e.key.toLowerCase()) ||
        (['w', 'a', 's', 'd'].includes(key) && !e.shiftKey);
    if (isControlKey) {
        if (!e.repeat) {
            mouseControlActive = false;
            mouseX = 0;
            mouseY = 0;
        }
    }

    if ((e.key === 'l' || e.key === 'L') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (headlight.intensity === 0) {
            headlight.intensity = 2;
            headlightGlow.intensity = 0.1;
            if (btnHdgt) btnHdgt.classList.add('active');
        } else {
            headlight.intensity = 0;
            headlightGlow.intensity = 0;
            if (btnHdgt) btnHdgt.classList.remove('active');
        }
    }

    if ((e.key === 'd' || e.key === 'D') && e.shiftKey) {
        const debugMenu = document.getElementById('debug-menu');
        const isOpening = debugMenu.style.display !== 'block';
        debugMenu.style.display = isOpening ? 'block' : 'none';

        if (window.firebaseDB && window.currentUserUid) {
            const _wp = `world/${ChillFlightLogic.WORLD_SEED}`;
            if (isOpening) {
                import('https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js').then(({ remove, ref, goOffline }) => {
                    remove(ref(window.firebaseDB, `${_wp}/players/` + window.currentUserUid)).then(() => {
                        goOffline(window.firebaseDB);
                        if (typeof otherPlayers !== 'undefined') otherPlayers.forEach(p => p.mesh.visible = false);
                        console.log("Debug menu opened: Disconnected from Firebase multiplayer.");
                    });
                });
            } else {
                import('https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js').then(({ goOnline, set, ref }) => {
                    goOnline(window.firebaseDB);
                    if (typeof otherPlayers !== 'undefined') otherPlayers.forEach(p => p.mesh.visible = true);
                    const profileRef = ref(window.firebaseDB, `${_wp}/users/` + window.currentUserUid);
                    const sessionRef = ref(window.firebaseDB, `${_wp}/players/` + window.currentUserUid);
                    set(profileRef, { name: playerName, color: planeColor, updatedAt: new Date().toISOString() });
                    set(sessionRef, { name: playerName, color: planeColor, lastSeen: new Date().toISOString() });
                    const pos = planeGroup.position;
                    const rot = planeGroup.rotation;
                    set(ref(window.firebaseDB, `${_wp}/players/` + window.currentUserUid + '/position'), {
                        x: Number(pos.x.toFixed(1)),
                        y: Number(pos.y.toFixed(1)),
                        z: Number(pos.z.toFixed(1)),
                        rotX: Number(rot.x.toFixed(3)),
                        rotY: Number(rot.y.toFixed(3)),
                        rotZ: Number(rot.z.toFixed(3)),
                        speedMult: Number(flightSpeedMultiplier.toFixed(2)),
                        headlightsOn: false,
                        updatedAt: new Date().toISOString()
                    });
                    console.log("Debug menu closed: Reconnected to Firebase multiplayer.");
                });
            }
        }
    }

    if (e.key === '1') {
        const procList = [1, 6, 4, 5];
        let idx = procList.indexOf(currentStation);
        if (idx !== -1) {
            setStation(procList[(idx + 1) % procList.length]);
        } else {
            setStation(1);
        }
    } else if (e.key === '0') {
        setStation(0);
    } else if (e.key === '2' || e.key === '3') {
        setStation(parseInt(e.key));
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (e.key === 'ArrowLeft' || key === 'a') { keys.ArrowLeft = false; doubleTap.ArrowLeft = false; }
    if (e.key === 'ArrowRight' || key === 'd') { keys.ArrowRight = false; doubleTap.ArrowRight = false; }
    if (e.key === 'ArrowUp' || key === 'w') keys.ArrowUp = false;
    if (e.key === 'ArrowDown' || key === 's') keys.ArrowDown = false;
});

window.addEventListener('blur', () => {
    mouseControlActive = false;
    windowJustFocused = false;
    for (let k in keys) keys[k] = false;
    console.log("Window blur: Resetting all keys and mouse control.");
});

window.addEventListener('focus', () => {
    windowJustFocused = true;
});

// Radio button wiring
document.querySelectorAll('.station-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const s = e.target.getAttribute('data-station');
        if (s === 'procedural') {
            const procList = [1, 6, 4, 5];
            let idx = procList.indexOf(currentStation);
            if (idx !== -1) {
                setStation(procList[(idx + 1) % procList.length]);
            } else {
                setStation(1);
            }
        } else {
            setStation(parseInt(s));
        }
    });
});

// Debug menu speed buttons
document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        daySpeedMultiplier = parseFloat(e.target.getAttribute('data-speed'));
    });
});
