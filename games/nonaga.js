import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Info } from 'lucide-react';

// --- Hex Math & Constants ---
const HEX_SIZE = 28;
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

const hexDistStr = (a, b) => {
    const [q1, r1] = a.split(',').map(Number);
    const [q2, r2] = b.split(',').map(Number);
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
};

const hexToPixel = (q, r) => {
    const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
    const y = HEX_SIZE * 3 / 2 * r;
    return { x, y };
};

const getHexPoints = () => {
    let points = [];
    for (let i = 0; i < 6; i++) {
        const angle_deg = 60 * i - 30; // Pointy topped
        const angle_rad = Math.PI / 180 * angle_deg;
        points.push(`${HEX_SIZE * Math.cos(angle_rad)},${HEX_SIZE * Math.sin(angle_rad)}`);
    }
    return points.join(' ');
};

const initBoard = () => {
    const discs = [];
    for (let r = -2; r <= 2; r++) {
        let q1 = Math.max(-2, -r - 2);
        let q2 = Math.min(2, -r + 2);
        for (let q = q1; q <= q2; q++) {
            discs.push(`${q},${r}`);
        }
    }
    return discs;
};

const INIT_TOKENS = {
    p1: ["0,-2", "2,0", "-2,2"], // Red
    p2: ["2,-2", "0,2", "-2,0"]  // Black
};

// --- Game Logic Helpers ---
const isConnectedAfterRemoval = (discsArray, removeStr) => {
    const remaining = discsArray.filter(d => d !== removeStr);
    if (remaining.length === 0) return true;
    const start = remaining[0];
    const visited = new Set([start]);
    const queue = [start];
    while (queue.length > 0) {
        const curr = queue.shift();
        const [q, r] = curr.split(',').map(Number);
        for (let [dq, dr] of DIRS) {
            const nStr = `${q + dq},${r + dr}`;
            if (remaining.includes(nStr) && !visited.has(nStr)) {
                visited.add(nStr);
                queue.push(nStr);
            }
        }
    }
    return visited.size === remaining.length;
};

const isDiscMovable = (dStr, discs, tokens, lastPlacedStr) => {
    if (!discs.includes(dStr)) return false;
    if (dStr === lastPlacedStr) return false;
    if (tokens.p1.includes(dStr) || tokens.p2.includes(dStr)) return false;

    const [q, r] = dStr.split(',').map(Number);
    const hasNeighbor = new Array(6).fill(false);

    for (let i = 0; i < 6; i++) {
        const [dq, dr] = DIRS[i];
        if (discs.includes(`${q + dq},${r + dr}`)) {
            hasNeighbor[i] = true;
        }
    }

    let canSlide = false;
    for (let i = 0; i < 6; i++) {
        // If this adjacent space is empty...
        if (!hasNeighbor[i]) {
            // Check if the spaces on either side of the gap are both occupied
            const prev = (i + 5) % 6;
            const next = (i + 1) % 6;
            if (!(hasNeighbor[prev] && hasNeighbor[next])) {
                canSlide = true; // It can freely slide out this way!
                break;
            }
        }
    }
    if (!canSlide) return false; // Physically locked in place

    return isConnectedAfterRemoval(discs, dStr);
};

const getValidTokenMoves = (startStr, discs, tokens) => {
    const moves = [];
    const [q, r] = startStr.split(',').map(Number);
    const allTokens = [...tokens.p1, ...tokens.p2];

    for (let [dq, dr] of DIRS) {
        let currQ = q + dq;
        let currR = r + dr;
        let lastValid = null;

        while (true) {
            const str = `${currQ},${currR}`;
            if (!discs.includes(str)) break; // Hit edge
            if (allTokens.includes(str)) break; // Hit token
            lastValid = str;
            currQ += dq;
            currR += dr;
        }
        if (lastValid) moves.push(lastValid);
    }
    return moves;
};

const getValidDiscPlacements = (discs, removedStr) => {
    const remaining = discs.filter(d => d !== removedStr);
    const placements = new Set();

    for (let d of remaining) {
        const [q, r] = d.split(',').map(Number);
        for (let [dq, dr] of DIRS) {
            const nStr = `${q + dq},${r + dr}`;
            if (!remaining.includes(nStr)) {
                let touches = 0;
                const [nq, nr] = nStr.split(',').map(Number);
                for (let [ndq, ndr] of DIRS) {
                    if (remaining.includes(`${nq + ndq},${nr + ndr}`)) touches++;
                }
                if (touches >= 2) placements.add(nStr);
            }
        }
    }
    return Array.from(placements);
};

