let balls = [], walls = [], gravity, currentZoom = 1.0, targetZoom = 1.0, wallSpacing = 50, ringsBroken = 0;
let gameState = 'MENU'; // MENU, PLAYING
let currentPalette = [];
let bgOpacity = 30; // Default trail fade

const PALETTES = {
    'Neon': ['#FF00FF', '#00FFFF', '#BFFF00', '#B026FF'],
    'Cozy': ['#89CFF0', '#98FF98', '#E6E6FA', '#F3E5AB'],
    '1989': ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
    'Vaporwave': ['#008080', '#FF00FF', '#FFC0CB', '#800080'],
    'CGA': ['#55FFFF', '#FF55FF', '#FFFFFF', '#AAAAAA'],
    'Lofi': ['#450456', '#D65D24', '#F4A33B', '#F98BA2'],
    'Deep Sea': ['#000080', '#008080', '#7FFFD4', '#F0FFFF'],
    'Noir': ['#FFFFFF', '#C0C0C0', '#808080', '#404040'],
    'Heatmap': ['#FF0000', '#FF8000', '#FFFF00', '#FFFFFF'],
    'Toxic': ['#00FF00', '#7FFF00', '#CAFF70', '#FFFF00']
};

function setup() {
    console.log("Hypnotizer Game Loaded");
    pixelDensity(1); // Critical for mobile performance
    createCanvas(windowWidth, windowHeight);

    // Generate 'Original' Palette using HSB mode explicitly
    colorMode(HSB, 360, 100, 100, 100);
    let originalColors = [];
    for (let i = 0; i < 360; i += 20) {
        // Match the original look: Hue i, Sat 80, Bri 100
        originalColors.push(color(i, 80, 100).toString('#rrggbb'));
    }
    PALETTES['Original'] = originalColors;

    colorMode(RGB); // Switch to RGB for easier palette management of web colors
    angleMode(DEGREES);
    noLoop(); // Wait for user to start
}

// Global function called by HTML buttons
window.startGame = function (schemeName) {
    currentPalette = PALETTES[schemeName];
    // Special adjustments
    if (schemeName === '1989') {
        document.body.style.background = '#0f380f'; // Dark green bg
        bgOpacity = 80; // Shorter trails
    } else if (schemeName === 'CGA') {
        bgOpacity = 255; // No trails for retro feel
    } else {
        document.body.style.background = '#000';
        bgOpacity = 30;
    }

    document.getElementById('start-screen').style.display = 'none';
    gameState = 'PLAYING';
    resetSim();
    loop();
}

function createWall(index) {
    // Pick color round-robin style
    let colorHex = currentPalette[index % currentPalette.length];
    return {
        r: 80 + (index * wallSpacing),
        color: colorHex,
        speed: (0.04 + (index * 0.002)) * (index % 2 == 0 ? 1 : -1),
        offset: random(360),
        opacity: 255, // RGB 0-255
        broken: false,
        index: index
    };
}

function resetSim() {
    // Initialize ball with a position and velocity vector
    let startColor = currentPalette[0];
    balls = [{
        pos: createVector(0, 0),
        vel: createVector(random(-2, 2), random(-3, -1)),
        color: startColor,
        trail: []
    }];
    gravity = createVector(0, 0.12);
    walls = [];
    ringsBroken = 0;
    currentZoom = 1.0;
    targetZoom = 1.0;
    for (let i = 0; i < 40; i++) walls.push(createWall(i));
}

function draw() {
    if (gameState !== 'PLAYING') return;

    let timeStep = keyIsDown(32) ? 0.2 : 1.0;

    // Background handling based on palette
    if (currentPalette && currentPalette[0] === '#0f380f') {
        background(15, 56, 15, bgOpacity); // 1989
    } else {
        background(0, 0, 0, bgOpacity);
    }

    let center = createVector(width / 2, height / 2);
    currentZoom = lerp(currentZoom, targetZoom, 0.1);

    push();
    translate(center.x, center.y);
    scale(currentZoom);

    // 1. WALLS
    for (let i = walls.length - 1; i >= 0; i--) {
        let w = walls[i];
        if (w.broken) w.opacity = lerp(w.opacity, 0, 0.2);
        if (w.opacity > 5) {
            push();
            rotate((frameCount * w.speed * 45 * timeStep) + w.offset);
            strokeWeight(5 / currentZoom);

            let c = color(w.color);
            c.setAlpha(w.opacity);
            stroke(c);

            noFill();
            let gapSize = 45;
            arc(0, 0, w.r * 2, w.r * 2, gapSize / 2, 360 - gapSize / 2);
            pop();
        }
    }

    // 2. BALLS
    for (let b of balls) {
        // FIXED STEERING LOGIC
        let steer = createVector(0, 0);
        let steerStrength = 0.25; // Increased strength for better feel
        if (keyIsDown(LEFT_ARROW)) steer.x -= steerStrength;
        if (keyIsDown(RIGHT_ARROW)) steer.x += steerStrength;
        if (keyIsDown(UP_ARROW)) steer.y -= steerStrength;
        if (keyIsDown(DOWN_ARROW)) steer.y += steerStrength;

        // Mobile / Mouse Controls
        if (mouseIsPressed) {
            if (mouseX < width / 2) steer.x -= steerStrength;
            else steer.x += steerStrength;

            if (mouseY < height / 3) steer.y -= steerStrength;
            else if (mouseY > height * 2 / 3) steer.y += steerStrength;
        }

        // Apply forces
        b.vel.add(p5.Vector.mult(steer, timeStep));
        b.vel.add(p5.Vector.mult(gravity, timeStep));
        b.vel.limit(10);
        b.pos.add(p5.Vector.mult(b.vel, timeStep));

        b.trail.push({ x: b.pos.x, y: b.pos.y, c: b.color, ringIndex: ringsBroken });
        if (b.trail.length > 20) b.trail.shift();

        let d = b.pos.mag();
        let angleB = (atan2(b.pos.y, b.pos.x) + 360) % 360;

        for (let w of walls) {
            if (w.broken || d + 6 < w.r) continue;

            let wAngle = ((frameCount * w.speed * 45 * timeStep) + w.offset) % 360;
            if (wAngle < 0) wAngle += 360;
            let diff = abs(angleB - wAngle);
            if (diff > 180) diff = 360 - diff;

            if (diff < 22) {
                w.broken = true;
                b.color = w.color;
                ringsBroken++;
                targetZoom *= 0.88;
                walls.push(createWall(walls.length));
                b.vel.mult(1.02);
            } else {
                let n = b.pos.copy().normalize();
                b.vel.reflect(n);
                b.vel.mult(1.0);
                b.pos = n.mult(w.r - 7);
                b.color = w.color;
                break;
            }
        }

        // Trail with Wall Clipping
        for (let i = 0; i < b.trail.length; i++) {
            let t = b.trail[i];
            if (t.ringIndex >= ringsBroken) {
                let c = color(t.c);
                // RGB alpha is 0-255
                c.setAlpha(map(i, 0, b.trail.length, 0, 200));
                fill(c);
                noStroke();
                circle(t.x, t.y, map(i, 0, b.trail.length, 0, 5) / currentZoom);
            }
        }
        fill(b.color);
        circle(b.pos.x, b.pos.y, 14 / currentZoom);
    }
    pop();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function keyPressed() {
    if (keyCode === ESCAPE) {
        if (gameState === 'PLAYING') {
            gameState = 'MENU';
            document.getElementById('start-screen').style.display = 'flex';
            noLoop();
        } else {
            // Optional: Close menu if already open? Nah, keep it simple.
        }
    }
}
