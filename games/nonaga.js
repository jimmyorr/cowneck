import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { RefreshCw, Info, RotateCcw, Users, Cpu, Award, ArrowLeft, X } from 'lucide-react';

// --- Hex Math & Cached Geometry ---
export const HEX_SIZE = 28;
export const DIRS = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
];

const SQRT3 = Math.sqrt(3);
const COORD_CACHE = new Map();
const NEIGHBOR_CACHE = new Map();
const PIXEL_CACHE = new Map();

export const parseHex = (str) => {
    let parsed = COORD_CACHE.get(str);
    if (!parsed) {
        const comma = str.indexOf(',');
        parsed = [Number(str.slice(0, comma)), Number(str.slice(comma + 1))];
        COORD_CACHE.set(str, parsed);
    }
    return parsed;
};

export const getNeighbors = (str) => {
    let nbrs = NEIGHBOR_CACHE.get(str);
    if (!nbrs) {
        const [q, r] = parseHex(str);
        nbrs = DIRS.map(([dq, dr]) => `${q + dq},${r + dr}`);
        NEIGHBOR_CACHE.set(str, nbrs);
    }
    return nbrs;
};

export const hexDistStr = (a, b) => {
    if (a === b) return 0;
    const [q1, r1] = parseHex(a);
    const [q2, r2] = parseHex(b);
    const dq = q1 - q2;
    const dr = r1 - r2;
    return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
};

export const hexToPixel = (q, r) => {
    const key = `${q},${r}`;
    let pt = PIXEL_CACHE.get(key);
    if (!pt) {
        pt = {
            x: HEX_SIZE * SQRT3 * (q + r / 2),
            y: HEX_SIZE * 1.5 * r,
        };
        PIXEL_CACHE.set(key, pt);
    }
    return pt;
};

export const hexStrToPixel = (str) => {
    const [q, r] = parseHex(str);
    return hexToPixel(q, r);
};

const getHexPoints = (radius = HEX_SIZE) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angleRad = (Math.PI / 180) * (60 * i - 30); // Pointy-topped hex
        points.push(`${(radius * Math.cos(angleRad)).toFixed(2)},${(radius * Math.sin(angleRad)).toFixed(2)}`);
    }
    return points.join(' ');
};

export const initBoard = () => {
    const discs = [];
    for (let r = -2; r <= 2; r++) {
        const q1 = Math.max(-2, -r - 2);
        const q2 = Math.min(2, -r + 2);
        for (let q = q1; q <= q2; q++) {
            discs.push(`${q},${r}`);
        }
    }
    return discs;
};

export const initTokens = () => ({
    p1: ['0,-2', '2,0', '-2,2'], // Red
    p2: ['2,-2', '0,2', '-2,0'], // Black
});

const replaceAt = (arr, idx, value) => {
    const next = arr.slice();
    next[idx] = value;
    return next;
};

// --- Core Rules Engine ---
export const isConnectedAfterRemoval = (discsArray, removeStr, discSetOpt = null) => {
    const discSet = discSetOpt || new Set(discsArray);
    const totalRemaining = discSet.has(removeStr) ? discSet.size - 1 : discSet.size;
    if (totalRemaining <= 1) return true;

    let start = null;
    for (let i = 0; i < discsArray.length; i++) {
        if (discsArray[i] !== removeStr) {
            start = discsArray[i];
            break;
        }
    }
    if (!start) return true;

    const visited = new Set([start]);
    const queue = [start];
    let head = 0;

    while (head < queue.length) {
        const curr = queue[head++];
        const nbrs = getNeighbors(curr);
        for (let i = 0; i < 6; i++) {
            const nStr = nbrs[i];
            if (nStr !== removeStr && discSet.has(nStr) && !visited.has(nStr)) {
                visited.add(nStr);
                queue.push(nStr);
            }
        }
    }

    return visited.size === totalRemaining;
};

export const getValidDiscPlacements = (discsArray, removedStr, discSetOpt = null) => {
    const discSet = discSetOpt || new Set(discsArray);
    const placements = new Set();

    for (let i = 0; i < discsArray.length; i++) {
        const d = discsArray[i];
        if (d === removedStr) continue;

        const nbrs = getNeighbors(d);
        for (let dir = 0; dir < 6; dir++) {
            const candidate = nbrs[dir];
            // Must relocate to a DIFFERENT empty space (cannot place back onto removedStr)
            if (candidate === removedStr || discSet.has(candidate)) continue;
            if (placements.has(candidate)) continue;

            const candNbrs = getNeighbors(candidate);
            let touches = 0;
            for (let k = 0; k < 6; k++) {
                const cn = candNbrs[k];
                if (cn !== removedStr && discSet.has(cn)) {
                    touches++;
                    if (touches >= 2) {
                        placements.add(candidate);
                        break;
                    }
                }
            }
        }
    }

    return Array.from(placements);
};

export const isDiscMovable = (dStr, discsArray, tokens, lastPlacedStr, discSetOpt = null, occupiedSetOpt = null) => {
    const discSet = discSetOpt || new Set(discsArray);
    if (!discSet.has(dStr)) return false;
    if (dStr === lastPlacedStr) return false;

    const occupied = occupiedSetOpt || new Set([...tokens.p1, ...tokens.p2]);
    if (occupied.has(dStr)) return false;

    // A disc can physically slide out freely iff at least 2 consecutive adjacent hexes are empty
    const nbrs = getNeighbors(dStr);
    let canSlide = false;
    for (let i = 0; i < 6; i++) {
        if (!discSet.has(nbrs[i]) && !discSet.has(nbrs[(i + 1) % 6])) {
            canSlide = true;
            break;
        }
    }
    if (!canSlide) return false;

    if (!isConnectedAfterRemoval(discsArray, dStr, discSet)) return false;

    return getValidDiscPlacements(discsArray, dStr, discSet).length > 0;
};

export const getMovableDiscs = (discsArray, tokens, lastPlacedStr, discSetOpt = null, occupiedSetOpt = null) => {
    const discSet = discSetOpt || new Set(discsArray);
    const occupied = occupiedSetOpt || new Set([...tokens.p1, ...tokens.p2]);
    const result = [];
    for (let i = 0; i < discsArray.length; i++) {
        const d = discsArray[i];
        if (isDiscMovable(d, discsArray, tokens, lastPlacedStr, discSet, occupied)) {
            result.push(d);
        }
    }
    return result;
};

export const getValidTokenMoves = (startStr, discsArray, tokens, discSetOpt = null, occupiedSetOpt = null) => {
    const discSet = discSetOpt || new Set(discsArray);
    const occupied = occupiedSetOpt || new Set([...tokens.p1, ...tokens.p2]);
    const [q, r] = parseHex(startStr);
    const moves = [];

    for (let i = 0; i < 6; i++) {
        const [dq, dr] = DIRS[i];
        let currQ = q + dq;
        let currR = r + dr;
        let lastValid = null;

        while (true) {
            const str = `${currQ},${currR}`;
            if (!discSet.has(str) || occupied.has(str)) break;
            lastValid = str;
            currQ += dq;
            currR += dr;
        }
        if (lastValid !== null) {
            moves.push(lastValid);
        }
    }

    return moves;
};

export const hasAnyTokenMove = (side, discsArray, tokens) => {
    const discSet = new Set(discsArray);
    const occupied = new Set([...tokens.p1, ...tokens.p2]);
    const playerTokens = tokens[side];
    for (let i = 0; i < playerTokens.length; i++) {
        if (getValidTokenMoves(playerTokens[i], discsArray, tokens, discSet, occupied).length > 0) {
            return true;
        }
    }
    return false;
};

