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
                        >Rules Guide 📖</button>
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
                                        value={targetSimulations}
                                        onChange={(e) => setTargetSimulations(Math.max(1, parseInt(e.target.value) || 1))}
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
function HUD({ players, round, trumpCard, playerBid, playerTricks }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700 text-center">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Round</span>
                <span className="text-2xl font-black text-white">{round}</span>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700 text-center">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Trump</span>
                <div className="flex items-center justify-center gap-2">
                    {trumpCard ? <span className={`text-xl font-bold ${trumpCard.suit === 'Hearts' || trumpCard.suit === 'Diamonds' ? 'text-red-400' : 'text-slate-300'}`}>{trumpCard.name}</span> : <span className="text-slate-500 italic">None</span>}
                </div>
            </div>
            <div className="bg-blue-600/20 p-4 rounded-2xl border border-blue-500/30 text-center">
                <span className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Your bid</span>
                <span className="text-2xl font-black text-white">{playerBid}</span>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 text-center">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tricks</span>
                <span className="text-2xl font-black text-white">{playerTricks}</span>
            </div>
        </div>
    );
}

function Card({ card, onClick, disabled, size = 'md' }) {
    const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds';
    const dimensions = size === 'sm' ? 'w-16 h-24' : 'w-24 h-36 md:w-28 md:h-40';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${dimensions} bg-white rounded-xl border-2 flex flex-col items-center justify-center relative transition-all shadow-lg ${disabled ? 'opacity-40 grayscale cursor-not-allowed border-slate-300' : 'hover:-translate-y-2 hover:shadow-2xl hover:border-blue-500 border-white active:scale-95'}`}
        >
            <div className={`absolute top-2 left-2 text-lg font-bold ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
                {card.value}
            </div>
            <div className={`text-4xl ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
                {card.suit === 'Hearts' ? '♥️' : card.suit === 'Diamonds' ? '♦️' : card.suit === 'Clubs' ? '♣️' : card.suit === 'Spades' ? '♠️' : ''}
            </div>
            <div className={`absolute bottom-2 right-2 text-lg font-bold rotate-180 ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
                {card.value}
            </div>
        </button>
    );
}