const checkWin = (playerTokens) => {
    if (playerTokens.length < 3) return false;
    const [t0, t1, t2] = playerTokens;
    const d01 = hexDistStr(t0, t1) === 1;
    const d12 = hexDistStr(t1, t2) === 1;
    const d02 = hexDistStr(t0, t2) === 1;
    // Win if all connected in a group (line, V, or triangle)
    return (d01 && d12) || (d01 && d02) || (d12 && d02);
};

const evaluateBoard = (t) => {
    const dist = (a, b) => hexDistStr(a, b);
    const p2Compact = dist(t.p2[0], t.p2[1]) + dist(t.p2[1], t.p2[2]) + dist(t.p2[0], t.p2[2]);
    const p1Compact = dist(t.p1[0], t.p1[1]) + dist(t.p1[1], t.p1[2]) + dist(t.p1[0], t.p1[2]);
    return p1Compact - (p2Compact * 1.5);
};

// --- Main Component ---
export default function App() {
    const [discs, setDiscs] = useState(initBoard());
    const [tokens, setTokens] = useState(INIT_TOKENS);
    const [phase, setPhase] = useState('p1_token_select'); // p1_token_select, p1_token_dest, p1_disc_select, p1_disc_dest, p2_thinking, game_over
    const [selectedItem, setSelectedItem] = useState(null);
    const [lastPlacedDisc, setLastPlacedDisc] = useState(null);
    const [winner, setWinner] = useState(null);
    const [showRules, setShowRules] = useState(false);

    const hexPoints = useMemo(() => getHexPoints(), []);

    const resetGame = () => {
        setDiscs(initBoard());
        setTokens(INIT_TOKENS);
        setPhase('p1_token_select');
        setSelectedItem(null);
        setLastPlacedDisc(null);
        setWinner(null);
    };

    // AI Turn Logic
    useEffect(() => {
        if (phase === 'p2_thinking') {
            const runAI = async () => {
                await new Promise(resolve => setTimeout(resolve, 400)); // Delay for UX

                let bestScore = -Infinity;
                let bestMoves = [];

                for (let i = 0; i < 3; i++) {
                    const tokenStr = tokens.p2[i];
                    const validTMoves = getValidTokenMoves(tokenStr, discs, tokens);

                    for (let tDest of validTMoves) {
                        let tempTokens = { p1: [...tokens.p1], p2: [...tokens.p2] };
                        tempTokens.p2[i] = tDest;

                        // Immediate win check
                        if (checkWin(tempTokens.p2)) {
                            bestMoves = [{ tIdx: i, tDest, dSrc: null, dDest: null }];
                            bestScore = 99999;
                            break;
                        }

                        const movableDiscs = discs.filter(d => isDiscMovable(d, discs, tempTokens, lastPlacedDisc));

                        for (let dSrc of movableDiscs) {
                            const validDPlacements = getValidDiscPlacements(discs, dSrc);
                            for (let dDest of validDPlacements) {
                                let tempDiscs = discs.filter(d => d !== dSrc);
                                tempDiscs.push(dDest);

                                let score = evaluateBoard(tempTokens);

                                // Check if this leaves P1 with an immediate winning move next turn
                                let p1CanWin = false;
                                for (let j = 0; j < 3; j++) {
                                    const p1Moves = getValidTokenMoves(tempTokens.p1[j], tempDiscs, tempTokens);
                                    for (let p1m of p1Moves) {
                                        let tp1 = [...tempTokens.p1];
                                        tp1[j] = p1m;
                                        if (checkWin(tp1)) { p1CanWin = true; break; }
                                    }
                                    if (p1CanWin) break;
                                }

                                if (p1CanWin) score -= 5000;
                                score += Math.random() * 0.1; // Tie breaker

                                if (score > bestScore) {
                                    bestScore = score;
                                    bestMoves = [{ tIdx: i, tDest, dSrc, dDest }];
                                } else if (Math.abs(score - bestScore) < 0.001) {
                                    bestMoves.push({ tIdx: i, tDest, dSrc, dDest });
                                }
                            }
                        }
                    }
                    if (bestScore === 99999) break;
                }

                if (bestMoves.length > 0) {
                    const move = bestMoves[Math.floor(Math.random() * bestMoves.length)];

                    // Transition to an animation phase to prevent the AI from re-calculating 
                    // while we wait for the timeout to finish.
                    setPhase('p2_animating');

                    let newTokens = { ...tokens };
                    newTokens.p2[move.tIdx] = move.tDest;
                    setTokens(newTokens);

                    if (checkWin(newTokens.p2)) {
                        setWinner('p2');
                        setPhase('game_over');
                        return;
                    }

                    // Delay the board shifting so the user can see the token move first
                    if (move.dSrc && move.dDest) {
                        setTimeout(() => {
                            let newDiscs = discs.filter(d => d !== move.dSrc);
                            newDiscs.push(move.dDest);
                            setDiscs(newDiscs);
                            setLastPlacedDisc(move.dDest);
                            setPhase('p1_token_select');
                        }, 800);
                    } else {
                        setPhase('p1_token_select');
                    }
                } else {
                    // Fallback if no moves (extremely rare)
                    setPhase('p1_token_select');
                }
            };
            runAI();
        }
    }, [phase, discs, tokens, lastPlacedDisc]);

    const handleHexClick = (str) => {
        if (phase === 'p1_token_select') {
            if (tokens.p1.includes(str)) {
                setSelectedItem(str);
                setPhase('p1_token_dest');
            }
        }
        else if (phase === 'p1_token_dest') {
            if (tokens.p1.includes(str)) {
                setSelectedItem(str);
                return;
            }
            const validMoves = getValidTokenMoves(selectedItem, discs, tokens);
            if (validMoves.includes(str)) {
                const newTokens = { ...tokens };
                const idx = newTokens.p1.indexOf(selectedItem);
                newTokens.p1[idx] = str;
                setTokens(newTokens);
                setSelectedItem(null);

                if (checkWin(newTokens.p1)) {
                    setWinner('p1');
                    setPhase('game_over');
                } else {
                    setPhase('p1_disc_select');
                }
            } else {
                setSelectedItem(null);
                setPhase('p1_token_select');
            }
        }
        else if (phase === 'p1_disc_select') {
            if (isDiscMovable(str, discs, tokens, lastPlacedDisc)) {
                setSelectedItem(str);
                setPhase('p1_disc_dest');
            }
        }
        else if (phase === 'p1_disc_dest') {
            if (isDiscMovable(str, discs, tokens, lastPlacedDisc)) {
                setSelectedItem(str);
                return;
            }
            const validPlacements = getValidDiscPlacements(discs, selectedItem);
            if (validPlacements.includes(str)) {
                const newDiscs = discs.filter(d => d !== selectedItem);
                newDiscs.push(str);
                setDiscs(newDiscs);
                setLastPlacedDisc(str);
                setSelectedItem(null);
                setPhase('p2_thinking');
            } else {
                setSelectedItem(null);
                setPhase('p1_disc_select');
            }
        }
    };

    // Render Helpers
    const getValidIndicators = () => {
        if (phase === 'p1_token_dest' && selectedItem) {
            return getValidTokenMoves(selectedItem, discs, tokens);
        }
        return [];
    };

    const getValidGhostDiscs = () => {
        if (phase === 'p1_disc_dest' && selectedItem) {
            return getValidDiscPlacements(discs, selectedItem);
        }
        return [];
    };

    const movableDiscsList = useMemo(() => {
        if (phase === 'p1_disc_select') {
            return discs.filter(d => isDiscMovable(d, discs, tokens, lastPlacedDisc));
        }
        return [];
    }, [phase, discs, tokens, lastPlacedDisc]);

    const statusMessage = () => {
        switch (phase) {
            case 'p1_token_select': return "Your Turn (1/2): Select a Red Token to slide.";
            case 'p1_token_dest': return "Your Turn (1/2): Click a dot to slide your token.";
            case 'p1_disc_select': return "Your Turn (2/2): Select a highlighted edge disc to move.";
            case 'p1_disc_dest': return "Your Turn (2/2): Click a ghost space to place the disc.";
            case 'p2_thinking':
            case 'p2_animating': return "AI is taking its turn...";
            case 'game_over': return winner === 'p1' ? "🎉 You connected your pieces! You Win!" : "🤖 AI connected its pieces. You Lose!";
            default: return "";
        }
    };

    return (
        <div className="min-h-screen bg-stone-100 flex flex-col items-center py-8 font-sans text-stone-800">
            <div className="w-full max-w-3xl px-4 flex flex-col gap-6">

                {/* Header */}
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-stone-900">NONAGA</h1>
                        <p className="text-sm text-stone-500 font-medium">{statusMessage()}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowRules(!showRules)}
                            className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Rules"
                        >
                            <Info size={20} />
                        </button>
                        <button
                            onClick={resetGame}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors text-sm font-semibold shadow-sm"
                        >
                            <RefreshCw size={16} /> Restart
                        </button>
                    </div>
                </div>

                {/* Rules Panel */}
                {showRules && (
                    <div className="bg-blue-50 text-blue-900 p-5 rounded-2xl text-sm leading-relaxed border border-blue-200 shadow-sm">
                        <h3 className="font-bold text-base mb-2">How to Play</h3>
                        <p className="mb-2"><strong>Goal:</strong> Be the first to connect all 3 of your tokens together.</p>
                        <ul className="list-disc pl-5 space-y-1 mb-2">
                            <li><strong>Step 1: Move a token.</strong> It must slide in a straight line until it hits the edge of the board or another piece.</li>
                            <li><strong>Step 2: Move a disc.</strong> Pick an unoccupied edge disc that won't break the board in two. Place it anywhere it touches at least 2 other discs.</li>
                        </ul>
                        <p className="text-xs opacity-80 mt-3">* You cannot pick up the exact disc the opponent just placed.</p>
                    </div>
                )}

                {/* Game Board container */}
                <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-4 aspect-square flex items-center justify-center overflow-hidden">
                    <svg viewBox="-200 -200 400 400" className="w-full h-full max-h-[600px] select-none touch-none">
                        <g>
                            {/* 1. Render Placed Discs */}
                            {discs.map(d => {
                                const [q, r] = d.split(',').map(Number);
                                const { x, y } = hexToPixel(q, r);
                                const isSelected = selectedItem === d && (phase === 'p1_disc_select' || phase === 'p1_disc_dest');
                                const isMovable = movableDiscsList.includes(d);
                                const isLastPlaced = d === lastPlacedDisc;

                                return (
                                    <g key={`disc-${d}`} transform={`translate(${x},${y})`}
                                        onClick={() => handleHexClick(d)}
                                        className="cursor-pointer"
                                    >
                                        <polygon
                                            points={hexPoints}
                                            fill="#e6cba8"
                                            stroke="#b88f61"
                                            strokeWidth="2"
                                            className="transition-all duration-200"
                                        />
                                        {/* Highlight effects */}
                                        {isSelected && <polygon points={hexPoints} fill="none" stroke="#3b82f6" strokeWidth="4" />}
                                        {isMovable && !isSelected && <polygon points={hexPoints} fill="#fef08a" fillOpacity="0.4" />}
                                        {isLastPlaced && !isSelected && <circle r="4" fill="#ef4444" opacity="0.5" />}
                                    </g>
                                );
                            })}

                            {/* 2. Render Ghost Target Discs (for placing) */}
                            {getValidGhostDiscs().map(d => {
                                const [q, r] = d.split(',').map(Number);
                                const { x, y } = hexToPixel(q, r);
                                return (
                                    <g key={`ghost-${d}`} transform={`translate(${x},${y})`}
                                        onClick={() => handleHexClick(d)}
                                        className="cursor-pointer hover:opacity-80"
                                    >
                                        <polygon
                                            points={hexPoints}
                                            fill="#e6cba8"
                                            fillOpacity="0.4"
                                            stroke="#b88f61"
                                            strokeWidth="2"
                                            strokeDasharray="4 4"
                                        />
                                        <circle r="8" fill="#3b82f6" opacity="0.6" />
                                    </g>
                                );
                            })}

                            {/* 3. Render Tokens */}
                            {[...tokens.p1, ...tokens.p2].map(t => {
                                const [q, r] = t.split(',').map(Number);
                                const { x, y } = hexToPixel(q, r);
                                const isP1 = tokens.p1.includes(t);
                                const isSelected = selectedItem === t && (phase === 'p1_token_select' || phase === 'p1_token_dest');
                                const isClickable = isP1 && phase.startsWith('p1_token');

                                return (
                                    <g key={`token-${t}`} transform={`translate(${x},${y})`}
                                        onClick={() => isClickable ? handleHexClick(t) : null}
                                        className={isClickable ? "cursor-pointer" : ""}
                                    >
                                        {isSelected && <circle r="18" fill="#fef08a" opacity="0.8" />}
                                        <circle
                                            r="12"
                                            fill={isP1 ? "#ef4444" : "#1c1917"}
                                            stroke="rgba(255,255,255,0.3)"
                                            strokeWidth="2"
                                            className="drop-shadow-md"
                                        />
                                    </g>
                                );
                            })}

                            {/* 4. Render Target Dots for Token Moves */}
                            {getValidIndicators().map(d => {
                                const [q, r] = d.split(',').map(Number);
                                const { x, y } = hexToPixel(q, r);
                                return (
                                    <circle
                                        key={`target-${d}`}
                                        cx={x} cy={y} r="8"
                                        fill="#3b82f6"
                                        className="cursor-pointer hover:r-[10px] transition-all"
                                        onClick={() => handleHexClick(d)}
                                    />
                                );
                            })}
                        </g>
                    </svg>
                </div>

                {/* Player Legend */}
                <div className="flex justify-center gap-8 text-sm font-medium text-stone-600">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm"></div>
                        You (Player)
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-stone-900 shadow-sm"></div>
                        AI (Opponent)
                    </div>
                </div>

            </div>
        </div>
    );
}