export const getWinningConnection = (playerTokens) => {
    if (!playerTokens || playerTokens.length < 3) return null;
    const [t0, t1, t2] = playerTokens;
    const d01 = hexDistStr(t0, t1) === 1;
    const d12 = hexDistStr(t1, t2) === 1;
    const d02 = hexDistStr(t0, t2) === 1;

    if (!((d01 && d12) || (d01 && d02) || (d12 && d02))) {
        return null;
    }

    const edges = [];
    if (d01) edges.push([t0, t1]);
    if (d12) edges.push([t1, t2]);
    if (d02) edges.push([t0, t2]);
    return edges;
};

export const checkWin = (playerTokens) => Boolean(getWinningConnection(playerTokens));

// --- Board Camera Framing ---
const VIEWBOX_HALF = 185;
const VIEWBOX_SIZE = VIEWBOX_HALF * 2;
const CAMERA_PAD = 86; // Guarantees all placed discs + adjacent ghost placement hexes stay in frame

export const computeBoardCamera = (discsArray) => {
    if (!discsArray || discsArray.length === 0) {
        return { cx: 0, cy: 0, scale: 1 };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < discsArray.length; i++) {
        const { x, y } = hexStrToPixel(discsArray[i]);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }

    minX -= CAMERA_PAD;
    maxX += CAMERA_PAD;
    minY -= CAMERA_PAD;
    maxY += CAMERA_PAD;

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const span = Math.max(VIEWBOX_SIZE, maxX - minX, maxY - minY);
    const scale = VIEWBOX_SIZE / span;

    return { cx, cy, scale };
};

// --- AI Evaluation & Search ---
const analyzeOneSlide = (sideTokens, discSet, occupiedSet) => {
    const [t0, t1, t2] = sideTokens;
    const d01 = hexDistStr(t0, t1);
    const d12 = hexDistStr(t1, t2);
    const d02 = hexDistStr(t0, t2);
    const distSum = d01 + d12 + d02;
    const hasPair = d01 === 1 || d12 === 1 || d02 === 1;

    // Other-two-tokens info for each index 0, 1, 2
    const others = [
        [t1, t2, d12],
        [t0, t2, d02],
        [t0, t1, d01],
    ];

    let immediateWins = 0;
    let mobility = 0;
    let bestNextDist = distSum;

    for (let i = 0; i < 3; i++) {
        const [oa, ob, dab] = others[i];
        const [q, r] = parseHex(sideTokens[i]);

        for (let dir = 0; dir < 6; dir++) {
            const [dq, dr] = DIRS[dir];
            let currQ = q + dq;
            let currR = r + dr;
            let dest = null;

            while (true) {
                const str = `${currQ},${currR}`;
                if (!discSet.has(str) || occupiedSet.has(str)) break;
                dest = str;
                currQ += dq;
                currR += dr;
            }

            if (dest !== null) {
                mobility++;
                const da = hexDistStr(dest, oa);
                const db = hexDistStr(dest, ob);
                if ((da === 1 && db === 1) || (da === 1 && dab === 1) || (db === 1 && dab === 1)) {
                    immediateWins++;
                }
                const nextDist = da + db + dab;
                if (nextDist < bestNextDist) {
                    bestNextDist = nextDist;
                }
            }
        }
    }

    return { distSum, hasPair, immediateWins, mobility, bestNextDist };
};

const evaluateState = (tokens, discSet, occupiedSet, aiSide, difficulty) => {
    const oppSide = aiSide === 'p1' ? 'p2' : 'p1';

    if (difficulty === 'casual') {
        const [m0, m1, m2] = tokens[aiSide];
        const [o0, o1, o2] = tokens[oppSide];
        const myDist = hexDistStr(m0, m1) + hexDistStr(m1, m2) + hexDistStr(m0, m2);
        const oppDist = hexDistStr(o0, o1) + hexDistStr(o1, o2) + hexDistStr(o0, o2);
        return (oppDist - myDist * 1.15) * 1.8;
    }

    const myStats = analyzeOneSlide(tokens[aiSide], discSet, occupiedSet);
    const oppStats = analyzeOneSlide(tokens[oppSide], discSet, occupiedSet);

    let score = 0;
    if (oppStats.immediateWins > 0) {
        score -= 10000 + oppStats.immediateWins * 600;
    }
    if (oppStats.mobility === 0) {
        // Complete blockade of opponent wins the game!
        return 8500;
    }

    // Direct threats created by token + disc synergy (e.g. placing a backstop disc)
    score += myStats.immediateWins * 34;
    if (myStats.immediateWins >= 2) {
        score += 80; // Double-threat fork bonus
    }

    // Current compactness + 1-slide reachable compactness on the modified board
    score += (oppStats.distSum - myStats.distSum * 1.18) * 3.0;
    score += (oppStats.bestNextDist - myStats.bestNextDist * 1.25) * 4.6;
    score += (myStats.hasPair ? 4.0 : 0) - (oppStats.hasPair ? 4.4 : 0);
    score += (myStats.mobility - oppStats.mobility) * 0.65;

    return score;
};

// Verify opponent replies for Tactical / Master difficulty:
// Spots forced 2-turn wins (including unremovable lastPlacedDisc backstops) and avoids 2-turn traps
const evaluateOpponentBestReply = (discsArray, discSet, tokens, lastPlacedByAI, aiSide, maxOppBranches = 6) => {
    const oppSide = aiSide === 'p1' ? 'p2' : 'p1';
    const occupied = new Set([...tokens.p1, ...tokens.p2]);

    // Gather opponent token slides and rank them so we examine strong replies first
    const oppTokenMoves = [];
    for (let j = 0; j < 3; j++) {
        const moves = getValidTokenMoves(tokens[oppSide][j], discsArray, tokens, discSet, occupied);
        for (let m = 0; m < moves.length; m++) {
            const nextOppTokens = replaceAt(tokens[oppSide], j, moves[m]);
            if (checkWin(nextOppTokens)) {
                return -12000; // Opponent wins immediately
            }
            const d01 = hexDistStr(nextOppTokens[0], nextOppTokens[1]);
            const d12 = hexDistStr(nextOppTokens[1], nextOppTokens[2]);
            const d02 = hexDistStr(nextOppTokens[0], nextOppTokens[2]);
            oppTokenMoves.push({
                nextOppTokens,
                compact: d01 + d12 + d02,
            });
        }
    }

    if (oppTokenMoves.length === 0) {
        return 9000; // Opponent has no legal token moves
    }

    oppTokenMoves.sort((a, b) => a.compact - b.compact);
    const maxBranches = Math.min(oppTokenMoves.length, maxOppBranches);

    let worstForAI = Infinity;
    let oppCanStopAIWin = false;

    for (let b = 0; b < maxBranches; b++) {
        const { nextOppTokens } = oppTokenMoves[b];
        const afterOppToken = {
            ...tokens,
            [oppSide]: nextOppTokens,
        };
        const nextOccupied = new Set([...afterOppToken.p1, ...afterOppToken.p2]);
        const movable = getMovableDiscs(discsArray, afterOppToken, lastPlacedByAI, discSet, nextOccupied);

        if (movable.length === 0) {
            const aiAfter = analyzeOneSlide(afterOppToken[aiSide], discSet, nextOccupied);
            if (aiAfter.immediateWins === 0) oppCanStopAIWin = true;
            const replyScore = aiAfter.immediateWins > 0
                ? 4500
                : evaluateState(afterOppToken, discSet, nextOccupied, aiSide, 'tactical');
            if (replyScore < worstForAI) worstForAI = replyScore;
            continue;
        }

        for (let s = 0; s < movable.length; s++) {
            const dSrc = movable[s];
            const placements = getValidDiscPlacements(discsArray, dSrc, discSet);
            for (let p = 0; p < placements.length; p++) {
                const dDest = placements[p];
                const replyDiscSet = new Set(discSet);
                replyDiscSet.delete(dSrc);
                replyDiscSet.add(dDest);

                const aiAfter = analyzeOneSlide(afterOppToken[aiSide], replyDiscSet, nextOccupied);
                if (aiAfter.immediateWins === 0) {
                    oppCanStopAIWin = true;
                }

                let replyScore;
                if (aiAfter.immediateWins > 0) {
                    replyScore = 4500 + aiAfter.immediateWins * 100;
                } else {
                    replyScore = evaluateState(afterOppToken, replyDiscSet, nextOccupied, aiSide, 'tactical');
                }

                if (replyScore < worstForAI) {
                    worstForAI = replyScore;
                }
            }
        }
    }

    // If we checked ALL opponent token moves and none could stop AI's next-turn win, it's a forced win!
    if (!oppCanStopAIWin && oppTokenMoves.length <= maxBranches) {
        return 6000;
    }

    return worstForAI;
};

