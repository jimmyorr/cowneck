function GameStartScreen({
    playerName, setPlayerName,
    selectedOpponents, setSelectedOpponents,
    hoveredOpponent, setHoveredOpponent,
    startGame,
    targetSimulations, setTargetSimulations,
    startSimulation
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

                    <button onClick={() => startGame(false)}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-green-950 font-black py-3 rounded-2xl text-lg shadow-lg shadow-yellow-500/20 transition transform active:scale-95"
                    >Play</button>
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

function sumArray(arr) {
    return arr.reduce((a, b) => a + b, 0);
}
