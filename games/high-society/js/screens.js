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
        <div className="flex-1 flex flex-col items-center justify-start sm:justify-center bg-green-900 overflow-y-auto px-4 py-5 pb-safe">
            <div className="bg-emerald-800 p-5 sm:p-8 rounded-3xl shadow-2xl border border-yellow-500 max-w-xl w-full text-center my-auto">
                <h1 className="text-3xl sm:text-4xl font-serif text-yellow-400 mb-1.5">High Society</h1>
                <p className="text-gray-200 mb-5 text-xs sm:text-sm">Outbid rivals for luxury, but don't end up the poorest, or you'll be ruined!</p>

                {/* Path 1: JOIN/PLAY */}
                <div className="space-y-4 text-left mb-5">
                    <div>
                        <label htmlFor="hs-player-name" className="block text-yellow-400 font-bold mb-1 ml-1 uppercase tracking-widest text-[10px]">Your name</label>
                        <input
                            id="hs-player-name"
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full bg-green-950 border border-green-700 rounded-2xl p-3 text-white focus:outline-none focus:border-yellow-500 transition-colors text-base"
                            placeholder="Enter your name..."
                            maxLength="16"
                        />
                    </div>

                    <div>
                        <label className="block text-yellow-500 font-bold mb-2 ml-1 uppercase tracking-widest text-[10px]">Choose 2–4 opponents ({selectedOpponents.length} selected):</label>
                        <div className="flex flex-wrap gap-2 justify-center mb-2 relative">
                            {AVAILABLE_OPPONENTS.map(opp => {
                                const isSelected = selectedOpponents.includes(opp);
                                return (
                                    <button key={opp}
                                        type="button"
                                        onMouseEnter={() => setHoveredOpponent(opp)}
                                        onMouseLeave={() => setHoveredOpponent(null)}
                                        onClick={() => {
                                            setHoveredOpponent(opp);
                                            if (isSelected) {
                                                if (selectedOpponents.length > 2) setSelectedOpponents(selectedOpponents.filter(o => o !== opp));
                                            } else {
                                                if (selectedOpponents.length < 4) setSelectedOpponents([...selectedOpponents, opp]);
                                            }
                                        }}
                                        className={`px-3.5 py-2 rounded-full border shadow-md transition active:scale-95 text-xs font-bold min-h-[38px] ${isSelected ? 'bg-yellow-500 text-green-950 border-yellow-400' : 'bg-green-950 text-gray-300 border-green-700 hover:bg-green-800'}`}
                                    >{opp}</button>
                                );
                            })}
                        </div>
                        <div className="min-h-[2rem] flex items-center justify-center w-full text-center text-[11px] text-yellow-300 italic px-2">
                            {hoveredOpponent ? OPPONENT_DETAILS[hoveredOpponent].desc : 'Tap an opponent to preview their bidding style.'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <button onClick={() => startGame(false)}
                            className="w-full bg-yellow-500 hover:bg-yellow-400 text-green-950 font-black py-3 px-3 rounded-2xl text-base sm:text-lg shadow-lg shadow-yellow-500/20 transition active:scale-95 min-h-[48px]"
                        >Play</button>
                        <button onClick={() => setShowRules(true)}
                            className="w-full bg-green-950 border border-green-700 text-yellow-500 font-bold py-3 px-3 rounded-2xl text-sm sm:text-lg hover:bg-green-900 transition-all active:scale-95 flex items-center justify-center gap-1.5 min-h-[48px]"
                        >Rules 📖</button>
                    </div>
                </div>

                <div className="border-t border-green-700 my-5 pt-5">
                    {/* Path 2: SPECTATE */}
                    <div className="text-left mb-5">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Passive entry</h3>
                        <button
                            onClick={() => startGame(true)}
                            className="w-full bg-green-950 border border-green-700 text-yellow-500 py-3 rounded-2xl font-bold text-base sm:text-lg hover:bg-green-900 transition-all border-dashed active:scale-95 min-h-[48px]"
                        >
                            Spectate
                        </button>
                    </div>

                    {/* Path 3: SIMULATE */}
                    <div className="text-left">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1 py-1 flex items-center gap-2 hover:text-gray-200 transition-colors"
                        >
                            Advanced mode {showAdvanced ? '▼' : '▶'}
                        </button>

                        {showAdvanced && (
                            <div className="bg-green-950/50 p-4 rounded-2xl border border-green-700 space-y-3 mt-1">
                                <div className="flex items-center justify-between gap-3">
                                    <label htmlFor="hs-sim-count" className="text-xs font-bold text-gray-300">Simulate games:</label>
                                    <input
                                        id="hs-sim-count"
                                        type="number"
                                        min="1"
                                        max="5000"
                                        value={targetSimulations}
                                        onChange={(e) => setTargetSimulations(Math.min(5000, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                                        className="w-24 bg-green-900 border border-green-700 rounded-xl p-2 text-center text-white focus:outline-none focus:border-yellow-500 font-bold text-base"
                                    />
                                </div>
                                <button onClick={() => startSimulation(targetSimulations)} className="w-full bg-blue-800 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow transition tracking-wide uppercase text-xs min-h-[44px]">
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
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 sm:p-6 z-[200] backdrop-blur-md">
            <div className="bg-green-950 border-2 border-yellow-500 p-5 sm:p-8 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto text-center animate-fade-in">
                <h2 className="text-3xl sm:text-4xl font-serif text-yellow-400 mb-5 italic">Auction's end</h2>
                <div className="space-y-2.5 sm:space-y-3 mb-6">
                    {players.map((p, i) => {
                        const isWinner = i === 0 && !p.isEliminated;
                        return (
                            <div key={p.id} className={`flex flex-col gap-2 p-3 rounded-xl border text-left ${isWinner ? 'bg-yellow-500 text-green-950 border-yellow-400 shadow-lg' : p.isEliminated ? 'bg-rose-950/60 text-rose-200 border-rose-700/70' : 'bg-green-900 text-white border-green-700'}`}>
                                <div className="flex justify-between items-center gap-2">
                                    <span className="font-bold text-sm sm:text-base truncate">
                                        {p.isEliminated ? '💀' : `${i + 1}.`} {p.name}
                                        {p.isEliminated && <span className="ml-1.5 text-[10px] uppercase tracking-wider font-extrabold text-rose-400">Ruined</span>}
                                    </span>
                                    <div className="text-right shrink-0">
                                        <span className="font-black text-base sm:text-lg">{p.isEliminated ? 'Eliminated' : `${p.score} pts`}</span>
                                        <span className={`ml-1.5 text-[11px] sm:text-xs font-bold ${isWinner ? 'text-green-900' : 'text-gray-300'}`}>(${sumArray(p.hand)}k)</span>
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
                <button onClick={() => setGameState('start')} className="w-full bg-yellow-500 hover:bg-yellow-400 text-green-950 font-black py-3.5 sm:py-4 rounded-2xl text-lg sm:text-xl transition active:scale-95">New game</button>
            </div>
        </div>
    );
}

function GameSimulationEndScreen({ simTotal, simulationResults, setGameState }) {
    const winners = Object.entries(simulationResults).sort((a, b) => b[1] - a[1]);
    const total = Math.max(1, simTotal);
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 sm:p-6 z-[200] backdrop-blur-md">
            <div className="bg-emerald-950 border-2 border-blue-500 p-5 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto text-center animate-fade-in">
                <h2 className="text-2xl sm:text-3xl font-serif text-blue-400 mb-1.5">Simulation complete</h2>
                <p className="text-gray-400 mb-5 text-xs sm:text-sm">{simTotal} games simulated</p>
                <div className="space-y-2 mb-6 text-left">
                    {winners.map(([name, wins]) => (
                        <div key={name} className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/10 gap-2">
                            <span className="text-white font-medium text-sm truncate">{name}</span>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-blue-400 font-black text-sm">{wins}</span>
                                <div className="w-20 sm:w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${(wins / total) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={() => setGameState('start')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 sm:py-4 rounded-2xl text-lg sm:text-xl shadow-lg transition active:scale-95">Back to menu</button>
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

function OpponentCard({ player, isActiveTurn }) {
    return (
        <div className={`p-2 sm:p-3 rounded-2xl border-2 shadow-lg transition-all ${isActiveTurn ? 'bg-yellow-500 border-yellow-300 shadow-yellow-500/20' : player.passed ? 'bg-green-950/80 border-green-900 opacity-60' : 'bg-green-900/95 border-green-700'}`}>
            <div className="flex items-center justify-between gap-1.5">
                <span className={`text-[11px] font-black truncate ${isActiveTurn ? 'text-green-950' : 'text-yellow-400'}`}>{player.name}</span>
                {player.passed ? (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/40 text-gray-300 shrink-0">Passed</span>
                ) : isActiveTurn ? (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-green-950/20 text-green-950 shrink-0">Turn</span>
                ) : null}
            </div>
            <div className="flex items-center justify-between gap-1.5 mt-1">
                <span className={`text-[11px] font-bold ${isActiveTurn ? 'text-green-950' : 'text-gray-200'}`}>{player.hand.length} notes</span>
                {player.bid.length > 0 ? (
                    <span className="text-[10px] font-black text-white bg-black/55 px-2 py-0.5 rounded-full shrink-0">${sumArray(player.bid)}k</span>
                ) : (
                    <span className={`text-[10px] ${isActiveTurn ? 'text-green-900' : 'text-gray-400'}`}>$0k</span>
                )}
            </div>
            {player.won.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1.5">
                    {player.won.map(c => <React.Fragment key={c.id}>{renderCard(c, 'tiny')}</React.Fragment>)}
                </div>
            )}
        </div>
    );
}

function GamePlayArea({
    isSimulating, simCompleted, simTotal, cancelSimulation,
    players, turn, deck, darkCardsDrawn, revealedCard,
    currentHighestBid, highestBidder,
    humanPendingBid, handleHumanBid, executePass, toggleHumanPendingCard,
    fastForward, setFastForward,
    showLogs, setShowLogs,
    setShowRules, setIsPaused
}) {
    const humanIndex = players.findIndex(p => !p.isAI);
    const human = humanIndex !== -1 ? players[humanIndex] : null;
    const isHumanTurn = humanIndex !== -1 && turn === humanIndex && !human.passed;
    const aiOpponents = players.filter(p => p.isAI);
    const highestBidderPlayer = highestBidder !== null ? players.find(p => p.id === highestBidder) : null;
    const activeTurnPlayer = players[turn];

    if (isSimulating) {
        const pct = simTotal > 0 ? Math.round((simCompleted / simTotal) * 100) : 0;
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-black px-4">
                <div className="text-center space-y-4">
                    <div className="text-blue-500 text-5xl sm:text-6xl font-black animate-pulse">{pct}%</div>
                    <div className="text-gray-400 uppercase tracking-widest text-xs font-bold">Simulating {simCompleted} / {simTotal}</div>
                    <button onClick={cancelSimulation} className="mt-4 px-6 py-2.5 rounded-full bg-red-900/70 hover:bg-red-800 text-red-100 text-xs font-bold border border-red-700 transition min-h-[40px]">
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
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-green-950">
            {/* Unified non-overlapping Header Bar */}
            <header className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-black/40 border-b border-green-900 shrink-0 pt-safe">
                <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-gray-300 min-w-0">
                    <span>Deck: <strong className="text-white">{deck.length}</strong></span>
                    <span className="text-green-700">•</span>
                    <span>Dark: <strong className="text-yellow-400">{darkCardsDrawn}/4</strong></span>
                    {currentHighestBid > 0 && (
                        <>
                            <span className="text-green-700">•</span>
                            <span className="truncate">
                                High: <strong className="text-yellow-400">${currentHighestBid}k</strong>
                                {highestBidderPlayer ? <span className="hidden sm:inline"> ({highestBidderPlayer.name})</span> : ''}
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => setFastForward(f => !f)}
                        title={fastForward ? 'Fast speed enabled' : 'Normal speed'}
                        className={`font-bold px-2.5 py-1.5 rounded-full border text-[11px] sm:text-xs transition active:scale-95 min-h-[34px] ${fastForward ? 'bg-yellow-500 text-green-950 border-yellow-400' : 'bg-green-900/80 hover:bg-green-800 text-yellow-400 border-green-700'}`}
                    >
                        {fastForward ? '⏩' : '🐢'} <span className="hidden sm:inline">{fastForward ? 'Fast' : 'Normal'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowLogs(v => !v)}
                        title="Auction history"
                        aria-label="Toggle auction history"
                        className={`font-bold px-2.5 py-1.5 rounded-full border text-[11px] sm:text-xs transition active:scale-95 min-h-[34px] ${showLogs ? 'bg-yellow-500 text-green-950 border-yellow-400' : 'bg-green-900/80 hover:bg-green-800 text-yellow-400 border-green-700'}`}
                    >
                        📜 <span className="hidden sm:inline">Logs</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowRules(true)}
                        title="Rules guide"
                        aria-label="Open rules guide"
                        className="bg-green-900/80 hover:bg-green-800 text-yellow-400 font-bold px-2.5 py-1.5 rounded-full border border-green-700 transition active:scale-95 text-[11px] sm:text-xs min-h-[34px]"
                    >
                        📖 <span className="hidden sm:inline">Rules</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsPaused(true)}
                        aria-label="Pause game"
                        className="bg-green-900/80 hover:bg-green-800 text-yellow-400 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border border-green-700 transition active:scale-95 min-h-[34px] min-w-[34px] flex items-center justify-center"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Table Area: Scrollable vertical stack on phones, radial semicircle on md+ */}
            <div className="flex-1 min-h-0 relative flex flex-col md:items-center md:justify-center overflow-y-auto px-3 py-2.5 md:p-4 gap-3">
                {/* Mobile Opponent Grid (< md) */}
                <div className="grid grid-cols-2 gap-2 w-full md:hidden shrink-0">
                    {aiOpponents.map((p) => (
                        <OpponentCard key={p.id} player={p} isActiveTurn={activeTurnPlayer?.id === p.id} />
                    ))}
                </div>

                {/* Centered Revealed Card */}
                {revealedCard && (
                    <div className="my-auto text-center animate-fade-in z-10 py-1">
                        <div className="mb-1.5 text-[10px] font-bold text-yellow-400 uppercase tracking-widest">
                            {revealedCard.type === 'disgrace' ? 'Reverse auction — first to pass takes it' : `${revealedCard.type} auction`}
                        </div>
                        <div className={`w-32 h-44 sm:w-36 sm:h-52 md:w-44 md:h-64 mx-auto rounded-2xl border-4 flex flex-col items-center justify-center p-3 sm:p-4 shadow-2xl ${revealedCard.isDark ? 'bg-emerald-950 border-yellow-500 text-yellow-400' : revealedCard.type === 'disgrace' ? 'bg-red-50 border-red-700 text-red-900' : 'bg-amber-50 border-emerald-800 text-emerald-950'}`}>
                            {revealedCard.isDark && (
                                <span className="text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 mb-1.5">Dark card</span>
                            )}
                            <div className="text-3xl sm:text-4xl mb-2">{revealedCard.type === 'luxury' ? '💎' : revealedCard.type === 'disgrace' ? '💩' : '🃏'}</div>
                            <div className="text-sm sm:text-base font-serif font-black text-center leading-tight">{revealedCard.name}</div>
                            <div className="text-xl sm:text-2xl md:text-3xl font-black mt-1.5">{formatRevealedValue(revealedCard)}</div>
                        </div>
                        <div className="mt-2 text-[11px] font-bold text-gray-300">
                            {isHumanTurn ? (
                                <span className="text-yellow-400">Your turn — {currentHighestBid > 0 ? `bid over $${currentHighestBid}k` : 'open bidding'} or pass</span>
                            ) : activeTurnPlayer ? (
                                <span>{activeTurnPlayer.name}'s turn...</span>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Desktop Opponents Semicircle (md+) */}
                <div className="hidden md:block absolute inset-0 pointer-events-none">
                    {aiOpponents.map((p, i, arr) => {
                        const isActiveTurn = activeTurnPlayer?.id === p.id;
                        const angle = arr.length === 1 ? -Math.PI / 2 : (i / (arr.length - 1)) * Math.PI - Math.PI;
                        const x = Math.cos(angle) * 36;
                        const y = Math.sin(angle) * 32 - 4;
                        return (
                            <div key={p.id} className="absolute transition-all duration-500 w-44" style={{ left: `${50 + x}%`, top: `${50 + y}%`, transform: 'translate(-50%, -50%)' }}>
                                <OpponentCard player={p} isActiveTurn={isActiveTurn} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Human Controls Dock */}
            {human && (
                <div className="bg-emerald-950 px-3 pt-2.5 pb-safe sm:p-4 border-t-2 border-yellow-600/30 shrink-0">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-2.5 sm:gap-4 md:gap-6 items-stretch md:items-center">
                        {/* Player Info */}
                        <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start gap-2 md:min-w-[140px]">
                            <div className="flex items-baseline gap-2 md:block">
                                <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Capital</div>
                                <div className="text-lg sm:text-2xl md:text-3xl font-black text-white">${sumArray(human.hand)}k</div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap justify-end md:justify-start">
                                {human.bid.length > 0 && (
                                    <div className="inline-flex items-center bg-yellow-500/20 px-2.5 py-0.5 rounded-full border border-yellow-500/30">
                                        <span className="text-[11px] sm:text-xs font-bold text-yellow-400">In bid: ${sumArray(human.bid)}k</span>
                                    </div>
                                )}
                                {human.won.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {human.won.map(c => <React.Fragment key={c.id}>{renderCard(c, 'tiny')}</React.Fragment>)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hand Cards: 6-col grid on phones (fits 11 notes in 2 neat rows), flex wrap on sm+ */}
                        <div className="flex-1 grid grid-cols-6 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 sm:justify-center">
                            {human.hand.map((card, i) => {
                                const isPending = humanPendingBid.includes(i);
                                return (
                                    <button
                                        key={`${card}-${i}`}
                                        type="button"
                                        disabled={!isHumanTurn}
                                        onClick={() => toggleHumanPendingCard(i)}
                                        className={`h-12 sm:w-14 sm:h-20 md:w-16 md:h-24 rounded-lg flex flex-col items-center justify-between py-1 px-1 sm:p-2 transition-all border-2 select-none ${isPending ? 'bg-yellow-500 border-yellow-300 text-green-950 -translate-y-1 sm:-translate-y-2.5 ring-2 ring-yellow-300/60 shadow-lg shadow-yellow-500/20' : 'bg-white border-white text-green-950 sm:hover:-translate-y-1.5'} ${!isHumanTurn ? 'opacity-75 cursor-default' : 'active:scale-95'}`}
                                    >
                                        <span className="text-[11px] sm:text-xs font-black leading-none">{card}k</span>
                                        <span className="text-[10px] sm:text-xs leading-none">💰</span>
                                        <span className="hidden sm:block text-xs font-black rotate-180 leading-none">{card}k</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 md:flex md:flex-col gap-2 md:min-w-[148px] w-full md:w-auto">
                            <button
                                type="button"
                                disabled={!isHumanTurn}
                                onClick={() => executePass(humanIndex)}
                                className="order-1 md:order-2 bg-red-900 disabled:opacity-30 hover:bg-red-800 text-white font-bold py-2.5 px-4 rounded-xl border border-red-700 transition active:scale-95 min-h-[44px] text-sm sm:text-base"
                            >
                                Pass
                            </button>
                            <button
                                type="button"
                                disabled={!isHumanTurn || pendingSum === 0 || humanTotalProposed <= currentHighestBid}
                                onClick={handleHumanBid}
                                className="order-2 md:order-1 bg-yellow-500 disabled:opacity-30 hover:bg-yellow-400 text-green-950 font-black py-2.5 sm:py-3 px-4 rounded-xl shadow-lg transition active:scale-95 min-h-[44px] text-sm sm:text-base"
                            >
                                {pendingSum > 0 ? `Bid $${humanTotalProposed}k` : 'Bid...'}
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
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[300] flex items-center justify-center p-3 sm:p-4 animate-fade-in"
        >
            <div 
                onClick={(e) => e.stopPropagation()} 
                className="bg-emerald-950 border-2 border-yellow-500 rounded-3xl max-w-2xl w-full max-h-[88dvh] flex flex-col shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-green-800 flex justify-between items-center gap-2 bg-green-900/60">
                    <h2 className="text-lg sm:text-2xl font-serif text-yellow-400 flex items-center gap-2">
                        🥂 High Society rules
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-green-900 rounded-full text-yellow-500/80 hover:text-yellow-400 transition-colors shrink-0" 
                        aria-label="Close rules"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-green-800 bg-green-950/60 p-1.5 sm:p-2 gap-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-sm font-bold transition-all leading-tight ${activeTab === 'overview' ? 'bg-yellow-500 text-green-950 shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-green-900/50'}`}
                    >
                        📋 Overview & bidding
                    </button>
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`flex-1 py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-sm font-bold transition-all leading-tight ${activeTab === 'cards' ? 'bg-yellow-500 text-green-950 shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-green-900/50'}`}
                    >
                        💎 Card categories
                    </button>
                    <button
                        onClick={() => setActiveTab('ruin')}
                        className={`flex-1 py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-sm font-bold transition-all leading-tight ${activeTab === 'ruin' ? 'bg-yellow-500 text-green-950 shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-green-900/50'}`}
                    >
                        💀 The ruin rule
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 text-gray-200">
                    {activeTab === 'overview' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <h3 className="text-lg font-serif text-yellow-400 mb-1">Objective</h3>
                                <p className="text-sm leading-relaxed text-gray-300">
                                    In High Society, you act as a Gilded Age millionaire. Your goal is to bid on luxury items and prestige cards to accumulate the highest score. However, you must carefully budget: at the end of the game, <strong className="text-yellow-400">the poorest player is immediately eliminated</strong> from the game, regardless of their score!
                                </p>
                            </div>
                            <div className="border-t border-green-800 pt-4">
                                <h3 className="text-lg font-serif text-yellow-400 mb-2">💵 Money & bidding rules</h3>
                                <ul className="text-sm space-y-2 list-disc pl-5 text-gray-300 leading-relaxed">
                                    <li>Every player starts with the exact same set of 11 banknotes: <strong className="text-white">1k, 2k, 3k, 4k, 5k, 8k, 10k, 12k, 15k, 20k, 25k</strong> ($105k total capital).</li>
                                    <li><strong className="text-yellow-400">No change can be made:</strong> When raising a bid, you must place additional banknotes from your hand. You cannot take back notes already on the table to make change!</li>
                                    <li><strong className="text-yellow-400">Payment:</strong> The winner of the auction discards all their bid banknotes forever. All other players take their bid notes back into their hand.</li>
                                </ul>
                            </div>
                            <div className="border-t border-green-800 pt-4">
                                <h3 className="text-lg font-serif text-yellow-400 mb-2">⏱️ Game end trigger</h3>
                                <p className="text-sm leading-relaxed text-gray-300">
                                    The deck contains <strong className="text-white">4 dark cards</strong> (3 Prestige x2 cards, and 1 Scandale /2 card). The game <strong className="text-red-400 font-bold">ends immediately</strong> the moment the 4th dark card is drawn from the deck. This 4th card is not auctioned, and final scoring begins.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cards' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <h3 className="text-lg font-serif text-yellow-400 mb-2">💎 Positive cards (bid to win)</h3>
                                <div className="space-y-3">
                                    <div className="bg-green-900/40 border border-green-800 p-3.5 sm:p-4 rounded-2xl flex gap-3 sm:gap-4 items-start">
                                        <div className="w-14 h-20 bg-amber-50 rounded-lg border border-emerald-800 flex flex-col justify-center p-1 text-center flex-shrink-0 select-none">
                                            <span className="text-[10px] font-bold text-emerald-950 font-serif leading-none">Luxury</span>
                                            <span className="text-xl my-0.5">💎</span>
                                            <span className="text-sm font-black text-emerald-950 leading-none">1-10</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">Luxury cards (values 1 to 10)</h4>
                                            <p className="text-xs text-gray-300 leading-relaxed mt-1">
                                                These cards represent various high-society luxuries (Parfum, Cuisine, Joaillerie). Each luxury card adds its value directly to your score. The highest bidder wins and pays.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-green-900/40 border border-green-800 p-3.5 sm:p-4 rounded-2xl flex gap-3 sm:gap-4 items-start">
                                        <div className="w-14 h-20 bg-emerald-950 rounded-lg border border-yellow-500 flex flex-col justify-center p-1 text-center flex-shrink-0 select-none">
                                            <span className="text-[9px] font-bold text-yellow-400 font-serif leading-none">Prestige</span>
                                            <span className="text-xl my-0.5">🃏</span>
                                            <span className="text-sm font-black text-yellow-400 leading-none">x2</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white flex flex-wrap items-center gap-1.5">
                                                <span>Prestige multipliers (x2)</span>
                                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Dark card</span>
                                            </h4>
                                            <p className="text-xs text-gray-300 leading-relaxed mt-1">
                                                These double your overall final score! Multiple Prestige cards multiply your score repeatedly (e.g. two x2 cards quadruple your final points). Highest bidder wins and pays.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-green-800 pt-4">
                                <h3 className="text-lg font-serif text-yellow-400 mb-2">💩 Disgrace cards (reverse auction — avoid!)</h3>
                                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                                    Reverse auctions work differently: <strong className="text-yellow-400">the first player to pass takes the card and pays nothing</strong>! All other players must discard their active bids from their hand.
                                </p>
                                <div className="space-y-3">
                                    <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-xl flex items-center gap-3">
                                        <span className="text-xl bg-red-950/50 p-2 rounded-lg border border-red-800 shrink-0">💩</span>
                                        <div>
                                            <h5 className="text-xs font-bold text-red-200">Faux Pas! (drop / discard)</h5>
                                            <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">Forces you to discard your lowest-value luxury card. If you own no luxury cards, the next one you win is immediately discarded instead.</p>
                                        </div>
                                    </div>
                                    <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-xl flex items-center gap-3">
                                        <span className="text-xl bg-red-950/50 p-2 rounded-lg border border-red-800 shrink-0">📉</span>
                                        <div>
                                            <h5 className="text-xs font-bold text-red-200">Passé! (-5 points)</h5>
                                            <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">Subtracts 5 points from your final score calculation.</p>
                                        </div>
                                    </div>
                                    <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-xl flex items-center gap-3">
                                        <span className="text-xl bg-red-950/50 p-2 rounded-lg border border-red-800 shrink-0">⚡</span>
                                        <div>
                                            <h5 className="text-xs font-bold text-red-200">Scandale! (/2 division) — <span className="text-[10px] text-red-400 font-semibold uppercase tracking-tighter">Dark card</span></h5>
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
                                <h3 className="text-lg font-serif text-yellow-400 mb-2">💀 The ruin rule</h3>
                                <p className="text-sm leading-relaxed text-gray-300">
                                    Having the most prestigious collection is useless if you spent all your money to get it.
                                </p>
                                <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-2xl mt-3 space-y-2">
                                    <h4 className="text-rose-400 font-bold text-base flex items-center gap-1.5">
                                        ⚠️ Instant elimination!
                                    </h4>
                                    <p className="text-xs text-slate-200 leading-relaxed">
                                        At the end of the game, players count the banknotes remaining in their hands. <strong className="text-rose-300">The player (or players) with the least remaining money is immediately disqualified</strong>. They cannot win, regardless of how many luxury points they have!
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-green-800 pt-4">
                                <h3 className="text-lg font-serif text-yellow-400 mb-2">💯 Score calculation</h3>
                                <p className="text-sm leading-relaxed text-gray-300">
                                    For all surviving (non-eliminated) players, score is calculated as follows:
                                </p>
                                <div className="bg-black/30 p-3.5 sm:p-4 rounded-xl border border-green-800/60 font-serif space-y-2 mt-2">
                                    <div className="flex justify-between items-center text-xs border-b border-green-900 pb-1 text-gray-400">
                                        <span>Step</span>
                                        <span>Calculation method</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-3 text-xs sm:text-sm">
                                        <span className="text-gray-400">1. Base points</span>
                                        <span className="text-white font-bold text-right">Sum of luxury cards (1 to 10)</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-3 text-xs sm:text-sm">
                                        <span className="text-gray-400">2. Subtract penances</span>
                                        <span className="text-red-400 font-bold text-right">Minus 5 for each Passé! card</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-3 text-xs sm:text-sm">
                                        <span className="text-gray-400">3. Apply multipliers</span>
                                        <span className="text-yellow-400 font-bold text-right">Double (x2) for each Prestige card</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-3 text-xs sm:text-sm">
                                        <span className="text-gray-400">4. Apply divisors</span>
                                        <span className="text-red-400 font-bold text-right">Divide by 2 (rounded up) for each Scandale!</span>
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
                <div className="p-3.5 sm:p-4 border-t border-green-800 bg-green-900/60 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-yellow-500 hover:bg-yellow-400 text-green-950 font-extrabold px-6 py-2.5 rounded-xl shadow-lg shadow-yellow-500/20 transition-all active:scale-95 text-sm min-h-[42px]"
                    >
                        Let's auction!
                    </button>
                </div>
            </div>
        </div>
    );
};
