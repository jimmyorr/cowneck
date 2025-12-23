let balls = [], walls = [], gravity, currentZoom = 1.0, targetZoom = 1.0, wallSpacing = 50, ringsBroken = 0;

function setup() {
    console.log("Hypnotizer Game Loaded");
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 100);
    angleMode(DEGREES);
    resetSim();
}

function createWall(index) {
    return {
        r: 80 + (index * wallSpacing),
        hue: (index * 20) % 360,
        speed: (0.04 + (index * 0.002)) * (index % 2 == 0 ? 1 : -1),
        offset: random(360),
        opacity: 100,
        broken: false,
        index: index
    };
}

function resetSim() {
    // Initialize ball with a position and velocity vector
    balls = [{
        pos: createVector(0, 0),
        vel: createVector(random(-2, 2), random(-3, -1)),
        hue: 200,
        trail: []
    }];
    gravity = createVector(0, 0.12);
    walls = [];
    ringsBroken = 0;
    for (let i = 0; i < 40; i++) walls.push(createWall(i));
}

function draw() {
    let timeStep = keyIsDown(32) ? 0.2 : 1.0;
    background(0, 0, 5, 30);
    let center = createVector(width / 2, height / 2);
    currentZoom = lerp(currentZoom, targetZoom, 0.1);

    push();
    translate(center.x, center.y);
    scale(currentZoom);

    // 1. WALLS
    for (let i = walls.length - 1; i >= 0; i--) {
        let w = walls[i];
        if (w.broken) w.opacity = lerp(w.opacity, 0, 0.2);
        if (w.opacity > 0.5) {
            push();
            rotate((frameCount * w.speed * 45 * timeStep) + w.offset);
            strokeWeight(5 / currentZoom);
            stroke(w.hue, 80, 100, w.opacity);
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

        // Apply forces
        b.vel.add(p5.Vector.mult(steer, timeStep));
        b.vel.add(p5.Vector.mult(gravity, timeStep));
        b.vel.limit(10);
        b.pos.add(p5.Vector.mult(b.vel, timeStep));

        b.trail.push({ x: b.pos.x, y: b.pos.y, h: b.hue, ringIndex: ringsBroken });
        if (b.trail.length > 15) b.trail.shift();

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
                b.hue = w.hue;
                ringsBroken++;
                targetZoom *= 0.88;
                walls.push(createWall(walls.length));
                b.vel.mult(1.02);
            } else {
                let n = b.pos.copy().normalize();
                b.vel.reflect(n);
                b.vel.mult(1.0);
                b.pos = n.mult(w.r - 7);
                b.hue = w.hue;
                break;
            }
        }

        // Trail with Wall Clipping
        for (let i = 0; i < b.trail.length; i++) {
            let t = b.trail[i];
            if (t.ringIndex >= ringsBroken) {
                fill(t.h, 100, 100, map(i, 0, b.trail.length, 0, 40));
                noStroke();
                circle(t.x, t.y, map(i, 0, b.trail.length, 0, 5) / currentZoom);
            }
        }
        fill(b.hue, 90, 100);
        circle(b.pos.x, b.pos.y, 14 / currentZoom);
    }
    pop();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
