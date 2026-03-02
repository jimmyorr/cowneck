// --- PROCEDURAL AUDIO RADIO & YOUTUBE ---
// Dependencies: none (self-contained, uses global audioCtx)

let audioCtx;
let mainGain;
let currentStation = 0;
let nextNoteTime = 0;
let beatCount = 0;
let scheduleTimer;

const stationNames = ["Off", "Ambient dream", "Lofi Girl", "Bootleg Boy 2", "Ethereal chords", "Minimal pulse", "Lofi beats"];
// Pentatonic scale for pleasing chill vibes
const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

function playTone(freq, type, startTime, dur, vol) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + dur * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(gain);
    gain.connect(mainGain);

    osc.start(startTime);
    osc.stop(startTime + dur);
}

const lofiChords = [
    { name: "Cmaj9", offsets: [48, 52, 55, 59, 62] },
    { name: "Am9", offsets: [45, 48, 52, 55, 59] },
    { name: "Dm9", offsets: [50, 53, 57, 60, 64] },
    { name: "G13", offsets: [55, 59, 62, 65, 69] },
    { name: "Cmaj9_2", offsets: [48, 52, 55, 59, 62] },
    { name: "Am11", offsets: [57, 60, 64, 67, 71] },
    { name: "Fmaj7", offsets: [53, 57, 60, 64] },
    { name: "Em7", offsets: [52, 55, 59, 62] },
    { name: "Ebmaj7", offsets: [51, 55, 58, 62] },
    { name: "Abmaj7", offsets: [56, 60, 63, 67] }
];
let currentChordIndex = 0;
let chordProgression = [2, 3, 4, 1];

function makeDistortionCurve(amount) {
    let k = typeof amount === 'number' ? amount : 50;
    let n = 44100;
    let curve = new Float32Array(n);
    let deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
        let x = i * 2 / n - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

function createKick(time) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(mainGain);
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    osc.start(time);
    osc.stop(time + 0.5);
}