function ScoreBoard({ players, currentTurn }) {
    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <h3 className="bg-slate-800/80 p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scoreboard</h3>
            <div className="divide-y divide-slate-800">
                {players.map(p => (
                    <div key={p.id} className={`p-4 flex items-center justify-between ${currentTurn === p.id ? 'bg-blue-600/10' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${currentTurn === p.id ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`} />
                            <span className={`font-bold ${currentTurn === p.id ? 'text-blue-400' : 'text-slate-300'}`}>{p.name}</span>
                        </div>
                        <span className="text-xl font-black text-white">{p.score}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GameOverScreen({ players, startGame, setGameState }) {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[200] backdrop-blur-md">
            <div className="bg-green-950 border-2 border-yellow-500 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
                <h2 className="text-4xl font-serif text-yellow-400 mb-6 italic">Auction's End</h2>
                <div className="space-y-3 mb-8">
                    {sorted.map((p, i) => (
                        <div key={p.name} className={`flex justify-between p-3 rounded-xl border ${i === 0 ? 'bg-yellow-500 text-green-950 border-yellow-400 shadow-lg' : 'bg-green-900 text-white border-green-700'}`}>
                            <span className="font-bold">{i + 1}. {p.name}</span>
                            <span className="font-black">${sumArray(p.hand)}k</span>
                        </div>
                    ))}
                </div>
                <button onClick={() => setGameState('start')} className="w-full bg-yellow-500 hover:bg-yellow-400 text-green-950 font-black py-4 rounded-2xl text-xl transition transform hover:scale-105">New Game</button>
            </div>
        </div>
    );
}

function GameSimulationEndScreen({ simTargetRef, simulationResults, setGameState }) {
    const winners = Object.entries(simulationResults).sort((a, b) => b[1] - a[1]);
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[200] backdrop-blur-md">
            <div className="bg-emerald-950 border-2 border-blue-500 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
                <h2 className="text-3xl font-serif text-blue-400 mb-2">Simulation Complete</h2>
                <p className="text-gray-400 mb-6 text-sm">{simTargetRef.current} games simulated</p>
                <div className="space-y-2 mb-8 text-left">
                    {winners.map(([name, wins]) => (
                        <div key={name} className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/10">
                            <span className="text-white font-medium">{name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-blue-400 font-black">{wins}</span>
                                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${(wins / simTargetRef.current) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={() => setGameState('start')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl text-xl shadow-lg transition transform hover:scale-105">Back to Menu</button>
            </div>
        </div>
    );
}

function GamePlayArea({
    isSimulatingRef, simCountRef, simTargetRef,
    players, turn, deck, revealedCard,
    currentHighestBid, highestBidder,
    fastForward, setFastForward,
    humanPendingBid, handleHumanBid, executePass, toggleHumanPendingCard
}) {
    const human = players.find(p => !p.isAI);
    const isHumanTurn = turn === players.findIndex(p => !p.isAI);

    if (isSimulatingRef.current) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-black">
                <div className="text-center space-y-4">
                    <div className="text-blue-500 text-6xl font-black animate-pulse">{Math.round((simCountRef.current / simTargetRef.current) * 100)}%</div>
                    <div className="text-gray-500 uppercase tracking-widest text-xs font-bold">Simulating {simCountRef.current} / {simTargetRef.current}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-green-950">
            {/* Table Area */}
            <div className="flex-1 relative flex items-center justify-center p-4">
                {revealedCard && (
                    <div className="text-center animate-in zoom-in duration-300">
                        <div className="mb-2 text-[10px] font-bold text-yellow-500 uppercase tracking-widest">{revealedCard.type} card revealed</div>
                        <div className={`w-36 h-52 md:w-44 md:h-64 rounded-2xl border-4 flex flex-col items-center justify-center p-4 shadow-2xl ${revealedCard.isDark ? 'bg-slate-900 border-red-500 text-red-500' : 'bg-white border-yellow-500 text-green-950'}`}>
                            <div className="text-4xl mb-4">{revealedCard.type === 'luxury' ? '💎' : revealedCard.type === 'disgrace' ? '💩' : '🃏'}</div>
                            <div className="text-base font-serif font-black uppercase text-center">{revealedCard.name}</div>
                            <div className="text-4xl font-black mt-2">{revealedCard.value}k</div>
                        </div>
                    </div>
                )}

                {/* Opponents Circle */}
                <div className="absolute inset-0 pointer-events-none">
                    {players.filter(p => p.id !== 0).map((p, i, arr) => {
                        const angle = (i / arr.length) * Math.PI - Math.PI / 2;
                        const x = Math.cos(angle) * 35;
                        const y = Math.sin(angle) * 35 - 10;
                        return (
                            <div key={p.id} className="absolute transition-all duration-500" style={{ left: `${50 + x}%`, top: `${50 + y}%`, transform: 'translate(-50%, -50%)' }}>
                                <div className={`p-3 rounded-2xl border-2 shadow-xl ${turn === p.id ? 'bg-yellow-500 border-yellow-400 scale-110 shadow-yellow-500/20' : 'bg-green-900 border-green-700 opacity-80'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-tighter ${turn === p.id ? 'text-green-950' : 'text-yellow-500'}`}>{p.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-white">${sumArray(p.hand)}k</span>
                                        <div className="flex -space-x-1">
                                            {p.bid.map((c, j) => <div key={j} className="w-4 h-6 bg-white border border-gray-300 rounded-sm" />)}
                                        </div>
                                    </div>
                                    {p.bid.length > 0 && <div className="mt-1 text-xs font-black text-white bg-black/40 px-2 py-0.5 rounded-full">{sumArray(p.bid)}k bid</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Human Controls */}
            {human && (
                <div className="bg-emerald-950 p-4 border-t-2 border-yellow-600/30">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
                        {/* Player Info */}
                        <div className="flex flex-col justify-center">
                            <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-1">Your Capital</div>
                            <div className="text-3xl font-black text-white">${sumArray(human.hand)}k</div>
                            {human.bid.length > 0 && (
                                <div className="mt-2 inline-flex items-center bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
                                    <span className="text-xs font-bold text-yellow-400">Current Bid: {sumArray(human.bid)}k</span>
                                </div>
                            )}
                        </div>

                        {/* Hand Cards */}
                        <div className="flex-1 flex flex-wrap gap-2 justify-center">
                            {human.hand.map((card, i) => {
                                const isPending = humanPendingBid.includes(i);
                                return (
                                    <button
                                        key={i}
                                        disabled={!isHumanTurn}
                                        onClick={() => toggleHumanPendingCard(i)}
                                        className={`w-14 h-20 md:w-16 md:h-24 rounded-lg flex flex-col items-center justify-between p-2 transition-all border-2 ${isPending ? 'bg-yellow-500 border-yellow-400 -translate-y-4 shadow-lg shadow-yellow-500/20' : 'bg-white border-white text-green-950 hover:-translate-y-2'} ${!isHumanTurn ? 'opacity-50' : ''}`}
                                    >
                                        <span className="text-xs font-black">{card}</span>
                                        <span className="text-xs">💰</span>
                                        <span className="text-xs font-black rotate-180">{card}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 min-w-[140px]">
                            <button
                                disabled={!isHumanTurn || (sumArray(human.bid) + sumArray(humanPendingBid.map(i => human.hand[i])) <= currentHighestBid)}
                                onClick={handleHumanBid}
                                className="w-full bg-yellow-500 disabled:opacity-30 hover:bg-yellow-400 text-green-950 font-black py-3 rounded-xl shadow-lg transition"
                            >
                                Bid {sumArray(humanPendingBid.map(i => human.hand[i])) > 0 ? `${sumArray(human.bid) + sumArray(humanPendingBid.map(i => human.hand[i]))}k` : '...'}
                            </button>
                            <button
                                disabled={!isHumanTurn}
                                onClick={() => executePass(0)}
                                className="w-full bg-red-900 hover:bg-red-800 text-white font-bold py-2 rounded-xl border border-red-700 transition"
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
    if (!isOpen) return null;
    const [activeTab, setActiveTab] = React.useState('overview'); // overview, cards, ruin

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div 
            onClick={onClose} 
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
            <div 
                onClick={(e) => e.stopPropagation()} 
                className="bg-emerald-950 border-2 border-yellow-500 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="p-5 border-b border-green-800 flex justify-between items-center bg-green-900/60">
                    <h2 className="text-2xl font-serif text-yellow-400 flex items-center gap-2">
                        🥂 High Society Rules & Guide
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
                <div className="flex border-b border-green-850 bg-green-950/60 p-2 gap-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-yellow-500 text-green-950 shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-green-900/50'}`}
                    >
                        📋 Overview & Bidding
                    </button>
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'cards' ? 'bg-yellow-500 text-green-950 shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-green-900/50'}`}
                    >
                        💎 Card Categories
                    </button>
                    <button
                        onClick={() => setActiveTab('ruin')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'ruin' ? 'bg-yellow-500 text-green-950 shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-green-900/50'}`}
                    >
                        💀 The Ruin Rule
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-200">
                    {activeTab === 'overview' && (
                        <div className="space-y-4 animate-in fade-in duration-150">
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
                        <div className="space-y-4 animate-in fade-in duration-150">
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
                        <div className="space-y-4 animate-in fade-in duration-150">
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
