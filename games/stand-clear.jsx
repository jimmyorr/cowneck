import React, { useState, useRef, useEffect } from 'react';
import { Mic, Upload, Play, RefreshCw, Train } from 'lucide-react';

export default function App() {
    const [status, setStatus] = useState('Idle');
    const [score, setScore] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [hasReference, setHasReference] = useState(false);

    const audioCtxRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const canvasRef = useRef(null);

    const referenceBufferRef = useRef(null);
    const recordedBufferRef = useRef(null);

    const [refFeatures, setRefFeatures] = useState(null);
    const [recFeatures, setRecFeatures] = useState(null);

    // Initialize Audio Context on first interaction
    const initAudioCtx = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    // Generate a procedural subway chime as the default reference
    const generateDefaultAudio = async () => {
        initAudioCtx();
        const ctx = audioCtxRef.current;
        const sampleRate = ctx.sampleRate;
        const duration = 1.5;
        const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        // E5 (659.25Hz) to C5 (523.25Hz) subway chime
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let freq = t < 0.75 ? 659.25 : 523.25;
            let envelope = 1;

            // Fade out for each note
            if (t < 0.75) {
                envelope = Math.max(0, 1 - (t / 0.75));
            } else {
                envelope = Math.max(0, 1 - ((t - 0.75) / 0.75));
            }

            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
        }

        referenceBufferRef.current = buffer;
        setHasReference(true);
        setStatus('Default Chime Loaded');
        const features = extractFeatures(buffer);
        setRefFeatures(features);
    };

    useEffect(() => {
        generateDefaultAudio();
    }, []);

    // Handle Drag & Drop Audio
    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0] || event.dataTransfer?.files?.[0];
        if (!file) return;

        initAudioCtx();
        setStatus('Decoding audio...');
        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
            referenceBufferRef.current = audioBuffer;
            setHasReference(true);
            setStatus('Custom Audio Loaded!');

            const features = extractFeatures(audioBuffer);
            setRefFeatures(features);
            setRecFeatures(null); // Clear previous attempt
            setScore(null);
        } catch (err) {
            console.error(err);
            setStatus('Error loading audio file.');
        }
    };

    const playReference = () => {
        if (!referenceBufferRef.current) return;
        initAudioCtx();
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = referenceBufferRef.current;
        source.connect(audioCtxRef.current.destination);
        source.start();
    };

    const startRecording = async () => {
        initAudioCtx();
        setScore(null);
        setRecFeatures(null);
        setStatus('Recording...');
        recordedChunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                setStatus('Analyzing...');
                const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                const arrayBuffer = await blob.arrayBuffer();

                try {
                    const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
                    recordedBufferRef.current = audioBuffer;
                    analyzeAndScore(audioBuffer);
                } catch (e) {
                    setStatus('Error decoding recording.');
                }

                // Cleanup stream
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error(err);
            setStatus('Microphone access denied.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // --- AUDIO ANALYSIS ALGORITHM ---

    const extractFeatures = (audioBuffer) => {
        const data = audioBuffer.getChannelData(0); // Use mono

        // 1. Trim Silence (threshold of 0.02)
        const threshold = 0.02;
        let startIdx = 0;
        let endIdx = data.length - 1;
        while (startIdx < data.length && Math.abs(data[startIdx]) < threshold) startIdx++;
        while (endIdx > 0 && Math.abs(data[endIdx]) < threshold) endIdx--;

        if (startIdx >= endIdx) return null; // Too quiet

        const trimmed = data.slice(startIdx, endIdx);

        // 2. Extract into 100 buckets
        const numBuckets = 100;
        const bucketSize = Math.floor(trimmed.length / numBuckets);
        const features = [];
        let maxRms = 0;

        for (let i = 0; i < numBuckets; i++) {
            let sumSquares = 0;
            let zeroCrossings = 0;
            const start = i * bucketSize;
            const end = i === numBuckets - 1 ? trimmed.length : start + bucketSize;

            for (let j = start; j < end; j++) {
                sumSquares += trimmed[j] * trimmed[j];
                if (j > start && ((trimmed[j] >= 0 && trimmed[j - 1] < 0) || (trimmed[j] < 0 && trimmed[j - 1] >= 0))) {
                    zeroCrossings++;
                }
            }

            const rms = Math.sqrt(sumSquares / (end - start));
            if (rms > maxRms) maxRms = rms;

            features.push({
                rms,
                zcr: zeroCrossings / (end - start)
            });
        }

        // 3. Normalize Volume (RMS)
        if (maxRms > 0) {
            features.forEach(f => f.rms /= maxRms);
        }

        return features;
    };

    const analyzeAndScore = (recBuffer) => {
        if (!referenceBufferRef.current) return;

        const recFeat = extractFeatures(recBuffer);
        if (!recFeat) {
            setStatus('Recording too quiet. Try again!');
            return;
        }

        setRecFeatures(recFeat);

        // Calculate difference
        let totalDiff = 0;
        for (let i = 0; i < 100; i++) {
            // Compare normalized volume
            const rmsDiff = Math.abs(refFeatures[i].rms - recFeat[i].rms);
            // Compare timbre/frequency proxy
            const zcrDiff = Math.abs(refFeatures[i].zcr - recFeat[i].zcr);

            // Weight the volume rhythm 70% and the pitch/timbre 30%
            totalDiff += (rmsDiff * 0.7) + (zcrDiff * 0.3);
        }

        // Max possible difference per bucket is roughly 1.0. Total max ~100.
        const averageDiff = totalDiff / 100;
        let finalScore = Math.max(0, 100 - (averageDiff * 100 * 1.5)); // 1.5 multiplier makes it a bit stricter

        setScore(Math.round(finalScore));
        setStatus('Ready');
    };

    // Drawing the visualization
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const drawProfile = (features, color, isFilled) => {
            if (!features) return;
            ctx.beginPath();
            ctx.moveTo(0, height);

            for (let i = 0; i < 100; i++) {
                const x = (i / 100) * width;
                const y = height - (features[i].rms * height * 0.9); // Scale to 90% of canvas height
                ctx.lineTo(x, y);
            }

            if (isFilled) {
                ctx.lineTo(width, height);
                ctx.fillStyle = color;
                ctx.fill();
            } else {
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        };

        // Draw reference in gray
        if (refFeatures) {
            drawProfile(refFeatures, 'rgba(156, 163, 175, 0.4)', true); // Tailwind gray-400
        }

        // Draw recording in orange
        if (recFeatures) {
            drawProfile(recFeatures, '#f97316', false); // Tailwind orange-500
        }

    }, [refFeatures, recFeatures]);

    return (
        <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans flex flex-col items-center justify-center p-6">

            <div className="max-w-md w-full bg-neutral-800 rounded-3xl shadow-2xl overflow-hidden border border-neutral-700">
                {/* Header */}
                <div className="bg-orange-500 p-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                            <Train className="w-6 h-6" /> STAND CLEAR
                        </h1>
                        <p className="text-orange-100 text-sm mt-1 font-medium">MTA Voice Imitation Game</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* File Upload / Reference Player */}
                    <div
                        className="border-2 border-dashed border-neutral-600 rounded-xl p-4 text-center hover:bg-neutral-700 transition-colors relative cursor-pointer"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileUpload}
                    >
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                            <Upload className="w-6 h-6 text-neutral-400" />
                            <p className="text-sm text-neutral-300">
                                Drop your MTA <span className="font-semibold text-white">.mp3</span> here,<br />or use the default chime.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={playReference}
                            disabled={!hasReference}
                            className="flex items-center gap-2 px-4 py-2 bg-neutral-700 rounded-full hover:bg-neutral-600 transition disabled:opacity-50 font-medium"
                        >
                            <Play className="w-4 h-4" /> Listen to Original
                        </button>
                    </div>

                    {/* Visualization Canvas */}
                    <div className="bg-neutral-950 rounded-xl p-2 h-40 relative border border-neutral-700">
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={150}
                            className="w-full h-full rounded"
                        />
                        {!refFeatures && (
                            <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">
                                Loading visualizer...
                            </div>
                        )}
                        {refFeatures && !recFeatures && (
                            <div className="absolute top-2 left-2 text-xs text-neutral-400 font-medium">
                                Reference Audio Profile
                            </div>
                        )}
                        {recFeatures && (
                            <div className="absolute top-2 left-2 flex gap-3 text-xs font-medium">
                                <span className="text-neutral-400">Reference</span>
                                <span className="text-orange-500">Your Attempt</span>
                            </div>
                        )}
                    </div>

                    {/* Score Display */}
                    {score !== null && (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                            <p className="text-sm text-neutral-400 uppercase tracking-widest font-bold mb-1">Accuracy Score</p>
                            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-500">
                                {score}%
                            </div>
                            <p className="mt-2 text-neutral-300">
                                {score > 90 ? "Perfect! The doors are closing." :
                                    score > 70 ? "Not bad, but watch the doors." :
                                        "Did you even ride the subway today?"}
                            </p>
                        </div>
                    )}

                    {/* Record Button */}
                    <div className="flex flex-col items-center gap-3 pt-4">
                        <p className="text-sm text-neutral-400 font-medium h-5">{status}</p>
                        <button
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onMouseLeave={stopRecording}
                            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                            onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg select-none
                ${isRecording
                                    ? 'bg-red-500 scale-95 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                                    : 'bg-orange-500 hover:bg-orange-400 hover:scale-105'}`}
                        >
                            <Mic className={`w-10 h-10 ${isRecording ? 'text-white animate-pulse' : 'text-orange-950'}`} />
                        </button>
                        <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mt-1">
                            Hold to Imitate
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}