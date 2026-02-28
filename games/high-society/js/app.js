const { useState, useEffect, useRef } = React;

function App() {
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);
    const SIM_DELAY = isMobile ? 1 : 0;
    const [gameState, setGameState] = useState('start');
    const [players, setPlayers] = useState([]);
    const [deck, setDeck] = useState([]);
    const [revealedCard, setRevealedCard] = useState(null);
    const [darkCardsDrawn, setDarkCardsDrawn] = useState(0);
    const [turn, setTurn] = useState(0);
    const [currentHighestBid, setCurrentHighestBid] = useState(0);
    const [highestBidder, setHighestBidder] = useState(null);
    const [logs, setLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(false);
    const [humanPendingBid, setHumanPendingBid] = useState([]);
    const [fastForward, setFastForward] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [playerName, setPlayerName] = useState('You');
    const [spectatorMode, setSpectatorMode] = useState(false);
    const [selectedOpponents, setSelectedOpponents] = useState(['Oliver', 'Miles', 'Kirby 🐱']);
    const [hoveredOpponent, setHoveredOpponent] = useState(null);
    const [targetSimulations, setTargetSimulations] = useState(100);
    const [simulationResults, setSimulationResults] = useState({});

    const isSimulatingRef = useRef(false);
    const simCountRef = useRef(0);
    const simTargetRef = useRef(0);
    const simResultsRef = useRef({});

    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape' && gameState === 'playing') setIsPaused(p => !p); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    const addLog = (msg) => {
        if (isSimulatingRef.current) return;
        setLogs((prev) => [msg, ...prev].slice(0, 50));
    };

    const startGame = () => {
        const initialPlayers = createInitialPlayers({ spectatorMode, playerName, selectedOpponents, MONEY_CARDS });
        setPlayers(initialPlayers);
        const shuffledDeck = shuffle(INITIAL_DECK);
        setDeck(shuffledDeck);
        setDarkCardsDrawn(0);
        if (!isSimulatingRef.current) setLogs(['The game of High Society has begun!']);
        setGameState('playing');
        const startingTurn = Math.floor(Math.random() * initialPlayers.length);
        setTurn(startingTurn);
        drawNextCard(shuffledDeck, initialPlayers, 0, startingTurn);
    };

    const startSimulation = () => {
        if (!spectatorMode) return;
        isSimulatingRef.current = true;
        simCountRef.current = 1;
        simTargetRef.current = targetSimulations;
        const stats = {};
        selectedOpponents.forEach(o => stats[o] = 0);
        simResultsRef.current = stats;
        setSimulationResults(stats);
        startGame();
    };

    const drawNextCard = (currentDeck = deck, currentPlayers = players, darkCount = darkCardsDrawn, nextTurn = turn) => {
        if (currentDeck.length === 0) return endGame(currentPlayers);
        const newDeck = [...currentDeck];
        const card = newDeck.shift();
        setDeck(newDeck);
        setRevealedCard(card);

        let newDarkCount = darkCount;
        if (card.isDark) {
            newDarkCount++;
            setDarkCardsDrawn(newDarkCount);
            addLog(`Dark card drawn: ${card.name}. (${newDarkCount}/4)`);
        }

        if (newDarkCount >= 4) {
            addLog(`The 4th dark card (${card.name}) was drawn! The game ends immediately.`);
            setRevealedCard(null);
            endGame(currentPlayers);
            return;
        }

        const updatedPlayers = currentPlayers.map(p => ({ ...p, passed: false, bid: [] }));
        setPlayers(updatedPlayers);
        setCurrentHighestBid(0);
        setHighestBidder(null);
        setHumanPendingBid([]);
        setTurn(nextTurn);
        addLog(`New auction: ${card.name} (${card.type === 'disgrace' ? 'First to pass gets it!' : 'Highest bidder wins!'})`);
    };

    const endGame = (currentPlayers) => {
        const { finalPlayers, minMoney } = calculateFinalScores(currentPlayers, sumArray);
        finalPlayers.forEach(p => {
            if (p.isEliminated && sumArray(p.hand) === minMoney) addLog(`💀 ${p.name} eliminated for having the least money (${minMoney}k)!`);
        });

        if (isSimulatingRef.current) {
            const winner = finalPlayers[0];
            simResultsRef.current[winner.name] += 1;
            setSimulationResults({ ...simResultsRef.current });
            if (simCountRef.current < simTargetRef.current) {
                simCountRef.current += 1;
                setTimeout(() => startGame(), SIM_DELAY);
            } else {
                isSimulatingRef.current = false;
                setGameState('simulationEnd');
            }
        } else {
            setPlayers(finalPlayers);
            setGameState('end');
        }
    };

    useEffect(() => {
        if (gameState !== 'playing' || isPaused) return;
        const currentPlayer = players[turn];
        if (!currentPlayer || currentPlayer.passed) return;

        if (currentPlayer.hand.length === 0) {
            const timer = setTimeout(() => executePass(turn), isSimulatingRef.current ? SIM_DELAY : (fastForward ? 50 : 1000));
            return () => clearTimeout(timer);
        }

        if (currentPlayer.isAI) {
            const timer = setTimeout(() => {
                const ai = players[turn];
                const bestAdditionalCards = calculateAIBid({ ai, deckLength: deck.length, revealedCard, currentHighestBid, sumArray });
                if (bestAdditionalCards) executeBid(turn, bestAdditionalCards);
                else executePass(turn);
            }, isSimulatingRef.current ? SIM_DELAY : (fastForward ? 50 : 1200));
            return () => clearTimeout(timer);
        }
    }, [turn, gameState, revealedCard, fastForward, isPaused]);

    useEffect(() => {
        if (gameState === 'end' && !isSimulatingRef.current && window.confetti) {
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
            const interval = setInterval(() => {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                const particleCount = 50 * (timeLeft / duration);
                window.confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.5 + 0.25, y: Math.random() - 0.2 } });
                window.confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.5 + 0.5, y: Math.random() - 0.2 } });
            }, 250);
        }
    }, [gameState]);

    const executeBid = (playerId, additionalCards) => {
        const p = players[playerId];
        const additionalAmount = sumArray(additionalCards);
        const newBidTotal = sumArray(p.bid) + additionalAmount;
        let newHand = [...p.hand];
        for (const card of additionalCards) { const idx = newHand.indexOf(card); if (idx > -1) newHand.splice(idx, 1); }
        const updatedPlayers = [...players];
        updatedPlayers[playerId] = { ...p, hand: newHand, bid: [...p.bid, ...additionalCards] };
        setPlayers(updatedPlayers);
        setCurrentHighestBid(newBidTotal);
        setHighestBidder(playerId);
        if (p.bid.length > 0) addLog(`${p.name} added ${additionalAmount}k to their bid (Total: ${newBidTotal}k).`);
        else addLog(`${p.name} bid ${newBidTotal}k.`);
        setHumanPendingBid([]);
        setTurn(getNextTurn(updatedPlayers, turn));
    };

    const executePass = (playerId) => {
        const p = players[playerId];
        addLog(`${p.name} passed.`);
        const updatedPlayers = [...players];
        updatedPlayers[playerId].passed = true;
        setPlayers(updatedPlayers);
        setHumanPendingBid([]);

        const isNegativeAuction = revealedCard.type === 'disgrace';
        if (isNegativeAuction) {
            handleEndAuction(updatedPlayers, playerId);
        } else {
            const activePlayers = updatedPlayers.filter(p => !p.passed);
            if (activePlayers.length === 1) handleEndAuction(updatedPlayers, activePlayers[0].id);
            else if (activePlayers.length === 0) { addLog(`Everyone passed. The card is discarded.`); drawNextCard(deck, updatedPlayers, darkCardsDrawn, (turn + 1) % updatedPlayers.length); }
            else setTurn(getNextTurn(updatedPlayers, turn));
        }
    };

    const handleEndAuction = (currentPlayers, winnerId) => {
        const { updatedPlayers, logs: auctionLogs } = resolveAuction({ players: currentPlayers, winnerId, revealedCard, currentHighestBid });
        setPlayers(updatedPlayers);
        auctionLogs.forEach(addLog);
        setTimeout(() => drawNextCard(deck, updatedPlayers, darkCardsDrawn, winnerId), isSimulatingRef.current ? SIM_DELAY : (fastForward ? 100 : 1500));
    };

    const toggleHumanPendingCard = (cardIndex) => {
        if (humanPendingBid.includes(cardIndex)) setHumanPendingBid(humanPendingBid.filter(i => i !== cardIndex));
        else setHumanPendingBid([...humanPendingBid, cardIndex]);
    };

    const handleHumanBid = () => {
        const humanIndex = players.findIndex(p => !p.isAI);
        if (humanIndex === -1) return;
        const p = players[humanIndex];
        const selectedCards = humanPendingBid.map(i => p.hand[i]);
        const proposedTotal = sumArray(p.bid) + sumArray(selectedCards);
        if (proposedTotal <= currentHighestBid) return;
        executeBid(humanIndex, selectedCards);
    };

    return (
        <div className="flex flex-col h-screen text-white font-sans selection:bg-yellow-500 selection:text-green-950">
            {gameState === 'start' && (
                <GameStartScreen spectatorMode={spectatorMode} setSpectatorMode={setSpectatorMode}
                    playerName={playerName} setPlayerName={setPlayerName}
                    selectedOpponents={selectedOpponents} setSelectedOpponents={setSelectedOpponents}
                    hoveredOpponent={hoveredOpponent} setHoveredOpponent={setHoveredOpponent}
                    startGame={startGame} targetSimulations={targetSimulations} setTargetSimulations={setTargetSimulations} startSimulation={startSimulation} />
            )}
            {gameState === 'playing' && (
                <GamePlayArea isSimulatingRef={isSimulatingRef} simCountRef={simCountRef} simTargetRef={simTargetRef}
                    players={players} turn={turn} deck={deck} revealedCard={revealedCard}
                    currentHighestBid={currentHighestBid} highestBidder={highestBidder}
                    fastForward={fastForward} setFastForward={setFastForward}
                    humanPendingBid={humanPendingBid} handleHumanBid={handleHumanBid} executePass={executePass} toggleHumanPendingCard={toggleHumanPendingCard} />
            )}
            {gameState === 'end' && <GameOverScreen players={players} startGame={startGame} setGameState={setGameState} />}
            {gameState === 'simulationEnd' && <GameSimulationEndScreen simTargetRef={simTargetRef} simulationResults={simulationResults} setGameState={setGameState} />}

            {gameState === 'playing' && !isSimulatingRef.current && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button onClick={() => setShowLogs(!showLogs)} className="bg-green-800/80 hover:bg-green-700 text-yellow-400 p-3 rounded-full shadow-lg border border-yellow-600 transition-colors">
                        {showLogs ? '📜 Hide Logs' : '📜 Show Logs'}
                    </button>
                    {showLogs && (
                        <div className="absolute bottom-16 right-0 w-80 max-h-96 bg-black/90 border border-green-600 rounded-lg shadow-2xl overflow-y-auto p-4">
                            <h4 className="text-yellow-500 font-bold uppercase tracking-tighter text-xs mb-3 border-b border-green-900 pb-1">Auction History</h4>
                            <div className="space-y-2">
                                {logs.map((log, i) => <div key={i} className="text-sm text-gray-300 border-l-2 border-green-700 pl-2 leading-tight">{log}</div>)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isPaused && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="bg-emerald-900 border-2 border-yellow-500 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4">
                        <h2 className="text-4xl font-serif text-yellow-400 mb-6">Paused</h2>
                        <button onClick={() => setIsPaused(false)} className="w-full bg-yellow-500 hover:bg-yellow-400 text-green-950 font-bold py-4 rounded-full text-xl transition transform hover:scale-105 mb-4">Resume Game</button>
                        <button onClick={() => { setIsPaused(false); setGameState('start'); }} className="w-full bg-red-900/50 hover:bg-red-800 text-red-200 font-bold py-3 rounded-full transition">Quit to Menu</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
