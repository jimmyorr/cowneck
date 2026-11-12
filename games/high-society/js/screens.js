function GameStartScreen({
    playerName, setPlayerName,
    selectedOpponents, setSelectedOpponents,
    hoveredOpponent, setHoveredOpponent,
    startGame,
    targetSimulations, setTargetSimulations,
    startSimulation,
    setShowRules
}) {
    const [showAdvanced, setShowAdvanced] = React.useState(false);

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-green-900 overflow-y-auto py-6">
            <div className="bg-emerald-800 p-6 md:p-8 rounded-3xl shadow-2xl border border-yellow-500 max-w-xl w-full mx-4 text-center">
                <h2 className="text-4xl font-serif text-yellow-400 mb-2">High Society</h2>
                <p className="text-gray-200 mb-6 text-sm">Outbid rivals for luxury, but don't be the poorest, or you'll be ruined!</p>

                {/* Path 1: JOIN/PLAY */}
                <div className="space-y-4 text-left mb-6">
                    <div>
                        <label className="block text-yellow-400 font-bold mb-1 ml-1 uppercase tracking-widest text-[10px]">Your name</label>
                        <input
                            type="text"
                            autoFocus
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full bg-green-950 border border-green-700 rounded-2xl p-3 text-white focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                            placeholder="Enter your name..."
                            maxLength="16"
                        />
                    </div>

                    <div>
                        <label className="block text-yellow-500 font-bold mb-2 ml-1 uppercase tracking-widest text-[10px]">Choose opponents ({selectedOpponents.length} selected):</label>
                        <div className="flex flex-wrap gap-2 justify-center mb-2 relative">
                            {AVAILABLE_OPPONENTS.map(opp => {
                                const isSelected = selectedOpponents.includes(opp);
                                return (
                                    <button key={opp}
                                        onMouseEnter={() => setHoveredOpponent(opp)}
                                        onMouseLeave={() => setHoveredOpponent(null)}
                                        onClick={() => {
                                            if (isSelected) {
                                                if (selectedOpponents.length > 2) setSelectedOpponents(selectedOpponents.filter(o => o !== opp));
                                            } else {
                                                if (selectedOpponents.length < 4) setSelectedOpponents([...selectedOpponents, opp]);
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-full border shadow-md transition transform hover:scale-105 text-[10px] font-bold ${isSelected ? 'bg-yellow-500 text-green-900 border-yellow-400' : 'bg-green-950 text-gray-400 border-green-700 hover:bg-green-800'}`}
                                    >{opp}</button>
                                );
                            })}
                        </div>
                        <div className="h-4 w-full text-center text-[10px] text-yellow-300 italic">
                            {hoveredOpponent && OPPONENT_DETAILS[hoveredOpponent].desc}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => startGame(false)}
                            className="w-full bg-yellow-500 hover:bg-yellow-400 text-green-950 font-black py-3 rounded-2xl text-base sm:text-lg shadow-lg shadow-yellow-500/20 transition transform active:scale-95"
                        >Play</button>
                        <button onClick={() => setShowRules(true)}
                            className="w-full bg-green-950 border border-green-700 text-yellow-500 font-bold py-3 rounded-2xl text-base sm:text-lg hover:bg-green-900 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >Rules guide 📖</button>
                    </div>
                </div>

                <div className="border-t border-green-700 my-6 pt-6">
                    {/* Path 2: SPECTATE */}
                    <div className="text-left mb-6">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Passive entry</h3>
                        <button
                            onClick={() => startGame(true)}
                            className="w-full bg-green-950 border border-green-700 text-yellow-500 py-3 rounded-2xl font-bold text-lg hover:bg-green-900 transition-all border-dashed"
                        >
                            Spectate
                        </button>
                    </div>

                    {/* Path 3: SIMULATE */}
                    <div className="text-left">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2 hover:text-gray-300 transition-colors"
                        >
                            Advanced mode {showAdvanced ? '▼' : '▶'}
                        </button>

                        {showAdvanced && (
                            <div className="bg-green-950/50 p-4 rounded-2xl border border-green-700 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-300">Simulate games:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5000"
                                        value={targetSimulations}
                                        onChange={(e) => setTargetSimulations(Math.min(5000, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                                        className="w-20 bg-green-900 border border-green-700 rounded-xl p-1.5 text-center text-white focus:outline-none focus:border-yellow-500 font-bold text-sm"
                                    />
                                </div>
                                <button onClick={() => startSimulation(targetSimulations)} className="w-full bg-blue-800 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow transition tracking-wide uppercase text-xs">
                                    Simulate
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function GameOverScreen({ players, setGameState }) {
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[200] backdrop-blur-md">
            <div className="bg-green-950 border-2 border-yellow-500 p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center animate-fade-in">
                <h2 className="text-4xl font-serif text-yellow-400 mb-6 italic">Auction's end</h2>
                <div className="space-y-3 mb-8">
                    {players.map((p, i) => {
                        const isWinner = i === 0 && !p.isEliminated;
                        return (
                            <div key={p.id} className={`flex flex-col gap-2 p-3 rounded-xl border text-left ${isWinner ? 'bg-yellow-500 text-green-950 border-yellow-400 shadow-lg' : p.isEliminated ? 'bg-rose-950/60 text-rose-200 border-rose-700/70' : 'bg-green-900 text-white border-green-700'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">
                                        {p.isEliminated ? '💀' : `${i + 1}.`} {p.name}
                                        {p.isEliminated && <span className="ml-2 text-xs uppercase tracking-wider font-extrabold text-rose-400">Ruined</span>}
                                    </span>
                                    <div className="text-right">
                                        <span className="font-black text-lg">{p.isEliminated ? 'Eliminated' : `${p.score} pts`}</span>
                                        <span className={`ml-2 text-xs font-bold ${isWinner ? 'text-green-900' : 'text-gray-300'}`}>(${sumArray(p.hand)}k left)</span>
                                    </div>
                                </div>
                                {p.won && p.won.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {p.won.map(c => <React.Fragment key={c.id}>{renderCard(c, 'tiny')}</React.Fragment>)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <button onClick={() => setGameState('start')} className="w-full bg-yellow-500 hover:bg-yellow-400 text-green-950 font-black py-4 rounded-2xl text-xl transition transform hover:scale-105">New game</button>
            </div>
        </div>
    );
}

function GameSimulationEndScreen({ simTotal, simulationResults, setGameState }) {
    const winners = Object.entries(simulationResults).sort((a, b) => b[1] - a[1]);
    const total = Math.max(1, simTotal);
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[200] backdrop-blur-md">
            <div className="bg-emerald-950 border-2 border-blue-500 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center animate-fade-in">
                <h2 className="text-3xl font-serif text-blue-400 mb-2">Simulation complete</h2>
                <p className="text-gray-400 mb-6 text-sm">{simTotal} games simulated</p>
                <div className="space-y-2 mb-8 text-left">
                    {winners.map(([name, wins]) => (
                        <div key={name} className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/10">
                            <span className="text-white font-medium">{name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-blue-400 font-black">{wins}</span>
                                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${(wins / total) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={() => setGameState('start')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl text-xl shadow-lg transition transform hover:scale-105">Back to menu</button>
            </div>
        </div>
    );
}

function formatRevealedValue(card) {
    if (card.type === 'luxury') return `${card.value} pts`;
    if (card.type === 'prestige') return '×2 score';
    if (card.value === 'discard') return 'Drop luxury';
    if (card.value === '-5') return '-5 pts';
    if (card.value === '/2') return '÷2 score';
    return String(card.value);
}

function GamePlayArea({
    isSimulating, simCompleted, simTotal, cancelSimulation,
    players, turn, deck, darkCardsDrawn, revealedCard,
    currentHighestBid, highestBidder,
    humanPendingBid, handleHumanBid, executePass, toggleHumanPendingCard
}) {
    const humanIndex = players.findIndex(p => !p.isAI);
    const human = humanIndex !== -1 ? players[humanIndex] : null;
    const isHumanTurn = humanIndex !== -1 && turn === humanIndex && !human.passed;
    const aiOpponents = players.filter(p => p.isAI);
    const highestBidderPlayer = highestBidder !== null ? players.find(p => p.id === highestBidder) : null;

    if (isSimulating) {
        const pct = simTotal > 0 ? Math.round((simCompleted / simTotal) * 100) : 0;
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-black">
                <div className="text-center space-y-4">
                    <div className="text-blue-500 text-6xl font-black animate-pulse">{pct}%</div>
                    <div className="text-gray-400 uppercase tracking-widest text-xs font-bold">Simulating {simCompleted} / {simTotal}</div>
                    <button onClick={cancelSimulation} className="mt-4 px-5 py-2 rounded-full bg-red-900/70 hover:bg-red-800 text-red-100 text-xs font-bold border border-red-700 transition">
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    const pendingCards = human ? humanPendingBid.map(i => human.hand[i]).filter(v => v !== undefined) : [];
    const pendingSum = sumArray(pendingCards);
    const humanTotalProposed = human ? sumArray(human.bid) + pendingSum : 0;

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-green-950">
            {/* Status strip */}
            <div className="flex items-center justify-center gap-4 px-4 py-2 bg-black/30 border-b border-green-900 text-xs text-gray-300">
                <span>Deck: <strong className="text-white">{deck.length}</strong></span>
                <span>•</span>
                <span>Dark cards: <strong className="text-yellow-400">{darkCardsDrawn}/4</strong></span>
                {currentHighestBid > 0 && (
                    <>
                        <span>•</span>
                        <span>High bid: <strong className="text-yellow-400">${currentHighestBid}k</strong>{highestBidderPlayer ? ` (${highestBidderPlayer.name})` : ''}</span>
                    </>
                )}
            </div>

            {/* Table Area */}
            <div className="flex-1 relative flex items-center justify-center p-4">
                {revealedCard && (
                    <div className="text-center animate-fade-in z-10">
                        <div className="mb-2 text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
                            {revealedCard.type === 'disgrace' ? 'Reverse auction — first to pass takes it' : `${revealedCard.type} auction`}
                        </div>
                        <div className={`w-36 h-52 md:w-44 md:h-64 mx-auto rounded-2xl border-4 flex flex-col items-center justify-center p-4 shadow-2xl ${revealedCard.isDark ? 'bg-emerald-950 border-yellow-500 text-yellow-400' : revealedCard.type === 'disgrace' ? 'bg-red-50 border-red-700 text-red-900' : 'bg-amber-50 border-emerald-800 text-emerald-950'}`}>
                            {revealedCard.isDark && (
                                <span className="text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 mb-2">Dark card</span>
                            )}
                            <div className="text-4xl mb-3">{revealedCard.type === 'luxury' ? '💎' : revealedCard.type === 'disgrace' ? '💩' : '🃏'}</div>
                            <div className="text-base font-serif font-black text-center leading-tight">{revealedCard.name}</div>
                            <div className="text-2xl md:text-3xl font-black mt-2">{formatRevealedValue(revealedCard)}</div>
                        </div>
                    </div>
                )}

                {/* Opponents Circle */}
                <div className="absolute inset-0 pointer-events-none">
                    {aiOpponents.map((p, i, arr) => {
                        const isActiveTurn = players[turn]?.id === p.id;
                        const angle = arr.length === 1 ? -Math.PI / 2 : (i / (arr.length - 1)) * Math.PI - Math.PI;
                        const x = Math.cos(angle) * 36;
                        const y = Math.sin(angle) * 32 - 4;
                        return (
                            <div key={p.id} className="absolute transition-all duration-500" style={{ left: `${50 + x}%`, top: `${50 + y}%`, transform: 'translate(-50%, -50%)' }}>
                                <div className={`p-3 rounded-2xl border-2 shadow-xl max-w-[180px] ${isActiveTurn ? 'bg-yellow-500 border-yellow-400 scale-105 shadow-yellow-500/20' : p.passed ? 'bg-green-950/80 border-green-900 opacity-55' : 'bg-green-900 border-green-700 opacity-90'}`}>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${isActiveTurn ? 'text-green-950' : 'text-yellow-400'}`}>{p.name}</span>
                                        {p.passed && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/40 text-gray-300">Passed</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs font-bold ${isActiveTurn ? 'text-green-950' : 'text-white'}`}>{p.hand.length} notes</span>
                                        <div className="flex -space-x-1">
                                            {p.bid.map((_, j) => <div key={j} className="w-3.5 h-5 bg-white border border-gray-300 rounded-sm" />)}
                                        </div>
                                    </div>
                                    {p.bid.length > 0 && <div className="mt-1 text-xs font-black text-white bg-black/50 px-2 py-0.5 rounded-full text-center">${sumArray(p.bid)}k bid</div>}
                                    {p.won.length > 0 && (
                                        <div className="flex flex-wrap gap-0.5 mt-1.5 justify-center">
                                            {p.won.map(c => <React.Fragment key={c.id}>{renderCard(c, 'tiny')}</React.Fragment>)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Human Controls */}
            {human && (
                <div className="bg-emerald-950 p-4 border-t-2 border-yellow-600/30">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6 items-center">
                        {/* Player Info */}
                        <div className="flex flex-col justify-center items-center md:items-start min-w-[140px]">
                            <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-0.5">Your capital</div>
                            <div className="text-2xl md:text-3xl font-black text-white">${sumArray(human.hand)}k</div>
                            {human.bid.length > 0 && (
                                <div className="mt-1 inline-flex items-center bg-yellow-500/20 px-2.5 py-0.5 rounded-full border border-yellow-500/30">
                                    <span className="text-xs font-bold text-yellow-400">Active bid: ${sumArray(human.bid)}k</span>
                                </div>
                            )}
                            {human.won.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {human.won.map(c => <React.Fragment key={c.id}>{renderCard(c, 'tiny')}</React.Fragment>)}
                                </div>
                            )}
                        </div>

                        {/* Hand Cards */}
                        <div className="flex-1 flex flex-wrap gap-2 justify-center">
                            {human.hand.map((card, i) => {
                                const isPending = humanPendingBid.includes(i);
                                return (
                                    <button
                                        key={`${card}-${i}`}
                                        disabled={!isHumanTurn}
                                        onClick={() => toggleHumanPendingCard(i)}
                                        className={`w-12 h-18 sm:w-14 sm:h-20 md:w-16 md:h-24 rounded-lg flex flex-col items-center justify-between p-2 transition-all border-2 ${isPending ? 'bg-yellow-500 border-yellow-400 text-green-950 -translate-y-3 shadow-lg shadow-yellow-500/20' : 'bg-white border-white text-green-950 hover:-translate-y-1.5'} ${!isHumanTurn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="text-xs font-black">{card}k</span>
                                        <span className="text-xs">💰</span>
                                        <span className="text-xs font-black rotate-180">{card}k</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-row md:flex-col gap-2 min-w-[140px] w-full md:w-auto">
                            <button
                                disabled={!isHumanTurn || pendingSum === 0 || humanTotalProposed <= currentHighestBid}
                                onClick={handleHumanBid}
                                className="flex-1 bg-yellow-500 disabled:opacity-30 hover:bg-yellow-400 text-green-950 font-black py-3 px-4 rounded-xl shadow-lg transition"
                            >
                                {pendingSum > 0 ? `Bid $${humanTotalProposed}k` : 'Bid...'}
                            </button>
                            <button
                                disabled={!isHumanTurn}
                                onClick={() => executePass(humanIndex)}
                                className="flex-1 bg-red-900 disabled:opacity-30 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-xl border border-red-700 transition"
                            >
                                Pass
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const RulesModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = React.useState('overview'); // overview, cards, ruin

    React.useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            onClick={onClose} 
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-fade-in"
        >
            <div 
                onClick={(e) => e.stopPropagation()} 
                className="bg-emerald-950 border-2 border-yellow-500 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-5 border-b border-green-800 flex justify-between items-center bg-green-900/60">
                    <h2 className="text-2xl font-serif text-yellow-400 flex items-center gap-2">
                        🥂 High Society rules & guide
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 hover:bg-green-900 rounded-full text-yellow-500/80 hover:text-yellow-400 transition-colors" 
                        aria-label="Close rules"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-green-800 bg-green-950/60 p-2 gap-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-yellow-500 text-green-950 shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-green-900/50'}`}
                    >
                        📋 Overview & bidding
                    </button>
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'cards' ? 'bg-yellow-500 text-green-950 shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-green-900/50'}`}
                    >
                        💎 Card categories
                    </button>
                    <button
                        onClick={() => setActiveTab('ruin')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'ruin' ? 'bg-yellow-500 text-green-950 shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-green-900/50'}`}
                    >
                        💀 The ruin rule
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-200">
                    {activeTab === 'overview' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <h3 className="text-lg font-serif text-yellow-400 mb-1">Objective</h3>
                                <p className="text-sm leading-relaxed text-gray-300">
                                    In High Society, you act as a Gilded Age millionaire. Your goal is to bid on luxury items and prestige cards to accumulate the highest score. However, you must carefully budget: at the end of the game, <strong className="text-yellow-400">the poorest player is immediately eliminated</strong> from the game, regardless of their score!
                                </p>
                            </div>
                            <div className="border-t border-green-800 pt-4">
                                <h3 className="text-lg font-serif text-yellow-400 mb-2">💵 Money & Bidding Rules</h3>
                                <ul className="text-sm space-y-2 list-disc pl-5 text-gray-300 leading-relaxed">
                                    <li>Every player starts with the exact same set of 11 banknotes: <strong className="text-white">1k, 2k, 3k, 4k, 5k, 8k, 10k, 12k, 15k, 20k, 25k</strong> ($100k total capital).</li>
                                    <li><strong className="text-yellow-400">No Change Can Be Made:</strong> When raising a bid, you must place additional banknotes from your hand. You cannot take back notes already on the table to make change!</li>
                                    <li><strong className="text-yellow-400">Payment:</strong> The winner of the auction discards all their bid banknotes forever. All other players take their bid notes back into their hand.</li>
                                </ul>
                            </div>
                            <div className="border-t border-green-800 pt-4">
                                <h3 className="text-lg font-serif text-yellow-400 mb-2">⏱️ Game End Trigger</h3>
                                <p className="text-sm leading-relaxed text-gray-300">
                                    The deck contains <strong className="text-white">4 dark cards</strong> (3 Prestige x2 cards, and 1 Scandale /2 card). The game <strong className="text-red-400 font-bold">ends immediately</strong> the moment the 4th dark card is drawn from the deck. This 4th card is not auctioned, and final scoring begins.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cards' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <h3 className="text-lg font-serif text-yellow-400 mb-2">💎 Positive Cards (Bid to Win)</h3>
                                <div className="space-y-3">
                                    <div className="bg-green-900/40 border border-green-800 p-4 rounded-2xl flex gap-4 items-start">
                                        <div className="w-14 h-20 bg-amber-50 rounded-lg border border-emerald-800 flex flex-col justify-center p-1 text-center flex-shrink-0 select-none">
                                            <span className="text-[10px] font-bold text-emerald-950 font-serif leading-none">Luxury</span>
                                            <span className="text-xl my-0.5">💎</span>
                                            <span className="text-sm font-black text-emerald-950 leading-none">1-10</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">Luxury Cards (Values 1 to 10)</h4>
                                            <p className="text-xs text-gray-300 leading-relaxed mt-1">
                                                These cards represent various high-society luxuries (Parfum, Cuisine, Joaillerie). Each luxury card adds its value directly to your score. The highest bidder wins and pays.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-green-900/40 border border-green-800 p-4 rounded-2xl flex gap-4 items-start">
                                        <div className="w-14 h-20 bg-emerald-950 rounded-lg border border-yellow-500 flex flex-col justify-center p-1 text-center flex-shrink-0 select-none">
                                            <span className="text-[9px] font-bold text-yellow-400 font-serif leading-none">Prestige</span>
                                            <span className="text-xl my-0.5">🃏</span>
                                            <span className="text-sm font-black text-yellow-400 leading-none">x2</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">Prestige Multipliers (x2) — <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Dark Card</span></h4>
                                            <p className="text-xs text-gray-300 leading-relaxed mt-1">
                                                These double your overall final score! Multiple Prestige cards multiply your score repeatedly (e.g. two x2 cards quadruple your final points). Highest bidder wins and pays.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-green-800 pt-4">
                                <h3 className="text-lg font-serif text-yellow-400 mb-2">💩 Disgrace Cards (Reverse Auction — Avoid!)</h3>
                                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                                    Reverse auctions work differently: <strong className="text-yellow-400">The FIRST player to Pass takes the card but pays nothing</strong>! All other players must discard their active bids from their hand.
                                </p>
                                <div className="space-y-3">
                                    <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-xl flex items-center gap-3">
                                        <span className="text-xl bg-red-950/50 p-2 rounded-lg border border-red-800">💩</span>
                                        <div>
                                            <h5 className="text-xs font-bold text-red-200">Faux Pas! (Drop / Discard)</h5>
                                            <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">Forces you to discard your lowest-value Luxury card. If you own no luxury cards, the next one you win is immediately discarded instead.</p>
                                        </div>
                                    </div>
                                    <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-xl flex items-center gap-3">
                                        <span className="text-xl bg-red-950/50 p-2 rounded-lg border border-red-800">📉</span>
                                        <div>
                                            <h5 className="text-xs font-bold text-red-200">Passé! (-5 Points)</h5>
                                            <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">Subtracts 5 points from your final score calculation.</p>
                                        </div>
                                    </div>
                                    <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-xl flex items-center gap-3">
                                        <span className="text-xl bg-red-950/50 p-2 rounded-lg border border-red-800">⚡</span>
                                        <div>
                                            <h5 className="text-xs font-bold text-red-200">Scandale! (/2 Division) — <span className="text-[10px] text-red-400 font-semibold uppercase tracking-tighter">Dark Card</span></h5>
                                            <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">Cuts your final score in half (rounded up) at the end of the game.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ruin' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <h3 className="text-lg font-serif text-yellow-400 mb-2">💀 The Ruin Rule</h3>
                                <p className="text-sm leading-relaxed text-gray-300">
                                    Having the most prestigious collection is useless if you spent all your money to get it.
                                </p>
                                <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-2xl mt-3 space-y-2">
                                    <h4 className="text-rose-400 font-bold text-base flex items-center gap-1.5">
                                        ⚠️ Instant Elimination!
                                    </h4>
                                    <p className="text-xs text-slate-200 leading-relaxed">
                                        At the end of the game, players count the banknotes remaining in their hands. <strong className="text-rose-300">The player (or players) with the least remaining money is immediately disqualified</strong>. They cannot win, regardless of how many luxury points they have!
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-green-800 pt-4">
                                <h3 className="text-lg font-serif text-yellow-400 mb-2">💯 Score Calculation</h3>
                                <p className="text-sm leading-relaxed text-gray-300">
                                    For all surviving (non-eliminated) players, score is calculated as follows:
                                </p>
                                <div className="bg-black/30 p-4 rounded-xl border border-green-800/60 font-serif space-y-2 mt-2">
                                    <div className="flex justify-between items-center text-xs border-b border-green-900 pb-1 text-gray-400">
                                        <span>Step</span>
                                        <span>Calculation Method</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">1. Base Points</span>
                                        <span className="text-white font-bold">Sum of Luxury Cards (1 to 10)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">2. Subtract Penances</span>
                                        <span className="text-red-400 font-bold">Minus 5 for each Passé! card</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">3. Apply Multipliers</span>
                                        <span className="text-yellow-400 font-bold">Double (x2) for each Prestige card</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">4. Apply Divisors</span>
                                        <span className="text-red-400 font-bold">Divide by 2 (rounded up) for each Scandale!</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                                    The surviving player with the highest final score wins! If there is a tie, the player with the most remaining money wins.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-green-800 bg-green-900/60 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-yellow-500 hover:bg-yellow-400 text-green-950 font-extrabold px-6 py-2.5 rounded-xl shadow-lg shadow-yellow-500/20 transition-all active:scale-95 text-sm"
                    >
                        Let's Auction!
                    </button>
                </div>
            </div>
        </div>
    );
};
