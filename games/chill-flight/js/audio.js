let audioCtx = null;
let nextNoteTime = 0;
const notes = [
    [146.83, 164.81, 196.00, 220.00], // D3 E3 G3 A3
    [196.00, 220.00, 246.94, 293.66], // G3 A3 B3 D4
    [220.00, 246.94, 293.66, 329.63]  // A3 B3 D4 E4
];

export function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

export function playProceduralNote(currentStation) {
    if (!audioCtx || audioCtx.state !== 'running') return;
    if (audioCtx.currentTime < nextNoteTime) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    // Pick note based on station
    let scaleIdx = 0;
    if (currentStation === 4) scaleIdx = 1;
    if (currentStation === 5) scaleIdx = 2;
    if (currentStation === 6) scaleIdx = (Math.random() > 0.5 ? 0 : 2);

    const scale = notes[scaleIdx];
    const freq = scale[Math.floor(Math.random() * scale.length)];

    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.0);

    osc.start();
    osc.stop(audioCtx.currentTime + 2.0);

    nextNoteTime = audioCtx.currentTime + 0.5 + Math.random() * 1.5;
}
