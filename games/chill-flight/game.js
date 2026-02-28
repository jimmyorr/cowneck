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
    }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        if (!e.target.closest('#cockpit-ui') && !isPaused) {
            e.preventDefault();
        }
        if (!e.target.closest('#cockpit-ui') && !e.target.closest('#debug-menu') && !e.target.closest('.title')) {
            updateInputPosition(e.touches[0].clientX, e.touches[0].clientY);
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
    if (e.key === 'Escape') togglePause();
});

document.getElementById('game-title').addEventListener('click', () => {
    togglePause();
});

document.getElementById('resume-btn').addEventListener('click', () => {
    togglePause();
});

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

// Initial chunk generation
updateChunks();

function animate() {
    requestAnimationFrame(animate);
    if (isPaused) return;

    const delta = clock.getDelta();

    // --- DAY/NIGHT CYCLE ---
    const debugMenu = document.getElementById('debug-menu');
    const isDebugMode = (debugMenu && debugMenu.style.display === 'block');

    const CYCLE_DURATION_MS = 210000;

    if (isDebugMode && daySpeedMultiplier !== 1) {
        timeOfDay += delta * (2 * Math.PI / (CYCLE_DURATION_MS / 1000)) * daySpeedMultiplier;
    } else {
        const now = Date.now() + (window.serverTimeOffset || 0);
        const secondsInCycle = (now % CYCLE_DURATION_MS) / 1000;
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
                p.mesh.position.lerp(p.targetPos, delta * 6.0);
                if (p.targetQuat) {
                    p.targetQuat.setFromEuler(targetEuler);
                    p.mesh.quaternion.slerp(p.targetQuat, delta * 6.0);
                } else {
                    p.mesh.rotation.x = THREE.MathUtils.lerp(p.mesh.rotation.x, p.targetRotX || 0, delta * 6.0);
                    p.mesh.rotation.y = THREE.MathUtils.lerp(p.mesh.rotation.y, p.targetRotY || 0, delta * 6.0);
                    p.mesh.rotation.z = THREE.MathUtils.lerp(p.mesh.rotation.z, p.targetRotZ || 0, delta * 6.0);
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
    if (flightSpeedMultiplier > 0.5) {
        if (keys.ArrowLeft && keys.ArrowRight) {
            if (doubleTap.ArrowLeft && doubleTap.ArrowRight) {
                // Double-tap both: pitch nose down
                planeGroup.rotation.x -= manualLoopSpeed * delta;
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
        // Clamped single-tap: use actual bank angle so the plane carves a hard turn.
        // Double-tap barrel roll: use targetRoll (mouse) for steering.
        // Normal flight: use actual rotation.z for gentle banking turns.
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

    const maxFlightHeight = 750;
    if (planeGroup.position.y > maxFlightHeight) {
        planeGroup.position.y = maxFlightHeight;
    }

    if (controlAlt >= 5000 && pontoonGroup.visible && !isRetractingPontoons) {
        isRetractingPontoons = true;
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

    // Animate Birds
    const time = clock.elapsedTime;
    chunks.forEach(chunkGroup => {
        if (chunkGroup.userData.birds) {
            chunkGroup.userData.birds.forEach(bird => {
                const data = bird.userData;
                const flap = Math.sin(time * data.flapSpeed + data.flapPhase) * 0.5;
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
    });

    // Update Cockpit HUD
    const hours = (timeOfDay / (Math.PI * 2)) * 24;
    const hh = Math.floor(hours).toString().padStart(2, '0');
    const mm = Math.floor((hours % 1) * 60).toString().padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    let heading = planeGroup.rotation.y % (Math.PI * 2);
    if (heading < 0) heading += Math.PI * 2;
    let deg = heading * (180 / Math.PI);
    const dirStr = ChillFlightLogic.computeHeadingDirection(planeGroup.rotation.y);
    void deg; // kept for potential future use

    const latScale = 5000;
    const latVal = (-planeGroup.position.z / latScale);
    const lonVal = (planeGroup.position.x / latScale);
    const latStr = Math.abs(latVal).toFixed(3) + "\u00b0 " + (latVal >= 0 ? "N" : "S");
    const lonStr = Math.abs(lonVal).toFixed(3) + "\u00b0 " + (lonVal >= 0 ? "E" : "W");

    const baseAlt = Math.max(0, planeGroup.position.y - 45.5);
    const alt = Math.round(baseAlt * 25);
    const coordStr = `${latStr} ${lonStr}`;
    const altStr = `${alt}`;
    const speedKts = Math.round(BASE_FLIGHT_SPEED * flightSpeedMultiplier * 60);
    const spdStr = `${speedKts} KTS`;

    const cockpitTime = document.getElementById('cockpit-time');
    if (cockpitTime) cockpitTime.innerText = timeStr;
    const cockpitDir = document.getElementById('cockpit-dir');
    if (cockpitDir) cockpitDir.innerText = dirStr;
    const cockpitCoords = document.getElementById('cockpit-coords');
    if (cockpitCoords) cockpitCoords.innerText = coordStr;
    const cockpitAlt = document.getElementById('cockpit-alt');
    if (cockpitAlt) cockpitAlt.innerText = altStr;
    const cockpitSpd = document.getElementById('cockpit-spd');
    if (cockpitSpd) cockpitSpd.innerText = spdStr;

    // Celestial positions
    const orbitRadius = 8000;
    const sunY = -Math.cos(timeOfDay);
    const sunX = Math.sin(timeOfDay);
    const sunZ = Math.cos(timeOfDay) * 0.3;
    sunMesh.position.set(sunX * orbitRadius, sunY * orbitRadius, sunZ * orbitRadius);
    moonMesh.position.set(-sunX * orbitRadius, -sunY * orbitRadius, -sunZ * orbitRadius);
    dirLight.position.copy(sunMesh.position).add(planeGroup.position);
    skyGroup.position.copy(camera.position);

    // Sky color / fog / weather
    let dayFactor = Math.max(0, Math.min(1, (sunY + 0.25) * 4));
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

    starsMat.opacity = 1.0 - dayFactor;
    hemiLight.intensity = THREE.MathUtils.lerp(0.1, 0.6, dayFactor);
    dirLight.intensity = THREE.MathUtils.lerp(0, 0.8, dayFactor);

    let weatherNoise = (simplex.noise2D((planeGroup.position.x / CHUNK_SIZE) * 0.1 + 500, (planeGroup.position.z / CHUNK_SIZE) * 0.1) + 1) / 2;
    const weatherThreshold = 0.5;
    if (weatherNoise < weatherThreshold) {
        weatherNoise = 0;
    } else {
        weatherNoise = (weatherNoise - weatherThreshold) / (1 - weatherThreshold);
    }

    const cloudyColor = new THREE.Color().setHex(0x0a0c10).lerp(new THREE.Color(0x8899aa), dayFactor);
    const finalSkyColor = uncloudedSkyColor.clone().lerp(cloudyColor, weatherNoise);
    const finalFogColor = uncloudedFogColor.clone().lerp(cloudyColor, weatherNoise);

    scene.background.lerp(finalSkyColor, 0.05);
    scene.fog.color.lerp(finalFogColor, 0.05);

    const targetFogDensity = THREE.MathUtils.lerp(0.0003, 0.0018, weatherNoise);
    scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, targetFogDensity, 0.01);

    // Render
    renderer.render(scene, camera);
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
    if (e.key === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.key === 'ArrowRight') keys.ArrowRight = true;
    if (e.key === 'ArrowUp') keys.ArrowUp = true;
    if (e.key === 'ArrowDown') keys.ArrowDown = true;

    // Double-tap detection (ignore key-repeat events)
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.repeat) {
        const now = performance.now();
        if (now - lastArrowTap[e.key] < DOUBLE_TAP_MS) {
            doubleTap[e.key] = true;
        }
        lastArrowTap[e.key] = now;
    }

    // Any arrow key press hands control to keyboard; clear mouse until it moves again
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
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

    if (e.key === 'd' || e.key === 'D') {
        const debugMenu = document.getElementById('debug-menu');
        const isOpening = debugMenu.style.display !== 'block';
        debugMenu.style.display = isOpening ? 'block' : 'none';

        if (window.firebaseDB && window.currentUserUid) {
            if (isOpening) {
                import('https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js').then(({ remove, ref, goOffline }) => {
                    remove(ref(window.firebaseDB, 'players/' + window.currentUserUid)).then(() => {
                        goOffline(window.firebaseDB);
                        if (typeof otherPlayers !== 'undefined') otherPlayers.forEach(p => p.mesh.visible = false);
                        console.log("Debug menu opened: Disconnected from Firebase multiplayer.");
                    });
                });
            } else {
                import('https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js').then(({ goOnline, set, ref }) => {
                    goOnline(window.firebaseDB);
                    if (typeof otherPlayers !== 'undefined') otherPlayers.forEach(p => p.mesh.visible = true);
                    const profileRef = ref(window.firebaseDB, 'users/' + window.currentUserUid);
                    const sessionRef = ref(window.firebaseDB, 'players/' + window.currentUserUid);
                    set(profileRef, { name: playerName, color: planeColor, updatedAt: new Date().toISOString() });
                    set(sessionRef, { name: playerName, color: planeColor, lastSeen: new Date().toISOString() });
                    const pos = planeGroup.position;
                    const rot = planeGroup.rotation;
                    set(ref(window.firebaseDB, 'players/' + window.currentUserUid + '/position'), {
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
    if (e.key === 'ArrowLeft') { keys.ArrowLeft = false; doubleTap.ArrowLeft = false; }
    if (e.key === 'ArrowRight') { keys.ArrowRight = false; doubleTap.ArrowRight = false; }
    if (e.key === 'ArrowUp') keys.ArrowUp = false;
    if (e.key === 'ArrowDown') keys.ArrowDown = false;
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
