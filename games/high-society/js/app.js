const { useState, useEffect, useRef } = React;

function App() {
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
    const [isSimulating, setIsSimulating] = useState(false);
    const [simCompleted, setSimCompleted] = useState(0);
    const [simTotal, setSimTotal] = useState(0);
    const [showRules, setShowRules] = useState(false);
    const [pendingNextAuction, setPendingNextAuction] = useState(null);

    const auctionTimerRef = useRef(null);
    const simRafRef = useRef(null);

    useEffect(() => {
        try {
            const savedName = localStorage.getItem('highSociety_playerName');
            if (savedName !== null) setPlayerName(savedName);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        try {
            if (playerName) localStorage.setItem('highSociety_playerName', playerName);
            else localStorage.removeItem('highSociety_playerName');
        } catch { /* ignore */ }
    }, [playerName]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && gameState === 'playing' && !showRules && !isSimulating) {
                setIsPaused(p => !p);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, showRules, isSimulating]);

    useEffect(() => () => {
        if (auctionTimerRef.current) clearTimeout(auctionTimerRef.current);
        if (simRafRef.current) cancelAnimationFrame(simRafRef.current);
    }, []);

    const clearPendingTimers = () => {
        if (auctionTimerRef.current) {
            clearTimeout(auctionTimerRef.current);
            auctionTimerRef.current = null;
        }
        if (simRafRef.current) {
            cancelAnimationFrame(simRafRef.current);
            simRafRef.current = null;
        }
        setPendingNextAuction(null);
    };

    const addLog = (msg) => {
        setLogs((prev) => [msg, ...prev].slice(0, 50));
    };

    const startGame = (spectate = false) => {
        clearPendingTimers();
        setIsSimulating(false);
        setIsPaused(false);
        setSpectatorMode(spectate);
        const initialPlayers = createInitialPlayers({ spectatorMode: spectate, playerName, selectedOpponents, MONEY_CARDS });
        setPlayers(initialPlayers);
        const shuffledDeck = shuffle(INITIAL_DECK);
        setDeck(shuffledDeck);
        setDarkCardsDrawn(0);
        setLogs(['The game of High Society has begun!']);
        setGameState('playing');
        const startingTurn = Math.floor(Math.random() * initialPlayers.length);
        setTurn(startingTurn);
        drawNextCard(shuffledDeck, initialPlayers, 0, startingTurn);
    };

    const cancelSimulation = () => {
        clearPendingTimers();
        setIsSimulating(false);
        setGameState('start');
    };

    const startSimulation = (count) => {
        clearPendingTimers();
        const total = Math.min(5000, Math.max(1, count || targetSimulations));
        const stats = {};
        selectedOpponents.forEach(o => { stats[o] = 0; });
        setSimulationResults(stats);
        setSimCompleted(0);
        setSimTotal(total);
        setIsSimulating(true);
        setGameState('playing');

        let completed = 0;
        const batchSize = Math.max(5, Math.min(50, Math.ceil(total / 30)));

        const runBatch = () => {
            const limit = Math.min(total, completed + batchSize);
            while (completed < limit) {
                const { finalPlayers } = simulateSingleGame(selectedOpponents);
                const winner = finalPlayers.find(p => !p.isEliminated) || finalPlayers[0];
                if (winner) stats[winner.name] = (stats[winner.name] || 0) + 1;
                completed++;
            }
            setSimCompleted(completed);
            if (completed < total) {
                simRafRef.current = requestAnimationFrame(runBatch);
            } else {
                simRafRef.current = null;
                setSimulationResults({ ...stats });
                setIsSimulating(false);
                setGameState('simulationEnd');
            }
        };

        simRafRef.current = requestAnimationFrame(runBatch);
    };

    const drawNextCard = (currentDeck = deck, currentPlayers = players, darkCount = darkCardsDrawn, nextTurn = turn) => {
        setPendingNextAuction(null);
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
        const resolvedTurn = nextTurn >= 0 && nextTurn < updatedPlayers.length ? nextTurn : 0;
        setTurn(resolvedTurn);
        addLog(`New auction: ${card.name} (${card.type === 'disgrace' ? 'First to pass gets it!' : 'Highest bidder wins!'})`);
    };

    const endGame = (currentPlayers) => {
        const { finalPlayers, minMoney } = calculateFinalScores(currentPlayers, sumArray);
        finalPlayers.forEach(p => {
            if (p.isEliminated && sumArray(p.hand) === minMoney) {
                addLog(`💀 ${p.name} eliminated for having the least money (${minMoney}k)!`);
            }
        });
        setPlayers(finalPlayers);
        setGameState('end');
    };

    useEffect(() => {
        if (gameState !== 'playing' || isPaused || isSimulating || !pendingNextAuction) return;
        const delay = fastForward ? 100 : 1400;
        auctionTimerRef.current = setTimeout(() => {
            auctionTimerRef.current = null;
            drawNextCard(pendingNextAuction.deck, pendingNextAuction.players, pendingNextAuction.darkCount, pendingNextAuction.winnerTurn);
        }, delay);
        return () => {
            if (auctionTimerRef.current) {
                clearTimeout(auctionTimerRef.current);
                auctionTimerRef.current = null;
            }
        };
    }, [pendingNextAuction, gameState, isPaused, isSimulating, fastForward]);

    useEffect(() => {
        if (gameState !== 'playing' || isPaused || isSimulating || pendingNextAuction) return;
        const currentPlayer = players[turn];
        if (!currentPlayer || currentPlayer.passed || !revealedCard) return;

        if (currentPlayer.hand.length === 0) {
            const timer = setTimeout(() => executePass(turn), fastForward ? 50 : 900);
            return () => clearTimeout(timer);
        }

        if (currentPlayer.isAI) {
            const timer = setTimeout(() => {
                const ai = players[turn];
                const bestAdditionalCards = calculateAIBid({ ai, deckLength: deck.length, revealedCard, currentHighestBid, sumArray });
                if (bestAdditionalCards && bestAdditionalCards.length > 0) executeBid(turn, bestAdditionalCards);
                else executePass(turn);
            }, fastForward ? 60 : 1100);
            return () => clearTimeout(timer);
        }
    }, [turn, players, gameState, revealedCard, fastForward, isPaused, isSimulating, pendingNextAuction]);

    useEffect(() => {
        if (gameState !== 'end' || isSimulating || !window.confetti) return;
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
        return () => clearInterval(interval);
    }, [gameState, isSimulating]);

    const executeBid = (playerIdx, additionalCards) => {
        const p = players[playerIdx];
        const additionalAmount = sumArray(additionalCards);
        const newBidTotal = sumArray(p.bid) + additionalAmount;
        const newHand = [...p.hand];
        for (const card of additionalCards) {
            const idx = newHand.indexOf(card);
            if (idx > -1) newHand.splice(idx, 1);
        }
        const updatedPlayers = [...players];
        updatedPlayers[playerIdx] = { ...p, hand: newHand, bid: [...p.bid, ...additionalCards] };
        setPlayers(updatedPlayers);
        setCurrentHighestBid(newBidTotal);
        setHighestBidder(p.id);
        if (p.bid.length > 0) addLog(`${p.name} added ${additionalAmount}k to their bid (Total: ${newBidTotal}k).`);
        else addLog(`${p.name} bid ${newBidTotal}k.`);
        setHumanPendingBid([]);
        setTurn(getNextTurn(updatedPlayers, turn));
    };

    const executePass = (playerIdx) => {
        const p = players[playerIdx];
        if (!p) return;
        addLog(`${p.name} passed.`);
        const updatedPlayers = [...players];
        updatedPlayers[playerIdx] = { ...p, passed: true };
        setPlayers(updatedPlayers);
        setHumanPendingBid([]);

        const isNegativeAuction = revealedCard.type === 'disgrace';
        if (isNegativeAuction) {
            handleEndAuction(updatedPlayers, p.id);
        } else {
            const activePlayers = updatedPlayers.filter(pl => !pl.passed);
            if (activePlayers.length === 1) {
                handleEndAuction(updatedPlayers, activePlayers[0].id);
            } else if (activePlayers.length === 0) {
                addLog('Everyone passed. The card is discarded.');
                setPendingNextAuction({ deck, players: updatedPlayers, darkCount: darkCardsDrawn, winnerTurn: (turn + 1) % updatedPlayers.length });
            } else {
                setTurn(getNextTurn(updatedPlayers, turn));
            }
        }
    };

    const handleEndAuction = (currentPlayers, winnerId) => {
        const { updatedPlayers, logs: auctionLogs } = resolveAuction({ players: currentPlayers, winnerId, revealedCard, currentHighestBid });
        setPlayers(updatedPlayers);
        auctionLogs.forEach(addLog);
        const winnerTurn = updatedPlayers.findIndex(pl => pl.id === winnerId);
        setPendingNextAuction({
            deck,
            players: updatedPlayers,
            darkCount: darkCardsDrawn,
            winnerTurn: winnerTurn !== -1 ? winnerTurn : 0
        });
    };

    const toggleHumanPendingCard = (cardIndex) => {
        if (humanPendingBid.includes(cardIndex)) setHumanPendingBid(humanPendingBid.filter(i => i !== cardIndex));
        else setHumanPendingBid([...humanPendingBid, cardIndex]);
    };

    const handleHumanBid = () => {
        const humanIndex = players.findIndex(p => !p.isAI);
        if (humanIndex === -1) return;
        const p = players[humanIndex];
        const selectedCards = humanPendingBid.map(i => p.hand[i]).filter(v => v !== undefined);
        const proposedTotal = sumArray(p.bid) + sumArray(selectedCards);
        if (selectedCards.length === 0 || proposedTotal <= currentHighestBid) return;
        executeBid(humanIndex, selectedCards);
    };

    const quitToMenu = () => {
        clearPendingTimers();
        setIsPaused(false);
        setIsSimulating(false);
        setGameState('start');
    };

    return (
        <div className="flex flex-col h-screen text-white font-sans selection:bg-yellow-500 selection:text-green-950">
            {gameState === 'start' && (
                <GameStartScreen
                    playerName={playerName} setPlayerName={setPlayerName}
                    selectedOpponents={selectedOpponents} setSelectedOpponents={setSelectedOpponents}
                    hoveredOpponent={hoveredOpponent} setHoveredOpponent={setHoveredOpponent}
                    startGame={startGame} targetSimulations={targetSimulations} setTargetSimulations={setTargetSimulations} startSimulation={startSimulation}
                    setShowRules={setShowRules} />
            )}
            {gameState === 'playing' && (
                <GamePlayArea
                    isSimulating={isSimulating} simCompleted={simCompleted} simTotal={simTotal} cancelSimulation={cancelSimulation}
                    players={players} turn={turn} deck={deck} darkCardsDrawn={darkCardsDrawn} revealedCard={revealedCard}
                    currentHighestBid={currentHighestBid} highestBidder={highestBidder}
                    humanPendingBid={humanPendingBid} handleHumanBid={handleHumanBid} executePass={executePass} toggleHumanPendingCard={toggleHumanPendingCard} />
            )}
            {gameState === 'end' && <GameOverScreen players={players} setGameState={setGameState} />}
            {gameState === 'simulationEnd' && <GameSimulationEndScreen simTotal={simTotal} simulationResults={simulationResults} setGameState={setGameState} />}

            {gameState === 'playing' && !isSimulating && (
                <div className="fixed top-4 right-4 z-50 flex gap-2">
                    <button
                        onClick={() => setFastForward(f => !f)}
                        className={`font-bold px-3.5 py-2 rounded-full shadow-lg border backdrop-blur transition-all active:scale-95 text-xs ${fastForward ? 'bg-yellow-500 text-green-950 border-yellow-400' : 'bg-green-800/80 hover:bg-green-700 text-yellow-400 border-yellow-600/30'}`}
                    >
                        {fastForward ? '⏩ Fast' : '🐢 Normal'}
                    </button>
                    <button 
                        onClick={() => setShowRules(true)} 
                        className="bg-green-800/80 hover:bg-green-700 text-yellow-400 font-bold px-4 py-2 rounded-full shadow-lg border border-yellow-600/30 backdrop-blur transition-all active:scale-95 text-xs flex items-center justify-center gap-1"
                    >
                        Rules ℹ️
                    </button>
                    <button 
                        onClick={() => setIsPaused(true)} 
                        className="bg-green-800/80 hover:bg-green-700 text-yellow-400 p-2 rounded-full shadow-lg border border-yellow-600/30 backdrop-blur transition-all active:scale-95 text-xs"
                        aria-label="Pause game"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
            )}

            {gameState === 'playing' && !isSimulating && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button onClick={() => setShowLogs(!showLogs)} className="bg-green-800/80 hover:bg-green-700 text-yellow-400 p-3 rounded-full shadow-lg border border-yellow-600 transition-colors text-xs font-bold">
                        {showLogs ? '📜 Hide logs' : '📜 Show logs'}
                    </button>
                    {showLogs && (
                        <div className="absolute bottom-16 right-0 w-80 max-h-96 bg-black/90 border border-green-600 rounded-lg shadow-2xl overflow-y-auto p-4">
                            <h4 className="text-yellow-500 font-bold uppercase tracking-tighter text-xs mb-3 border-b border-green-900 pb-1">Auction history</h4>
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
                        <button onClick={() => setIsPaused(false)} className="w-full bg-yellow-500 hover:bg-yellow-400 text-green-950 font-bold py-4 rounded-full text-xl transition transform hover:scale-105 mb-4">Resume game</button>
                        <button onClick={quitToMenu} className="w-full bg-red-900/50 hover:bg-red-800 text-red-200 font-bold py-3 rounded-full transition">Quit to menu</button>
                    </div>
                </div>
            )}

            <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