export const chooseAIMove = (discsArray, tokens, lastPlacedDisc, aiSide = 'p2', difficulty = 'tactical') => {
    const discSet = new Set(discsArray);
    const occupiedSet = new Set([...tokens.p1, ...tokens.p2]);
    const myTokens = tokens[aiSide];

    // 1. Check immediate Step-1 winning slide
    for (let i = 0; i < 3; i++) {
        const validTMoves = getValidTokenMoves(myTokens[i], discsArray, tokens, discSet, occupiedSet);
        for (let m = 0; m < validTMoves.length; m++) {
            const tDest = validTMoves[m];
            const nextSideTokens = replaceAt(myTokens, i, tDest);
            if (checkWin(nextSideTokens)) {
                return { tIdx: i, tDest, dSrc: null, dDest: null };
            }
        }
    }

    // 2. Enumerate legal (token slide + disc relocation) combinations
    const candidates = [];

    for (let i = 0; i < 3; i++) {
        const validTMoves = getValidTokenMoves(myTokens[i], discsArray, tokens, discSet, occupiedSet);

        for (let m = 0; m < validTMoves.length; m++) {
            const tDest = validTMoves[m];
            const tempTokens = {
                ...tokens,
                [aiSide]: replaceAt(myTokens, i, tDest),
            };
            const tempOccupied = new Set([...tempTokens.p1, ...tempTokens.p2]);
            const movableDiscs = getMovableDiscs(discsArray, tempTokens, lastPlacedDisc, discSet, tempOccupied);

            if (movableDiscs.length === 0) {
                const baseScore = evaluateState(tempTokens, discSet, tempOccupied, aiSide, difficulty);
                candidates.push({
                    tIdx: i,
                    tDest,
                    dSrc: null,
                    dDest: null,
                    baseScore,
                    nextDiscs: discsArray,
                    nextDiscSet: discSet,
                    tempTokens,
                });
                continue;
            }

            for (let s = 0; s < movableDiscs.length; s++) {
                const dSrc = movableDiscs[s];
                const placements = getValidDiscPlacements(discsArray, dSrc, discSet);

                for (let p = 0; p < placements.length; p++) {
                    const dDest = placements[p];
                    const nextDiscSet = new Set(discSet);
                    nextDiscSet.delete(dSrc);
                    nextDiscSet.add(dDest);

                    const baseScore = evaluateState(tempTokens, nextDiscSet, tempOccupied, aiSide, difficulty);
                    candidates.push({
                        tIdx: i,
                        tDest,
                        dSrc,
                        dDest,
                        baseScore,
                        nextDiscs: null,
                        nextDiscSet,
                        tempTokens,
                    });
                }
            }
        }
    }

    if (candidates.length === 0) return null;

    if (difficulty === 'master' || difficulty === 'tactical') {
        const isMaster = difficulty === 'master';
        const topCount = Math.min(candidates.length, isMaster ? 8 : 3);
        const oppBranches = isMaster ? 6 : 3;
        const jitter = isMaster ? 0.06 : 0.35;

        candidates.sort((a, b) => b.baseScore - a.baseScore);
        for (let k = 0; k < topCount; k++) {
            const cand = candidates[k];
            if (cand.baseScore < -5000 && k > 0) break;
            const nextDiscs = cand.dSrc
                ? discsArray.map((d) => (d === cand.dSrc ? cand.dDest : d))
                : discsArray;
            const replyVal = evaluateOpponentBestReply(
                nextDiscs,
                cand.nextDiscSet,
                cand.tempTokens,
                cand.dDest,
                aiSide,
                oppBranches
            );
            cand.finalScore = cand.baseScore * 0.45 + replyVal * 0.55 + Math.random() * jitter;
        }
        for (let k = topCount; k < candidates.length; k++) {
            candidates[k].finalScore = candidates[k].baseScore - 40 + Math.random() * jitter;
        }
    } else {
        for (let k = 0; k < candidates.length; k++) {
            candidates[k].finalScore = candidates[k].baseScore + Math.random() * 5.2;
        }
    }

    let bestScore = -Infinity;
    let bestMoves = [];
    const tieEps = difficulty === 'casual' ? 0.6 : 0.05;

    for (let k = 0; k < candidates.length; k++) {
        const c = candidates[k];
        if (c.finalScore > bestScore + tieEps) {
            bestScore = c.finalScore;
            bestMoves = [c];
        } else if (Math.abs(c.finalScore - bestScore) <= tieEps) {
            bestMoves.push(c);
        }
    }

    const picked = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    return {
        tIdx: picked.tIdx,
        tDest: picked.tDest,
        dSrc: picked.dSrc,
        dDest: picked.dDest,
    };
};

