export function updateHUD(timeOfDay, planeGroup, flightSpeedMultiplier, BASE_FLIGHT_SPEED) {
    const hours = (timeOfDay / (Math.PI * 2)) * 24;
    const hh = Math.floor(hours).toString().padStart(2, '0');
    const mm = Math.floor((hours % 1) * 60).toString().padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    let heading = planeGroup.rotation.y % (Math.PI * 2);
    if (heading < 0) heading += Math.PI * 2;
    let deg = heading * (180 / Math.PI);
    const dirs = ['N', 'NW', 'W', 'SW', 'S', 'SE', 'E', 'NE'];
    let sector = Math.floor(((deg + 22.5) % 360) / 45);
    const dirStr = dirs[sector];

    const latScale = 5000;
    const latVal = (-planeGroup.position.z / latScale);
    const lonVal = (planeGroup.position.x / latScale);

    const latStr = Math.abs(latVal).toFixed(3) + "\u00b0 " + (latVal >= 0 ? "N" : "S");
    const lonStr = Math.abs(lonVal).toFixed(3) + "\u00b0 " + (lonVal >= 0 ? "E" : "W");

    const baseAlt = Math.max(0, planeGroup.position.y - 45.5);
    const alt = Math.round(baseAlt * 25);
    const coordStr = `${latStr} ${lonStr}`;
    const altStr = `${alt} FT`;

    const speedKts = Math.round(BASE_FLIGHT_SPEED * flightSpeedMultiplier * 60);
    const spdStr = `${speedKts} KTS`;

    const elements = {
        'cockpit-time': timeStr,
        'cockpit-dir': dirStr,
        'cockpit-coords': coordStr,
        'cockpit-alt': altStr,
        'cockpit-spd': spdStr
    };

    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
}

export function updateSky(timeOfDay, sunMesh, moonMesh, dirLight, skyGroup, camera, scene, hemiLight, starsMat, weatherNoise) {
    const orbitRadius = 8000;
    const sunY = -Math.cos(timeOfDay);
    const sunX = Math.sin(timeOfDay);
    const sunZ = Math.cos(timeOfDay) * 0.3;

    sunMesh.position.set(sunX * orbitRadius, sunY * orbitRadius, sunZ * orbitRadius);
    moonMesh.position.set(-sunX * orbitRadius, -sunY * orbitRadius, -sunZ * orbitRadius);
    dirLight.position.copy(sunMesh.position).add(camera.position);

    skyGroup.position.copy(camera.position);

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

    const cloudyColor = new THREE.Color().setHex(0x0a0c10).lerp(new THREE.Color(0x8899aa), dayFactor);
    const finalSkyColor = uncloudedSkyColor.clone().lerp(cloudyColor, weatherNoise);
    const finalFogColor = uncloudedFogColor.clone().lerp(cloudyColor, weatherNoise);

    scene.background.lerp(finalSkyColor, 0.05);
    scene.fog.color.lerp(finalFogColor, 0.05);

    const targetFogDensity = THREE.MathUtils.lerp(0.0003, 0.0018, weatherNoise);
    scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, targetFogDensity, 0.01);

    return dayFactor;
}