function createSnare(time) {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * 0.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = audioCtx.createGain();
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(mainGain);
    noiseGain.gain.setValueAtTime(0.3, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    noise.start(time);

    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    const oscGain = audioCtx.createGain();
    osc.connect(oscGain);
    oscGain.connect(mainGain);
    osc.frequency.setValueAtTime(200, time);
    oscGain.gain.setValueAtTime(0.15, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.start(time);
    osc.stop(time + 0.2);
}

function createHiHat(time) {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const bandpass = audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    const highpass = audioCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 5000;
    const distortion = audioCtx.createWaveShaper();
    distortion.curve = makeDistortionCurve(100);
    distortion.oversample = '4x';
    const gain = audioCtx.createGain();
    noise.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(distortion);
    distortion.connect(gain);
    gain.connect(mainGain);
    const velocity = 0.08 + Math.random() * 0.05;
    gain.gain.setValueAtTime(velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    noise.start(time);
    noise.stop(time + 0.1);
}

function playLofiChord(time, duration) {
    if (!audioCtx) return;
    const chordObj = lofiChords[chordProgression[currentChordIndex % chordProgression.length]];
    currentChordIndex++;
    const chordGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;

    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5 + Math.random();
    lfoGain.gain.value = 15;
    lfo.connect(lfoGain);

    chordGain.connect(filter);
    filter.connect(mainGain);

    chordObj.offsets.forEach(midiNote => {
        const osc = audioCtx.createOscillator();
        osc.type = Math.random() > 0.5 ? 'triangle' : 'sine';
        const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
        osc.frequency.value = freq;
        lfoGain.connect(osc.detune);
        const noteGain = audioCtx.createGain();
        noteGain.gain.value = 0.12 / chordObj.offsets.length;
        osc.connect(noteGain);
        noteGain.connect(chordGain);
        osc.start(time);
        osc.stop(time + duration);
        noteGain.gain.setValueAtTime(0, time);
        noteGain.gain.linearRampToValueAtTime(0.05, time + 0.1);
        noteGain.gain.linearRampToValueAtTime(0.03, time + 0.3);
        noteGain.gain.setValueAtTime(0.03, time + duration - 0.5);
        noteGain.gain.linearRampToValueAtTime(0, time + duration);
    });
    lfo.start(time);
    lfo.stop(time + duration);
}

function scheduleAudio() {
    if (!audioCtx) return;
    const isProcedural = (currentStation === 1 || (currentStation >= 4 && currentStation <= 6));
    if (!isProcedural) return;
    while (nextNoteTime < audioCtx.currentTime + 0.1) {
        if (currentStation === 1) {
            if (Math.random() > 0.4) {
                const freq = scale[Math.floor(Math.random() * scale.length)] / 2;
                playTone(freq, 'sine', nextNoteTime, 4.0, 0.15);
            }
            nextNoteTime += 1.0;
        } else if (currentStation === 4) {
            if (beatCount % 4 === 0) {
                const rootIdx = Math.floor(Math.random() * 5);
                playTone(scale[rootIdx] / 2, 'triangle', nextNoteTime, 3.0, 0.1);
                playTone(scale[rootIdx + 2] / 2, 'triangle', nextNoteTime, 3.0, 0.1);
                playTone(scale[rootIdx + 4] / 2, 'triangle', nextNoteTime, 3.0, 0.1);
            }
            if (Math.random() > 0.7) playTone(scale[Math.floor(Math.random() * scale.length)], 'sine', nextNoteTime, 0.5, 0.05);
            nextNoteTime += 0.5;
        } else if (currentStation === 5) {
            playTone(scale[beatCount % scale.length] / 2, 'square', nextNoteTime, 0.3, 0.02);
            if (beatCount % 4 === 0) playTone(scale[0] / 4, 'sine', nextNoteTime, 1.0, 0.1);
            nextNoteTime += 0.25;
        } else if (currentStation === 6) {
            const swing = (beatCount % 2 === 1) ? 0.05 : 0;
            const humanize = (Math.random() - 0.5) * 0.02;
            const triggerTime = nextNoteTime + swing + humanize;

            if (beatCount % 8 === 0) createKick(triggerTime);
            if (beatCount % 8 === 4) createKick(triggerTime);
            if (beatCount % 8 === 2 || beatCount % 8 === 6) createSnare(triggerTime);
            createHiHat(triggerTime);
            if (Math.random() > 0.8) createHiHat(triggerTime + ((60 / 80) / 4));

            if (beatCount % 8 === 0) {
                playLofiChord(triggerTime, (60 / 80) * 2);
            }

            nextNoteTime += 0.375;
        }
        beatCount++;
    }
    if (isProcedural) {
        scheduleTimer = requestAnimationFrame(scheduleAudio);
    }
}

function setStation(num) {
    if (num === 2 && currentStation === 2) {
        lofiGirlIdx = (lofiGirlIdx + 1) % lofiGirlVideos.length;
    }

    currentStation = num;
    const nameDisplay = document.getElementById('station-name');

    if (num === 0) {
        nameDisplay.innerText = 'C H I L L - F L I G H T';
    } else {
        const isYT = (num === 2 || num === 3);
        if (isYT && !ytPlayerReady) {
            nameDisplay.innerText = stationNames[num] + " [SYNCING...]";
            ytQueuedStation = num;
        } else {
            nameDisplay.innerText = stationNames[num];
        }
    }

    document.querySelectorAll('.station-btn').forEach(b => {
        b.classList.remove('active');
        const ds = b.getAttribute('data-station');
        if (ds === 'procedural') {
            if (num === 1 || (num >= 4 && num <= 6)) b.classList.add('active');
        } else {
            if (parseInt(ds) === num) b.classList.add('active');
        }
    });

    if (ytPlayerReady) {
        updateYTPlayer(num);
    } else if (num === 2 || num === 3) {
        ensureYTPlayerInitialized();
    }

    const isProcedural = (num === 1 || (num >= 4 && num <= 6));

    if (isProcedural && !audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        mainGain = audioCtx.createGain();
        mainGain.connect(audioCtx.destination);
        const comp = audioCtx.createDynamicsCompressor();
        mainGain.connect(comp);
        comp.connect(audioCtx.destination);
    }
    if (audioCtx && audioCtx.state === 'suspended' && isProcedural) {
        audioCtx.resume();
    }

    cancelAnimationFrame(scheduleTimer);
    if (isProcedural) {
        if (audioCtx) nextNoteTime = audioCtx.currentTime + 0.1;
        scheduleAudio();
    }
}

function updateYTPlayer(num) {
    if (!ytPlayerReady) return;
    const ytContainer = document.getElementById('yt-container');
    if (num === 2) {
        const isVisible = window.innerWidth > 768;
        ytContainer.style.display = isVisible ? 'block' : 'none';
        ytContainer.style.opacity = isVisible ? '1' : '0';
        ytPlayer.loadVideoById(lofiGirlVideos[lofiGirlIdx]);
        setTimeout(() => ytPlayer.playVideo(), 100);
    } else if (num === 3) {
        const isVisible = window.innerWidth > 768;
        ytContainer.style.display = isVisible ? 'block' : 'none';
        ytContainer.style.opacity = isVisible ? '1' : '0';
        const randomStartIndex = Math.floor(Math.random() * 30);
        ytPlayer.loadPlaylist({
            listType: 'playlist',
            list: 'PLF3eNE6vR-4UAcd0VduNzdgyPjee60-Sl',
            index: randomStartIndex
        });
        ytPlayer.setShuffle(true);
        setTimeout(() => ytPlayer.playVideo(), 100);
    } else {
        ytContainer.style.display = 'none';
        ytContainer.style.opacity = '0';
        ytPlayer.pauseVideo();
    }
}

// --- YOUTUBE API RESILIENT HANDSHAKE (v15) ---
let ytPlayer;
let ytPlayerReady = false;
let ytApiLoaded = false;
let ytInitializing = false;
let calibrationFinished = false;
let ytQueuedStation = null;
const lofiGirlVideos = ['jfKfPfyJRdk', '28KRPhVzCus', 'HuFYqnbVbzY', 'S_MOd40zlYU'];
let lofiGirlIdx = 0;

// FAIL-SAFE: Always finish calibration after 10 seconds (upped from 5s)
setTimeout(() => {
    if (!calibrationFinished) {
        console.log("Radio calibration taking longer than usual. Cockpit ready.");
        finishCalibration();
    }
}, 10000);

window.onYouTubeIframeAPIReady = function () {
    console.log("YouTube API Loaded.");
    ytApiLoaded = true;
    updateLoadingProgress(20, "Syncing origins...");

    // Short buffer to allow GA configs to settle
    setTimeout(() => {
        ensureYTPlayerInitialized();
    }, 300);
};

function updateLoadingProgress(percent, status) {
    const bar = document.getElementById('loading-bar');
    const text = document.getElementById('loading-status');
    if (bar) bar.style.width = percent + '%';
    if (text) text.innerText = status;
}

function finishCalibration() {
    if (calibrationFinished) return;
    calibrationFinished = true;

    updateLoadingProgress(100, "All systems go.");
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.transition = 'opacity 1s ease';
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        setTimeout(() => overlay.style.visibility = 'hidden', 1000);
    }

    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function ensureYTPlayerInitialized(callback) {
    if (ytInitializing || ytPlayerReady) return;
    ytInitializing = true;
    updateLoadingProgress(40, "Handshaking radio...");

    const ytContainer = document.getElementById('yt-container');
    const origin = window.location.origin || window.location.protocol + '//' + window.location.host;
    const videoId = lofiGirlVideos[lofiGirlIdx];

    ytContainer.style.display = 'block';
    ytContainer.style.opacity = '0';
    ytContainer.style.pointerEvents = 'none';

    updateLoadingProgress(60, "Binding player...");

    ytPlayer = new YT.Player('youtube-player', {
        width: '220',
        height: '124',
        videoId: videoId,
        playerVars: {
            'playsinline': 1,
            'controls': 0,
            'disablekb': 1,
            'enablejsapi': 1,
            'origin': origin,
            'rel': 0,
            'iv_load_policy': 3,
            'widget_referrer': origin
        },
        events: {
            'onReady': () => {
                console.log("YouTube Radio Active.");
                ytPlayerReady = true;
                ytInitializing = false;
                ytContainer.style.pointerEvents = 'auto';

                // Handle station queuing
                if (ytQueuedStation) {
                    setStation(ytQueuedStation);
                    ytQueuedStation = null;
                }

                finishCalibration();
                if (callback) callback();
            },
            'onError': (e) => {
                console.error("YouTube Error:", e.data);
                ytInitializing = false;
                finishCalibration();
            }
        }
    });
}