// --- Main React Component ---
export default function App() {
    const [gameMode, setGameMode] = useState('ai'); // 'ai' | '2p'
    const [difficulty, setDifficulty] = useState('tactical'); // 'casual' | 'tactical' | 'master'
    const [humanSide, setHumanSide] = useState('p1'); // 'p1' (Red, 1st) | 'p2' (Black, 2nd)

    const [discs, setDiscs] = useState(initBoard);
    const [tokens, setTokens] = useState(initTokens);
    const [turn, setTurn] = useState('p1'); // 'p1' | 'p2'
    const [step, setStep] = useState('token_select'); // 'token_select' | 'token_dest' | 'disc_select' | 'disc_dest' | 'ai_thinking' | 'ai_animating' | 'game_over'
    const [turnNumber, setTurnNumber] = useState(1);

    const [selectedItem, setSelectedItem] = useState(null);
    const [lastPlacedDisc, setLastPlacedDisc] = useState(null);
    const [lastMove, setLastMove] = useState(null); // { side, tokenFrom, tokenTo, discFrom, discTo }
    const [pendingMove, setPendingMove] = useState(null); // { side, tokenFrom, tokenTo } during Step 2
    const [winner, setWinner] = useState(null);
    const [winReason, setWinReason] = useState('connect'); // 'connect' | 'blockade'
    const [notice, setNotice] = useState(null);
    const [history, setHistory] = useState([]);
    const [showRules, setShowRules] = useState(false);

    const sessionRef = useRef(0);
    const timersRef = useRef([]);

    const hexPoints = useMemo(() => getHexPoints(HEX_SIZE), []);
    const innerHexPoints = useMemo(() => getHexPoints(HEX_SIZE - 4), []);

    const aiSide = gameMode === 'ai' ? (humanSide === 'p1' ? 'p2' : 'p1') : null;

    const clearPendingTimers = useCallback(() => {
        for (let i = 0; i < timersRef.current.length; i++) {
            clearTimeout(timersRef.current[i]);
        }
        timersRef.current = [];
    }, []);

    useEffect(() => () => clearPendingTimers(), [clearPendingTimers]);

    const scheduleTimer = useCallback((fn, ms) => {
        const id = setTimeout(fn, ms);
        timersRef.current.push(id);
        return id;
    }, []);

    const startNewGame = useCallback(
        (nextMode = gameMode, nextHumanSide = humanSide) => {
            sessionRef.current += 1;
            clearPendingTimers();

            const freshDiscs = initBoard();
            const freshTokens = initTokens();
            const nextAiSide = nextMode === 'ai' ? (nextHumanSide === 'p1' ? 'p2' : 'p1') : null;

            setDiscs(freshDiscs);
            setTokens(freshTokens);
            setTurn('p1');
            setStep(nextAiSide === 'p1' ? 'ai_thinking' : 'token_select');
            setTurnNumber(1);
            setSelectedItem(null);
            setLastPlacedDisc(null);
            setLastMove(null);
            setPendingMove(null);
            setWinner(null);
            setWinReason('connect');
            setNotice(null);
            setHistory([]);
        },
        [gameMode, humanSide, clearPendingTimers]
    );

    const advanceToPlayer = useCallback(
        (nextSide, nextDiscs, nextTokens) => {
            if (!hasAnyTokenMove(nextSide, nextDiscs, nextTokens)) {
                const otherSide = nextSide === 'p1' ? 'p2' : 'p1';
                setTurn(nextSide);
                setWinner(otherSide);
                setWinReason('blockade');
                setStep('game_over');
                return;
            }
            setTurn(nextSide);
            if (nextSide === 'p1') {
                setTurnNumber((n) => n + 1);
            }
            setStep(aiSide === nextSide ? 'ai_thinking' : 'token_select');
        },
        [aiSide]
    );

    const handleUndo = useCallback(() => {
        if (history.length === 0) return;
        sessionRef.current += 1;
        clearPendingTimers();

        const snapshot = history[history.length - 1];
        setHistory((prev) => prev.slice(0, -1));
        setDiscs(snapshot.discs);
        setTokens(snapshot.tokens);
        setTurn(snapshot.turn);
        setTurnNumber(snapshot.turnNumber);
        setLastPlacedDisc(snapshot.lastPlacedDisc);
        setLastMove(snapshot.lastMove);
        setPendingMove(null);
        setSelectedItem(null);
        setWinner(null);
        setWinReason('connect');
        setNotice(null);
        setStep('token_select');
    }, [history, clearPendingTimers]);

    // Keyboard shortcuts: Escape to cancel selection / close rules, Ctrl/Cmd+Z to undo
    useEffect(() => {
        const onKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                if (history.length > 0) {
                    e.preventDefault();
                    handleUndo();
                }
                return;
            }
            if (e.key === 'Escape') {
                if (step === 'token_dest') {
                    setSelectedItem(null);
                    setStep('token_select');
                } else if (step === 'disc_dest') {
                    setSelectedItem(null);
                    setStep('disc_select');
                } else if (showRules) {
                    setShowRules(false);
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [step, showRules, history.length, handleUndo]);

    // AI Turn Execution
    useEffect(() => {
        if (step !== 'ai_thinking' || !aiSide || turn !== aiSide) return;

        const currentSession = sessionRef.current;

        scheduleTimer(() => {
            if (sessionRef.current !== currentSession) return;

            const move = chooseAIMove(discs, tokens, lastPlacedDisc, aiSide, difficulty);
            const otherSide = aiSide === 'p1' ? 'p2' : 'p1';

            if (!move) {
                setWinner(otherSide);
                setWinReason('blockade');
                setStep('game_over');
                return;
            }

            const tokenFrom = tokens[aiSide][move.tIdx];
            const nextTokens = {
                ...tokens,
                [aiSide]: replaceAt(tokens[aiSide], move.tIdx, move.tDest),
            };

            setStep('ai_animating');
            setTokens(nextTokens);
            setPendingMove({ side: aiSide, tokenFrom, tokenTo: move.tDest });

            if (checkWin(nextTokens[aiSide])) {
                setLastMove({
                    side: aiSide,
                    tokenFrom,
                    tokenTo: move.tDest,
                    discFrom: null,
                    discTo: null,
                });
                setPendingMove(null);
                setWinner(aiSide);
                setWinReason('connect');
                setStep('game_over');
                return;
            }

            if (move.dSrc && move.dDest) {
                scheduleTimer(() => {
                    if (sessionRef.current !== currentSession) return;

                    const nextDiscs = discs.map((d) => (d === move.dSrc ? move.dDest : d));
                    setDiscs(nextDiscs);
                    setLastPlacedDisc(move.dDest);
                    setLastMove({
                        side: aiSide,
                        tokenFrom,
                        tokenTo: move.tDest,
                        discFrom: move.dSrc,
                        discTo: move.dDest,
                    });
                    setPendingMove(null);
                    advanceToPlayer(otherSide, nextDiscs, nextTokens);
                }, 620);
            } else {
                setLastMove({
                    side: aiSide,
                    tokenFrom,
                    tokenTo: move.tDest,
                    discFrom: null,
                    discTo: null,
                });
                setPendingMove(null);
                setNotice('No edge discs could move without splitting the board.');
                advanceToPlayer(otherSide, discs, nextTokens);
            }
        }, 380);
    }, [step, aiSide, turn, discs, tokens, lastPlacedDisc, difficulty, scheduleTimer, advanceToPlayer]);

    // Memoized Board Sets & Derived Legal Moves
    const discSet = useMemo(() => new Set(discs), [discs]);
    const occupiedSet = useMemo(() => new Set([...tokens.p1, ...tokens.p2]), [tokens]);

    const tokenMovesByPiece = useMemo(() => {
        const map = new Map();
        if (step === 'token_select' || step === 'token_dest') {
            const activeTokens = tokens[turn];
            for (let i = 0; i < activeTokens.length; i++) {
                const coord = activeTokens[i];
                map.set(coord, getValidTokenMoves(coord, discs, tokens, discSet, occupiedSet));
            }
        }
        return map;
    }, [step, turn, discs, tokens, discSet, occupiedSet]);

    const validTokenTargets = useMemo(() => {
        if (step === 'token_dest' && selectedItem) {
            return tokenMovesByPiece.get(selectedItem) || [];
        }
        return [];
    }, [step, selectedItem, tokenMovesByPiece]);

    const movableDiscsList = useMemo(() => {
        if (step === 'disc_select' || step === 'disc_dest') {
            return getMovableDiscs(discs, tokens, lastPlacedDisc, discSet, occupiedSet);
        }
        return [];
    }, [step, discs, tokens, lastPlacedDisc, discSet, occupiedSet]);

    const movableDiscSet = useMemo(() => new Set(movableDiscsList), [movableDiscsList]);

    const validGhostDiscs = useMemo(() => {
        if (step === 'disc_dest' && selectedItem) {
            return getValidDiscPlacements(discs, selectedItem, discSet);
        }
        return [];
    }, [step, selectedItem, discs, discSet]);

    const winningEdges = useMemo(() => {
        if (step === 'game_over' && winner && winReason === 'connect') {
            return getWinningConnection(tokens[winner]);
        }
        return null;
    }, [step, winner, winReason, tokens]);

    const winningTokenSet = useMemo(() => {
        if (step === 'game_over' && winner && winReason === 'connect') {
            return new Set(tokens[winner]);
        }
        return new Set();
    }, [step, winner, winReason, tokens]);

    const camera = useMemo(() => computeBoardCamera(discs), [discs]);

    // Human Board Click Handler
    const handleHexClick = (str) => {
        if (step === 'ai_thinking' || step === 'ai_animating' || step === 'game_over') return;

        if (step === 'token_select') {
            if (tokens[turn].includes(str)) {
                const moves = tokenMovesByPiece.get(str) || [];
                if (moves.length > 0) {
                    setNotice(null);
                    setSelectedItem(str);
                    setStep('token_dest');
                }
            }
            return;
        }

        if (step === 'token_dest') {
            if (str === selectedItem) {
                setSelectedItem(null);
                setStep('token_select');
                return;
            }
            if (tokens[turn].includes(str)) {
                const moves = tokenMovesByPiece.get(str) || [];
                if (moves.length > 0) {
                    setSelectedItem(str);
                }
                return;
            }
            if (validTokenTargets.includes(str)) {
                // Save undo snapshot at the exact human decision point
                setHistory((prev) => [
                    ...prev,
                    {
                        discs,
                        tokens,
                        turn,
                        turnNumber,
                        lastPlacedDisc,
                        lastMove,
                    },
                ]);
                setNotice(null);

                const idx = tokens[turn].indexOf(selectedItem);
                const nextTokens = {
                    ...tokens,
                    [turn]: replaceAt(tokens[turn], idx, str),
                };
                const tokenFrom = selectedItem;

                setTokens(nextTokens);
                setSelectedItem(null);

                if (checkWin(nextTokens[turn])) {
                    setLastMove({
                        side: turn,
                        tokenFrom,
                        tokenTo: str,
                        discFrom: null,
                        discTo: null,
                    });
                    setPendingMove(null);
                    setWinner(turn);
                    setWinReason('connect');
                    setStep('game_over');
                    return;
                }

                // Verify at least one disc can legally move in Step 2
                const nextOccupied = new Set([...nextTokens.p1, ...nextTokens.p2]);
                const movableAfter = getMovableDiscs(discs, nextTokens, lastPlacedDisc, discSet, nextOccupied);
                if (movableAfter.length === 0) {
                    const otherSide = turn === 'p1' ? 'p2' : 'p1';
                    setLastMove({
                        side: turn,
                        tokenFrom,
                        tokenTo: str,
                        discFrom: null,
                        discTo: null,
                    });
                    setPendingMove(null);
                    setNotice('No edge discs can move without splitting the board — disc step skipped.');
                    advanceToPlayer(otherSide, discs, nextTokens);
                } else {
                    setPendingMove({ side: turn, tokenFrom, tokenTo: str });
                    setStep('disc_select');
                }
            } else {
                setSelectedItem(null);
                setStep('token_select');
            }
            return;
        }

        if (step === 'disc_select') {
            if (movableDiscSet.has(str)) {
                setSelectedItem(str);
                setStep('disc_dest');
            }
            return;
        }

        if (step === 'disc_dest') {
            if (str === selectedItem) {
                setSelectedItem(null);
                setStep('disc_select');
                return;
            }
            if (movableDiscSet.has(str)) {
                setSelectedItem(str);
                return;
            }
            if (validGhostDiscs.includes(str)) {
                const discFrom = selectedItem;
                const nextDiscs = discs.map((d) => (d === discFrom ? str : d));
                const otherSide = turn === 'p1' ? 'p2' : 'p1';

                setDiscs(nextDiscs);
                setLastPlacedDisc(str);
                setSelectedItem(null);
                setLastMove({
                    side: turn,
                    tokenFrom: pendingMove ? pendingMove.tokenFrom : null,
                    tokenTo: pendingMove ? pendingMove.tokenTo : null,
                    discFrom,
                    discTo: str,
                });
                setPendingMove(null);
                advanceToPlayer(otherSide, nextDiscs, tokens);
            } else {
                setSelectedItem(null);
                setStep('disc_select');
            }
        }
    };

    const handleKeyActivate = (e, coord) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleHexClick(coord);
        }
    };

    // UI Copy Helpers (Sentence case)
    const sideName = (side) => (side === 'p1' ? 'Red' : 'Black');
    const actorLabel = (side) => {
        if (gameMode === '2p') return `${sideName(side)}'s turn`;
        return side === humanSide ? 'Your turn' : 'AI turn';
    };

    const getStatusText = () => {
        if (step === 'game_over') {
            if (gameMode === '2p') {
                return winReason === 'blockade'
                    ? `${sideName(winner)} wins — opponent has no legal moves!`
                    : `${sideName(winner)} connected all 3 tokens and wins!`;
            }
            const humanWon = winner === humanSide;
            if (winReason === 'blockade') {
                return humanWon
                    ? 'You win — AI has no legal token moves!'
                    : 'AI wins — your tokens are completely blocked.';
            }
            return humanWon
                ? 'You connected all 3 tokens — you win!'
                : 'AI connected all 3 tokens — AI wins.';
        }

        if (step === 'ai_thinking') return 'AI is planning its move...';
        if (step === 'ai_animating') return 'AI is relocating an edge disc...';

        const colorWord = turn === 'p1' ? 'red' : 'black';
        if (step === 'token_select') {
            return `${actorLabel(turn)} (1/2): Select a ${colorWord} token to slide.`;
        }
        if (step === 'token_dest') {
            return `${actorLabel(turn)} (1/2): Choose a target dot to slide your token.`;
        }
        if (step === 'disc_select') {
            return `${actorLabel(turn)} (2/2): Select a highlighted edge disc to relocate.`;
        }
        if (step === 'disc_dest') {
            return `${actorLabel(turn)} (2/2): Place the disc on a dashed space.`;
        }
        return '';
    };

    // Stable array of all 6 pieces so React preserves DOM nodes for smooth CSS slide transitions
    const tokenPieces = [
        { side: 'p1', idx: 0, coord: tokens.p1[0] },
        { side: 'p1', idx: 1, coord: tokens.p1[1] },
        { side: 'p1', idx: 2, coord: tokens.p1[2] },
        { side: 'p2', idx: 0, coord: tokens.p2[0] },
        { side: 'p2', idx: 1, coord: tokens.p2[1] },
        { side: 'p2', idx: 2, coord: tokens.p2[2] },
    ];

    const trailMove = pendingMove || lastMove;
    const statusDotClass =
        step === 'game_over'
            ? winner === 'p1'
                ? 'bg-red-600'
                : 'bg-stone-900'
            : turn === 'p1'
            ? 'bg-red-500'
            : 'bg-stone-900';

    return (
        <div className="min-h-screen bg-stone-100 flex flex-col items-center py-4 sm:py-6 font-sans text-stone-800">
            <div className="w-full max-w-2xl px-4 flex flex-col gap-3.5">
                {/* Top navigation row */}
                <div className="flex items-center justify-between text-xs font-medium text-stone-500 px-1">
                    <a
                        id="link-back-games"
                        href="index.html"
                        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors"
                    >
                        <ArrowLeft size={15} />
                        Back to games
                    </a>
                    <span className="tabular-nums text-stone-400">Turn {turnNumber}</span>
                </div>

                {/* Header card */}
                <header className="bg-white p-4 sm:px-5 rounded-2xl shadow-sm border border-stone-200/90">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <h1 className="text-2xl font-display font-extrabold tracking-tight text-stone-900">
                                Nonaga
                            </h1>
                            {(step === 'disc_select' || step === 'disc_dest') && (
                                <span className="hidden sm:inline-block whitespace-nowrap shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                                    Step 2 of 2
                                </span>
                            )}
                            {(step === 'token_select' || step === 'token_dest') && (
                                <span className="hidden sm:inline-block whitespace-nowrap shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                                    Step 1 of 2
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            <button
                                id="btn-undo"
                                type="button"
                                onClick={handleUndo}
                                disabled={history.length === 0}
                                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-35 disabled:pointer-events-none rounded-xl transition-colors"
                                title="Undo move (Ctrl+Z)"
                                aria-label="Undo move"
                            >
                                <RotateCcw size={17} />
                                <span className="hidden sm:inline">Undo</span>
                            </button>
                            <button
                                id="btn-rules"
                                type="button"
                                onClick={() => setShowRules((v) => !v)}
                                aria-expanded={showRules}
                                aria-controls="nonaga-rules-panel"
                                aria-label="How to play"
                                title="How to play"
                                className={`p-2 rounded-xl transition-colors ${
                                    showRules
                                        ? 'bg-stone-200 text-stone-900'
                                        : 'text-stone-600 hover:bg-stone-100'
                                }`}
                            >
                                <Info size={19} />
                            </button>
                            <button
                                id="btn-restart"
                                type="button"
                                onClick={() => startNewGame()}
                                className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors text-sm font-semibold shadow-sm"
                            >
                                <RefreshCw size={15} />
                                <span>New game</span>
                            </button>
                        </div>
                    </div>

                    <p
                        aria-live="polite"
                        className="mt-2.5 pt-2.5 border-t border-stone-100 text-sm text-stone-600 font-medium flex items-center gap-2"
                    >
                        <span
                            className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${statusDotClass}`}
                            aria-hidden="true"
                        />
                        <span>{getStatusText()}</span>
                    </p>
                </header>

                {/* Mode & AI controls bar */}
                <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2 bg-white/80 px-3 py-2.5 rounded-2xl border border-stone-200/80 text-xs">
                    {/* Opponent mode */}
                    <div
                        className="inline-flex items-center bg-stone-100 p-1 rounded-xl"
                        role="group"
                        aria-label="Game mode"
                    >
                        <button
                            id="mode-ai"
                            type="button"
                            onClick={() => {
                                if (gameMode !== 'ai') {
                                    setGameMode('ai');
                                    startNewGame('ai', humanSide);
                                }
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                                gameMode === 'ai'
                                    ? 'bg-white text-stone-900 shadow-sm'
                                    : 'text-stone-500 hover:text-stone-800'
                            }`}
                        >
                            <Cpu size={13} />
                            Vs AI
                        </button>
                        <button
                            id="mode-2p"
                            type="button"
                            onClick={() => {
                                if (gameMode !== '2p') {
                                    setGameMode('2p');
                                    startNewGame('2p', humanSide);
                                }
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                                gameMode === '2p'
                                    ? 'bg-white text-stone-900 shadow-sm'
                                    : 'text-stone-500 hover:text-stone-800'
                            }`}
                        >
                            <Users size={13} />
                            2 players
                        </button>
                    </div>

                    {gameMode === 'ai' ? (
                        <>
                            {/* Side choice */}
                            <div
                                className="inline-flex items-center bg-stone-100 p-1 rounded-xl sm:order-3"
                                role="group"
                                aria-label="Player color"
                            >
                                <button
                                    id="side-p1"
                                    type="button"
                                    onClick={() => {
                                        if (humanSide !== 'p1') {
                                            setHumanSide('p1');
                                            startNewGame('ai', 'p1');
                                        }
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                                        humanSide === 'p1'
                                            ? 'bg-white text-stone-900 shadow-sm'
                                            : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
                                    Red · 1st
                                </button>
                                <button
                                    id="side-p2"
                                    type="button"
                                    onClick={() => {
                                        if (humanSide !== 'p2') {
                                            setHumanSide('p2');
                                            startNewGame('ai', 'p2');
                                        }
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                                        humanSide === 'p2'
                                            ? 'bg-white text-stone-900 shadow-sm'
                                            : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-stone-900" aria-hidden="true" />
                                    Black · 2nd
                                </button>
                            </div>

                            {/* Difficulty */}
                            <div
                                className="inline-flex items-center bg-stone-100 p-1 rounded-xl sm:order-2"
                                role="group"
                                aria-label="AI difficulty"
                            >
                                {[
                                    { id: 'casual', label: 'Casual' },
                                    { id: 'tactical', label: 'Tactical' },
                                    { id: 'master', label: 'Master' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        id={`diff-${opt.id}`}
                                        type="button"
                                        onClick={() => setDifficulty(opt.id)}
                                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                                            difficulty === opt.id
                                                ? 'bg-white text-stone-900 shadow-sm'
                                                : 'text-stone-500 hover:text-stone-800'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <span className="text-stone-500 font-medium px-1">
                            Pass and play · Red moves first
                        </span>
                    )}
                </div>

                {/* Collapsible rules panel */}
                {showRules && (
                    <section
                        id="nonaga-rules-panel"
                        className="bg-amber-50/80 text-stone-800 p-5 rounded-2xl text-sm leading-relaxed border border-amber-200/90 shadow-sm relative"
                    >
                        <button
                            type="button"
                            onClick={() => setShowRules(false)}
                            aria-label="Close rules"
                            className="absolute top-3.5 right-3.5 p-1.5 text-stone-500 hover:text-stone-900 hover:bg-amber-100/70 rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                        <h2 className="font-bold text-base text-stone-900 mb-2">How to play</h2>
                        <p className="mb-2.5">
                            <strong>Goal:</strong> Be the first player to connect all 3 of your tokens on adjacent
                            discs (in a line, angle, or triangle).
                        </p>
                        <ul className="list-disc pl-5 space-y-1.5 text-stone-700">
                            <li>
                                <strong>Step 1 — Slide a token:</strong> Move one of your tokens in a straight line
                                until it reaches the edge of the board or stops right before another token.
                            </li>
                            <li>
                                <strong>Step 2 — Relocate an edge disc:</strong> Pick up an empty outer disc that can
                                slide free without splitting the board, and place it in a new spot touching at least 2
                                discs.
                            </li>
                        </ul>
                        <p className="text-xs text-stone-600 mt-3">
                            Pin rule: You cannot move the exact disc your opponent just placed on the previous turn.
                        </p>
                    </section>
                )}

                {/* Transient notice banner for rare skipped disc step */}
                {notice && (
                    <div className="bg-stone-800 text-stone-100 text-xs font-medium px-4 py-2.5 rounded-xl flex items-center justify-between">
                        <span>{notice}</span>
                        <button
                            type="button"
                            onClick={() => setNotice(null)}
                            className="text-stone-400 hover:text-white ml-3"
                            aria-label="Dismiss notice"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Game board container */}
                <div className="board-surface rounded-3xl shadow-sm border border-stone-200/90 p-3 sm:p-5 aspect-square max-h-[540px] w-full flex flex-col items-center justify-center relative overflow-hidden">
                    <svg
                        viewBox={`-${VIEWBOX_HALF} -${VIEWBOX_HALF} ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
                        className="w-full h-full select-none touch-none"
                        role="group"
                        aria-label="Nonaga hexagonal board"
                    >
                        <g
                            className="board-camera"
                            style={{
                                transform: `scale(${camera.scale.toFixed(4)}) translate(${(-camera.cx).toFixed(2)}px, ${(-camera.cy).toFixed(2)}px)`,
                            }}
                        >
                            {/* 0. Previous-disc-origin subtle outline if empty */}
                            {lastMove &&
                                lastMove.discFrom &&
                                !discSet.has(lastMove.discFrom) &&
                                step !== 'disc_dest' && (() => {
                                    const { x, y } = hexStrToPixel(lastMove.discFrom);
                                    return (
                                        <g
                                            transform={`translate(${x},${y})`}
                                            className="pointer-events-none"
                                            opacity="0.28"
                                        >
                                            <polygon
                                                points={innerHexPoints}
                                                fill="none"
                                                stroke="#a8a29e"
                                                strokeWidth="1.5"
                                                strokeDasharray="3 4"
                                            />
                                        </g>
                                    );
                                })()}

                            {/* 1. Placed wooden discs */}
                            {discs.map((d) => {
                                const { x, y } = hexStrToPixel(d);
                                const isSelectedDisc =
                                    selectedItem === d && (step === 'disc_select' || step === 'disc_dest');
                                const isMovable =
                                    (step === 'disc_select' || step === 'disc_dest') && movableDiscSet.has(d);
                                const isPinned = d === lastPlacedDisc;
                                const isOccupied = occupiedSet.has(d);
                                const isActiveTokenHex =
                                    (step === 'token_select' || step === 'token_dest') &&
                                    tokens[turn].includes(d) &&
                                    (tokenMovesByPiece.get(d) || []).length > 0;
                                const isTargetHex = step === 'token_dest' && validTokenTargets.includes(d);
                                const isInteractive = isMovable || isActiveTokenHex || isTargetHex;

                                return (
                                    <g
                                        key={`disc-${d}`}
                                        transform={`translate(${x},${y})`}
                                        onClick={() => handleHexClick(d)}
                                        onKeyDown={isMovable ? (e) => handleKeyActivate(e, d) : undefined}
                                        tabIndex={isMovable ? 0 : undefined}
                                        role={isMovable ? 'button' : undefined}
                                        aria-label={
                                            isMovable
                                                ? isSelectedDisc
                                                    ? `Selected edge disc at ${d}`
                                                    : `Movable edge disc at ${d}`
                                                : undefined
                                        }
                                        className={`svg-interactive ${isInteractive ? 'cursor-pointer group' : ''}`}
                                    >
                                        <polygon
                                            points={hexPoints}
                                            fill={isMovable && !isSelectedDisc ? '#f3dfb9' : '#e6cba8'}
                                            stroke={isSelectedDisc ? '#2563eb' : isMovable ? '#b45309' : '#b88f61'}
                                            strokeWidth={isSelectedDisc ? '3.2' : isMovable ? '2.4' : '2'}
                                            className="transition-colors duration-150"
                                        />
                                        {/* Tactile inner wood-disc ring */}
                                        <circle
                                            r="19"
                                            fill="none"
                                            stroke="rgba(146, 100, 52, 0.2)"
                                            strokeWidth="1.2"
                                            className="pointer-events-none"
                                        />
                                        {isMovable && !isSelectedDisc && (
                                            <polygon
                                                points={innerHexPoints}
                                                fill="#fef08a"
                                                fillOpacity="0.38"
                                                className="pointer-events-none group-hover:fill-opacity-60 transition-opacity"
                                            />
                                        )}
                                        <polygon
                                            points={hexPoints}
                                            fill="none"
                                            stroke="#2563eb"
                                            strokeWidth="3"
                                            opacity="0"
                                            className="focus-ring pointer-events-none"
                                        />
                                        {/* Pinned (just placed) indicator when unoccupied */}
                                        {isPinned && !isOccupied && !isSelectedDisc && (
                                            <g
                                                className="pointer-events-none"
                                                opacity="0.72"
                                                aria-hidden="true"
                                            >
                                                <circle
                                                    r="7.5"
                                                    fill="#f5ebe0"
                                                    stroke="#92400e"
                                                    strokeWidth="1.2"
                                                />
                                                <rect
                                                    x="-3"
                                                    y="-1"
                                                    width="6"
                                                    height="4.6"
                                                    rx="1"
                                                    fill="#78350f"
                                                />
                                                <path
                                                    d="M -1.8 -1 V -2.4 A 1.8 1.8 0 0 1 1.8 -2.4 V -1"
                                                    fill="none"
                                                    stroke="#78350f"
                                                    strokeWidth="1.2"
                                                    strokeLinecap="round"
                                                />
                                            </g>
                                        )}
                                    </g>
                                );
                            })}

                            {/* 2. Ghost placement targets for Step 2 */}
                            {validGhostDiscs.map((d) => {
                                const { x, y } = hexStrToPixel(d);
                                return (
                                    <g
                                        key={`ghost-${d}`}
                                        transform={`translate(${x},${y})`}
                                        onClick={() => handleHexClick(d)}
                                        onKeyDown={(e) => handleKeyActivate(e, d)}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`Place disc at ${d}`}
                                        className="svg-interactive target-hit-group cursor-pointer group"
                                    >
                                        <polygon
                                            points={hexPoints}
                                            fill="#e6cba8"
                                            fillOpacity="0.38"
                                            stroke="#b88f61"
                                            strokeWidth="2"
                                            strokeDasharray="4 4"
                                            className="group-hover:fill-opacity-65 transition-all"
                                        />
                                        <polygon
                                            points={hexPoints}
                                            fill="none"
                                            stroke="#2563eb"
                                            strokeWidth="3"
                                            opacity="0"
                                            className="focus-ring pointer-events-none"
                                        />
                                        <circle
                                            r="7.5"
                                            fill="#2563eb"
                                            opacity="0.75"
                                            className="target-dot-visual pointer-events-none"
                                        />
                                    </g>
                                );
                            })}

                            {/* 3. Last token move trail */}
                            {trailMove &&
                                trailMove.tokenFrom &&
                                trailMove.tokenTo &&
                                step !== 'token_dest' && (() => {
                                    const pFrom = hexStrToPixel(trailMove.tokenFrom);
                                    const pTo = hexStrToPixel(trailMove.tokenTo);
                                    const trailColor = trailMove.side === 'p1' ? '#dc2626' : '#292524';
                                    return (
                                        <g className="pointer-events-none" opacity="0.32">
                                            <line
                                                x1={pFrom.x}
                                                y1={pFrom.y}
                                                x2={pTo.x}
                                                y2={pTo.y}
                                                stroke={trailColor}
                                                strokeWidth="2.5"
                                                strokeDasharray="4 4"
                                                strokeLinecap="round"
                                            />
                                            <circle
                                                cx={pFrom.x}
                                                cy={pFrom.y}
                                                r="4.5"
                                                fill="none"
                                                stroke={trailColor}
                                                strokeWidth="2"
                                            />
                                        </g>
                                    );
                                })()}

                            {/* 4. Active token slide guide rays */}
                            {step === 'token_dest' &&
                                selectedItem &&
                                validTokenTargets.map((dest) => {
                                    const pFrom = hexStrToPixel(selectedItem);
                                    const pTo = hexStrToPixel(dest);
                                    return (
                                        <line
                                            key={`ray-${dest}`}
                                            x1={pFrom.x}
                                            y1={pFrom.y}
                                            x2={pTo.x}
                                            y2={pTo.y}
                                            stroke="#3b82f6"
                                            strokeWidth="2.2"
                                            strokeDasharray="4 4"
                                            strokeOpacity="0.55"
                                            strokeLinecap="round"
                                            className="pointer-events-none"
                                        />
                                    );
                                })}

                            {/* 5. Winning cluster connection bridges */}
                            {winningEdges &&
                                winningEdges.map(([a, b], idx) => {
                                    const pa = hexStrToPixel(a);
                                    const pb = hexStrToPixel(b);
                                    return (
                                        <line
                                            key={`win-edge-${idx}`}
                                            x1={pa.x}
                                            y1={pa.y}
                                            x2={pb.x}
                                            y2={pb.y}
                                            stroke="#f59e0b"
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            opacity="0.7"
                                            className="pointer-events-none win-pulse"
                                        />
                                    );
                                })}

                            {/* 6. Player tokens (keyed by piece identity for smooth CSS glides) */}
                            {tokenPieces.map((piece) => {
                                const { x, y } = hexStrToPixel(piece.coord);
                                const isP1 = piece.side === 'p1';
                                const isTurnPiece =
                                    piece.side === turn && (step === 'token_select' || step === 'token_dest');
                                const moves = isTurnPiece ? tokenMovesByPiece.get(piece.coord) || [] : [];
                                const canSelect = isTurnPiece && moves.length > 0;
                                const isBlockedTurnPiece = isTurnPiece && moves.length === 0;
                                const isSelected =
                                    selectedItem === piece.coord &&
                                    (step === 'token_select' || step === 'token_dest');
                                const isWinningPiece = winningTokenSet.has(piece.coord);

                                return (
                                    <g
                                        key={`token-${piece.side}-${piece.idx}`}
                                        style={{ transform: `translate(${x}px, ${y}px)` }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (canSelect) handleHexClick(piece.coord);
                                            else if (step === 'token_dest') handleHexClick(piece.coord);
                                        }}
                                        onKeyDown={canSelect ? (e) => handleKeyActivate(e, piece.coord) : undefined}
                                        tabIndex={canSelect ? 0 : undefined}
                                        role={canSelect ? 'button' : undefined}
                                        aria-label={
                                            canSelect
                                                ? `${isP1 ? 'Red' : 'Black'} token at ${piece.coord}, ${moves.length} legal moves`
                                                : undefined
                                        }
                                        opacity={isBlockedTurnPiece ? 0.55 : 1}
                                        className={`token-piece svg-interactive ${
                                            canSelect
                                                ? 'cursor-pointer group'
                                                : isBlockedTurnPiece
                                                ? 'cursor-not-allowed'
                                                : ''
                                        }`}
                                    >
                                        {/* Invisible generous tap area */}
                                        <circle r="20" fill="transparent" />

                                        {isWinningPiece && (
                                            <circle
                                                r="19"
                                                fill="none"
                                                stroke="#f59e0b"
                                                strokeWidth="3.5"
                                                className="win-pulse pointer-events-none"
                                            />
                                        )}

                                        {isSelected && (
                                            <circle r="18.5" fill="#fef08a" stroke="#eab308" strokeWidth="2" />
                                        )}

                                        {canSelect && !isSelected && (
                                            <circle
                                                r="16.5"
                                                fill="none"
                                                stroke={isP1 ? 'rgba(239,68,68,0.45)' : 'rgba(28,25,23,0.38)'}
                                                strokeWidth="2.5"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                            />
                                        )}

                                        <circle
                                            r="17"
                                            fill="none"
                                            stroke="#2563eb"
                                            strokeWidth="2.5"
                                            opacity="0"
                                            className="focus-ring pointer-events-none"
                                        />

                                        {/* Token body + specular inner ring */}
                                        <circle
                                            r="12.5"
                                            fill={isP1 ? '#dc2626' : '#1c1917'}
                                            stroke={isP1 ? '#991b1b' : '#0c0a09'}
                                            strokeWidth="1.5"
                                            className="drop-shadow-md"
                                        />
                                        <circle
                                            r="8.5"
                                            fill="none"
                                            stroke={isP1 ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.2)'}
                                            strokeWidth="1.2"
                                            className="pointer-events-none"
                                        />
                                    </g>
                                );
                            })}

                            {/* 7. Target dots for Step 1 token slides */}
                            {validTokenTargets.map((d) => {
                                const { x, y } = hexStrToPixel(d);
                                return (
                                    <g
                                        key={`target-${d}`}
                                        transform={`translate(${x},${y})`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleHexClick(d);
                                        }}
                                        onKeyDown={(e) => handleKeyActivate(e, d)}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`Slide token to ${d}`}
                                        className="svg-interactive target-hit-group cursor-pointer"
                                    >
                                        {/* Large touch target for mobile accuracy */}
                                        <circle r="20" fill="transparent" />
                                        <circle
                                            r="14"
                                            fill="none"
                                            stroke="#2563eb"
                                            strokeWidth="2.5"
                                            opacity="0"
                                            className="focus-ring pointer-events-none"
                                        />
                                        <g className="target-dot-visual pointer-events-none">
                                            <circle r="11" fill="rgba(59, 130, 246, 0.22)" />
                                            <circle r="6.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.8" />
                                        </g>
                                    </g>
                                );
                            })}
                        </g>
                    </svg>

                    {/* Game over overlay pill at bottom of board */}
                    {step === 'game_over' && (
                        <div className="absolute bottom-4 inset-x-4 sm:inset-x-auto sm:px-5 py-3 bg-white/95 backdrop-blur-sm border border-stone-200 rounded-2xl shadow-lg flex flex-wrap items-center justify-center gap-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                                <Award size={18} className="text-amber-500 shrink-0" />
                                <span>
                                    {gameMode === '2p'
                                        ? `${sideName(winner)} wins!`
                                        : winner === humanSide
                                        ? 'Victory!'
                                        : 'AI wins'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {history.length > 0 && (
                                    <button
                                        id="btn-gameover-undo"
                                        type="button"
                                        onClick={handleUndo}
                                        className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                                    >
                                        Undo last move
                                    </button>
                                )}
                                <button
                                    id="btn-play-again"
                                    type="button"
                                    onClick={() => startNewGame()}
                                    className="px-4 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
                                >
                                    Play again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <footer className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-medium text-stone-600 px-2">
                    <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-sm" aria-hidden="true" />
                        <span>
                            {gameMode === '2p'
                                ? 'Red (1st)'
                                : humanSide === 'p1'
                                ? 'Red (you)'
                                : 'Red (AI)'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-stone-900 shadow-sm" aria-hidden="true" />
                        <span>
                            {gameMode === '2p'
                                ? 'Black (2nd)'
                                : humanSide === 'p2'
                                ? 'Black (you)'
                                : 'Black (AI)'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-500">
                        <span
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 border border-amber-800/50 text-[9px] text-amber-950 font-bold"
                            aria-hidden="true"
                        >
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                <rect x="2.5" y="5.2" width="7" height="5.2" rx="1.2" fill="#78350f" />
                                <path
                                    d="M4 5.2V3.8a2 2 0 0 1 4 0v1.4"
                                    stroke="#78350f"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </span>
                        <span>Pinned disc (moved last turn)</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
