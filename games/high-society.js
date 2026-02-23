const { useState, useEffect } = React;

const OPPONENT_DETAILS = {
    'Oliver': { name: 'Oliver', desc: 'The Penny-Pincher. Drops out early to save money, strong endgame.' },
    'Miles': { name: 'Miles', desc: 'The High Roller. Over-values multipliers and big drops. Often runs out.' },
    'Kirby 🐱': { name: 'Kirby 🐱', desc: 'The Wild-Card. Very erratic bidding, can push bids unexpectedly.' },
    'Pookie': { name: 'Pookie', desc: 'The Avoidant. Extremely averse to disgrace. Pays heavy to avoid negatives.' },
    'Jimmy': { name: 'Jimmy', desc: 'The Opportunist. Balanced early game, aggressive in later rounds.' }
};
const AVAILABLE_OPPONENTS = Object.keys(OPPONENT_DETAILS);

const renderCard = (card, size = 'large') => {
    if (!card) return null;
    const isDark = card.isDark;
    const isNegative = card.type === 'disgrace';

    let containerClasses = 'flex flex-col justify-center items-center rounded-lg shadow-md transition-all ';
    let titleClasses = 'font-bold text-center leading-tight ';
    let valueClasses = 'font-serif font-bold ';

    if (size === 'large') {
        containerClasses += 'w-20 h-32 sm:w-32 sm:h-48 border-2 text-sm sm:text-lg ' + (isDark ? 'border-yellow-500' : isNegative ? 'border-red-800' : 'border-emerald-800');
        titleClasses += 'text-xs sm:text-xl px-1 mt-1 sm:mt-0';
        valueClasses += 'mt-1 sm:mt-4 text-xl sm:text-4xl';
    } else if (size === 'small') {
        containerClasses += 'w-10 h-16 sm:w-16 sm:h-24 border sm:border-2 text-[10px] sm:text-xs ' + (isDark ? 'border-yellow-500' : isNegative ? 'border-red-800' : 'border-emerald-800');
        titleClasses += 'text-[8px] sm:text-xs px-0.5 mt-0.5 sm:mt-1';
        valueClasses += 'mt-0 sm:mt-1 text-xs sm:text-xl';
    } else if (size === 'tiny') {
        containerClasses += 'w-8 h-12 sm:w-12 sm:h-16 border border-gray-400 text-[8px] sm:text-[10px] ' + (isDark ? 'border-yellow-500' : isNegative ? 'border-red-800' : 'border-emerald-800');
        titleClasses += 'text-[8px] sm:text-[10px] px-0 leading-[1] sm:px-0.5 mt-0 sm:mt-0.5 tracking-tighter';
        valueClasses += 'text-[10px] sm:text-sm';
    }

    const bgClasses = isDark ? 'bg-emerald-900 text-yellow-400' : isNegative ? 'bg-red-100 text-red-800' : 'bg-amber-50 text-emerald-900';

    return (
        <div className={`${containerClasses} ${bgClasses}`}>
            <div className={titleClasses}>{card.type === 'luxury' ? 'Luxury' : card.name}</div>
            {(card.type === 'luxury' || card.type === 'prestige') && (
                <div className={valueClasses}>
                    {card.type === 'luxury' ? card.value : 'x2'}
                </div>
            )}
        </div>
    );
};

const renderMoneyCard = (val, isSelected = false, onClick = null) => (
    <div
        onClick={onClick}
        className={`shrink-0 relative w-10 h-14 sm:w-16 sm:h-24 rounded shadow-sm border border-gray-400 flex items-center justify-center font-bold text-green-900 cursor-pointer transition-all text-sm sm:text-base
          ${isSelected ? 'bg-yellow-200 -translate-y-2 sm:-translate-y-4 shadow-lg border-yellow-500 border-2 z-10' : 'bg-white hover:-translate-y-1 sm:hover:-translate-y-2'}`}
    >
        {val}k
    </div>
);


function GameStartScreen({
    spectatorMode, setSpectatorMode,
    playerName, setPlayerName,
    selectedOpponents, setSelectedOpponents,
    hoveredOpponent, setHoveredOpponent,
    startGame,
    targetSimulations, setTargetSimulations,
    startSimulation
}) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 bg-green-900 overflow-y-auto py-10">
            <div className="bg-emerald-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-yellow-500 max-w-lg w-full mx-4">
                <h2 className="text-4xl font-serif text-yellow-400 mb-4 text-center">High Society</h2>
                <p className="text-gray-200 mb-6 text-center">Outbid your rivals for luxury, but don't be the poorest at the end, or you'll be ruined!</p>

                <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-green-950/50 p-4 rounded-lg border border-green-700">
                    <label className="text-yellow-400 font-bold mb-2 sm:mb-0 cursor-pointer" onClick={() => document.getElementById('spectatorToggle').click()}>Spectator mode</label>
                    <input
                        id="spectatorToggle"
                        type="checkbox"
                        checked={spectatorMode}
                        onChange={(e) => {
                            const isChecked = e.target.checked;
                            setSpectatorMode(isChecked);
                            if (isChecked && selectedOpponents.length < 3) {
                                const newOpp = [...selectedOpponents];
                                for (let opp of AVAILABLE_OPPONENTS) {
                                    if (!newOpp.includes(opp)) newOpp.push(opp);
                                    if (newOpp.length === 3) break;
                                }
                                setSelectedOpponents(newOpp);
                            } else if (!isChecked && selectedOpponents.length > 4) {
                                setSelectedOpponents(selectedOpponents.slice(0, 4));
                            }
                        }}
                        className="w-6 h-6 accent-yellow-500 cursor-pointer"
                    />
                </div>

                {!spectatorMode && (
                    <div className="mb-6">
                        <label className="block text-yellow-400 font-bold mb-2">Your name</label>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full bg-green-900 border border-green-700 rounded p-2 text-white focus:outline-none focus:border-yellow-500"
                            maxLength="16"
                            placeholder="You"
                        />
                    </div>
                )}

                <div className="mb-8">
                    <label className="block text-yellow-400 font-bold mb-3">Select opponents ({!spectatorMode ? '2 to 4' : '3 to 5'})</label>
                    <div className="flex flex-wrap gap-2 justify-center mb-4 relative">
                        {AVAILABLE_OPPONENTS.map(opp => {
                            const isSelected = selectedOpponents.includes(opp);
                            return (
                                <button
                                    key={opp}
                                    onMouseEnter={() => setHoveredOpponent(opp)}
                                    onMouseLeave={() => setHoveredOpponent(null)}
                                    onClick={() => {
                                        if (isSelected) {
                                            if (selectedOpponents.length > (!spectatorMode ? 2 : 3)) setSelectedOpponents(selectedOpponents.filter(o => o !== opp));
                                        } else {
                                            if (selectedOpponents.length < (!spectatorMode ? 4 : 5)) setSelectedOpponents([...selectedOpponents, opp]);
                                        }
                                    }}
                                    className={`px-4 py-2 rounded-full border shadow-md transition transform hover:scale-105 text-sm font-bold ${isSelected ? 'bg-yellow-500 text-green-900 border-yellow-400' : 'bg-green-950 text-gray-400 border-green-700 hover:bg-green-800'}`}
                                >
                                    {opp}
                                </button>
                            )
                        })}

                        {/* Tooltip for Opponent Descriptions */}
                        <div className="h-8 md:h-6 w-full mt-2 text-center text-xs md:text-sm text-yellow-300 italic transition-opacity duration-200">
                            {hoveredOpponent ? OPPONENT_DETAILS[hoveredOpponent].desc : "Hover over an opponent to see their playstyle."}
                        </div>
                    </div>
                    <p className="text-sm text-gray-400 text-center italic mt-2">
                        {selectedOpponents.length} selected. Total players: {selectedOpponents.length + (!spectatorMode ? 1 : 0)}
                    </p>
                </div>

                <div className="text-center mt-6">
                    <button
                        onClick={startGame}
                        className={`${spectatorMode ? 'bg-green-700 hover:bg-green-600 border border-green-500 text-yellow-300 w-full mb-3' : 'bg-yellow-500 hover:bg-yellow-400 text-green-900 w-full sm:w-auto'} font-bold py-3 px-8 rounded-full text-xl shadow-lg transition transform hover:scale-105`}
                    >
                        Start game
                    </button>
                </div>
                {spectatorMode && (
                    <div className="bg-green-950/50 p-4 rounded-lg border border-green-700 mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-yellow-400 font-bold">Simulate games</label>
                            <input
                                type="number"
                                min="1"
                                max="1000"
                                value={targetSimulations}
                                onChange={(e) => setTargetSimulations(parseInt(e.target.value) || 1)}
                                className="w-24 bg-green-900 border border-green-700 rounded p-1 text-white text-center focus:outline-none focus:border-yellow-500 font-bold"
                            />
                        </div>
                        <button
                            onClick={startSimulation}
                            className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 rounded-full shadow transition text-lg tracking-wide uppercase"
                        >
                            Run simulation
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}


function GamePlayArea({
    isSimulatingRef, simCountRef, simTargetRef,
    players, turn, deck, revealedCard,
    currentHighestBid, highestBidder,
    fastForward, setFastForward,
    humanPendingBid,
    handleHumanBid, executePass,
    toggleHumanPendingCard
}) {
    return (
        <div className="flex-1 flex flex-col relative overflow-hidden">
            {isSimulatingRef.current && (
                <div className="bg-yellow-500 text-green-900 font-bold text-center z-50 py-1 shadow-md w-full">
                    SIMULATING GAME {simCountRef.current} OF {simTargetRef.current}...
                </div>
            )}

            {/* OPPONENTS AREA */}
            <div className="flex justify-around p-1 sm:p-2 bg-green-900/50 flex-wrap">
                {players.filter(p => p.isAI).map(p => (
                    <div key={p.id} style={{ width: `${100 / players.filter(p => p.isAI).length}%`, maxWidth: '200px' }} className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition-colors flex-1 ${turn === p.id ? 'bg-yellow-500/20 border border-yellow-500' : 'border border-transparent'}`}>
                        <div className="font-bold text-yellow-300 text-xs sm:text-base text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">{p.name}</div>
                        <div className="text-[9px] sm:text-[10px] text-gray-300 mb-1 sm:mb-2 leading-none">Hand: {p.hand.length}</div>

                        {/* Opponent Estate */}
                        <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1 mb-1 sm:mb-3 min-h-[48px] sm:min-h-[64px] content-start">
                            {p.won.length > 0 ? (
                                p.won.map((c, i) => <React.Fragment key={i}>{renderCard(c, 'tiny')}</React.Fragment>)
                            ) : (
                                <span className="text-[9px] sm:text-[10px] text-gray-500 italic mt-1 sm:mt-2">No estate</span>
                            )}
                        </div>
                        {p.pendingDiscard && <div className="text-[9px] sm:text-xs text-red-400 font-bold uppercase animate-pulse mb-0.5 sm:mb-1 -mt-1 sm:-mt-2">Pending Drop!</div>}

                        {/* Opponent Bid Area */}
                        <div className="min-h-[30px] sm:min-h-[40px] flex items-center justify-center mt-auto">
                            {p.passed ? (
                                <span className="text-red-400 font-bold text-[10px] sm:text-xs bg-red-900/50 px-1 sm:px-2 py-0.5 sm:py-1 rounded">Passed</span>
                            ) : (
                                <div className="flex -space-x-2 sm:-space-x-4">
                                    {p.bid.map((val, idx) => (
                                        <div key={idx} className="w-6 h-8 sm:w-8 sm:h-12 bg-white rounded border border-gray-400 flex items-center justify-center text-[10px] sm:text-xs text-green-900 font-bold shadow">
                                            {val}k
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* TABLE CENTER */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-2 sm:p-4">
                {/* Deck and Revealed Card */}
                <div className="flex items-center space-x-3 sm:space-x-8 mb-2 sm:mb-6">
                    <div className="relative w-16 h-28 sm:w-32 sm:h-48 rounded-lg border-2 border-green-700 bg-green-800 flex items-center justify-center shadow-inner">
                        <span className="text-green-600 font-bold opacity-50 text-sm sm:text-xl text-center leading-tight">
                            {deck.length} <br />Left
                        </span>
                    </div>
                    <div className="animate-fade-in scale-90 sm:scale-100">
                        {renderCard(revealedCard, 'large')}
                    </div>
                </div>

                {/* Auction Status */}
                <div className="text-center bg-black/40 p-2 sm:p-4 rounded-xl border border-green-700 w-full max-w-md">
                    <h3 className="text-yellow-400 font-bold uppercase tracking-widest text-[10px] sm:text-sm mb-1 sm:mb-2">
                        {revealedCard?.type === 'disgrace' ? 'Avoidance auction (first to pass gets it!)' : 'Luxury auction'}
                    </h3>
                    <div className="text-lg sm:text-2xl font-serif">
                        Highest bid: <span className="text-yellow-300 font-bold">{currentHighestBid}k</span>
                    </div>
                    {highestBidder !== null && (
                        <div className="text-gray-300 text-[10px] sm:text-sm mt-0 sm:mt-1">
                            by {players[highestBidder].name}
                        </div>
                    )}
                </div>
            </div>

            {(() => {
                const human = players.find(p => !p.isAI);
                if (!human) return (
                    <div className="mt-auto p-8 border-t-2 bg-green-900 border-green-700 flex flex-col items-center justify-center relative">
                        <div className="text-yellow-500 text-2xl uppercase tracking-widest font-bold mb-2">Spectator mode</div>
                        <div className="text-gray-300">Watch the AI players battle for high society!</div>
                        <button
                            onClick={() => setFastForward(!fastForward)}
                            className={`mt-4 px-6 py-2 rounded-full font-bold shadow transition-colors text-sm ${fastForward ? 'bg-yellow-500 text-green-900' : 'bg-green-800 text-yellow-400 border border-yellow-500 hover:bg-green-700'}`}
                        >
                            {fastForward ? '⏩ FAST FORWARD (ON)' : '▶️ FAST FORWARD (OFF)'}
                        </button>
                    </div>
                );

                const isHumanTurn = turn === human.id;
                return (
                    <div className={`mt-auto p-2 sm:p-4 border-t-2 ${isHumanTurn ? 'bg-green-800 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-green-900 border-green-700'}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mb-2 sm:mb-4 max-w-6xl mx-auto w-full gap-2 sm:gap-0">

                            {/* Player Won Cards */}
                            <div className="flex-1 flex flex-col items-center sm:items-start w-full sm:w-auto">
                                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                    <div className="text-[10px] sm:text-xs text-yellow-300 font-bold uppercase tracking-wider">Your estate</div>
                                    {human.pendingDiscard && <div className="text-[9px] sm:text-xs bg-red-900 border border-red-500 text-red-300 px-1 py-0.5 rounded font-bold animate-pulse">PENDING DROP!</div>}
                                </div>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-1 min-h-[32px] sm:min-h-[96px] content-start">
                                    {human.won.map((c, i) => (
                                        <React.Fragment key={i}>
                                            <div className="hidden sm:block">{renderCard(c, 'small')}</div>
                                            <div className="block sm:hidden">{renderCard(c, 'tiny')}</div>
                                        </React.Fragment>
                                    ))}
                                    {human.won.length === 0 && <span className="text-gray-500 text-[10px] sm:text-sm italic mt-1 sm:mt-4">Empty</span>}
                                </div>
                            </div>

                            {/* Player Controls */}
                            <div className="shrink-0 flex flex-col items-center w-full sm:w-auto gap-2 z-10">
                                {/* Current Bid Display */}
                                <div className="mb-1 sm:mb-2 h-10 sm:h-14 flex items-center space-x-1 sm:space-x-2 w-full justify-center">
                                    <span className="text-[10px] sm:text-sm text-gray-300 whitespace-nowrap">On table:</span>
                                    {human.passed ? (
                                        <span className="text-red-400 font-bold text-xs sm:text-base px-2 py-1 bg-red-900/50 rounded">You passed</span>
                                    ) : (
                                        human.bid.map((val, idx) => (
                                            <div key={idx} className="w-6 h-8 sm:w-10 sm:h-14 bg-gray-200 rounded border border-gray-400 flex items-center justify-center text-xs sm:text-sm text-green-900 font-bold shadow">
                                                {val}k
                                            </div>
                                        ))
                                    )}
                                    {human.bid.length === 0 && !human.passed && <span className="text-gray-500 text-[10px] sm:text-sm">Nothing</span>}
                                </div>

                                {/* Pending Selection & Actions */}
                                {isHumanTurn && !human.passed && (
                                    <div className="flex flex-row justify-between sm:justify-center items-center gap-2 sm:gap-6 bg-black/30 p-1 sm:p-3 rounded-lg w-full max-w-md">
                                        <div className="flex space-x-2 sm:space-x-4 ml-1 sm:ml-0">
                                            <div className="text-center">
                                                <div className="text-[8px] sm:text-xs text-gray-400 uppercase leading-none">Adding</div>
                                                <div className="text-sm sm:text-xl font-bold text-white leading-none mt-1">
                                                    +{sumArray(humanPendingBid.map(i => human.hand[i]))}k
                                                </div>
                                            </div>
                                            <div className="text-center border-l border-gray-600 pl-2 sm:pl-4">
                                                <div className="text-[8px] sm:text-xs text-yellow-500 uppercase leading-none">New total</div>
                                                <div className="text-sm sm:text-xl font-bold text-yellow-300 leading-none mt-1">
                                                    {sumArray(human.bid) + sumArray(humanPendingBid.map(i => human.hand[i]))}k
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-1 sm:space-x-2">
                                            <button
                                                onClick={handleHumanBid}
                                                disabled={(sumArray(human.bid) + sumArray(humanPendingBid.map(i => human.hand[i]))) <= currentHighestBid}
                                                className="bg-yellow-500 disabled:bg-gray-600 disabled:text-gray-400 hover:bg-yellow-400 text-green-900 font-bold py-1 px-2 sm:py-2 sm:px-6 rounded shadow transition text-[10px] sm:text-base leading-tight"
                                            >
                                                {human.bid.length > 0 ? 'Raise bid' : 'Submit bid'}
                                            </button>
                                            <button
                                                onClick={() => executePass(human.id)}
                                                className="bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-2 sm:py-2 sm:px-6 rounded shadow transition text-[10px] sm:text-base leading-tight"
                                            >
                                                Pass
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {!isHumanTurn && (
                                    <div className="text-yellow-400 font-bold animate-pulse py-1 sm:py-4 text-xs sm:text-base text-center w-full">Waiting for {players[turn]?.name}...</div>
                                )}
                            </div>

                            {/* Balancing Div for Desktop Centering */}
                            <div className="flex-1 hidden sm:block"></div>
                        </div>

                        {/* Player Hand */}
                        <div className="flex justify-start sm:justify-center -space-x-1 sm:space-x-0 sm:gap-2 max-w-6xl mx-auto pb-2 pt-2 px-2 w-full overflow-x-auto flex-nowrap">
                            {(() => {
                                const handItems = human.hand.map((val, originalIndex) => ({ val, originalIndex }));
                                handItems.sort((a, b) => a.val - b.val);
                                return handItems.map((item, sortedIdx) => (
                                    <React.Fragment key={sortedIdx}>
                                        {renderMoneyCard(
                                            item.val,
                                            humanPendingBid.includes(item.originalIndex),
                                            isHumanTurn && !human.passed ? () => toggleHumanPendingCard(item.originalIndex) : undefined
                                        )}
                                    </React.Fragment>
                                ));
                            })()}
                        </div>
                    </div>
                );
            })()}
        </div >
    );
}


function GameOverScreen({ players, startGame }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-green-900 overflow-y-auto">
            <div className="bg-emerald-800 p-6 md:p-10 rounded-xl shadow-2xl border border-yellow-500 w-full max-w-4xl">
                <h2 className="text-3xl md:text-5xl font-serif text-yellow-400 mb-2 text-center">Game over</h2>
                <p className="text-center text-gray-300 mb-8">The 4th dark card was revealed, closing the auctions!</p>

                <div className="space-y-4">
                    {players.map((p, idx) => (
                        <div key={p.id} className={`flex flex-col md:flex-row items-center p-4 rounded border ${p.isEliminated ? 'bg-red-950/50 border-red-800 opacity-70' : 'bg-green-950/50 border-green-700'}`}>

                            <div className="w-full md:w-1/4 flex flex-col items-center md:items-start mb-4 md:mb-0">
                                <span className="text-xl font-bold text-white flex items-center gap-2">
                                    {idx === 0 && !p.isEliminated && '🏆'}
                                    {p.isEliminated && '💀'}
                                    {p.name}
                                </span>
                                <span className={`text-sm ${p.isEliminated ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                                    Money left: {sumArray(p.hand)}k
                                </span>
                            </div>

                            <div className="w-full md:w-1/2 flex flex-wrap gap-2 justify-center">
                                {p.won.map((c, i) => <React.Fragment key={i}>{renderCard(c, 'small')}</React.Fragment>)}
                                {p.won.length === 0 && <span className="text-gray-500 italic">No assets acquired</span>}
                            </div>

                            <div className="w-full md:w-1/4 flex flex-col items-center md:items-end mt-4 md:mt-0">
                                {p.isEliminated ? (
                                    <span className="text-red-500 font-bold text-xl uppercase tracking-widest text-center md:text-right">Eliminated<br /><span className="text-xs text-red-400 normal-case">Poorest player</span></span>
                                ) : (
                                    <>
                                        <span className="text-sm text-gray-400 uppercase tracking-widest">Total score</span>
                                        <span className="text-4xl font-serif text-yellow-300">{p.score}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 text-center">
                    <button
                        onClick={startGame}
                        className="bg-yellow-500 hover:bg-yellow-400 text-green-900 font-bold py-3 px-8 rounded-full text-xl shadow-lg transition"
                    >
                        Play another game
                    </button>
                </div>
            </div>
        </div>
    );
}


function GameSimulationEndScreen({ simTargetRef, simulationResults, setGameState }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 bg-green-900 overflow-y-auto py-10 relative z-20">
            <div className="bg-emerald-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-yellow-500 max-w-lg w-full mx-4 text-center">
                <h2 className="text-3xl font-serif text-yellow-400 mb-6 font-bold uppercase tracking-widest">Simulation complete</h2>
                <p className="text-gray-200 mb-6 block text-lg">Results after {simTargetRef.current} games:</p>

                <div className="flex flex-col space-y-3 mb-8 text-left max-w-xs mx-auto">
                    {Object.entries(simulationResults)
                        .sort((a, b) => b[1] - a[1]) // highest wins first
                        .map(([name, wins], i) => (
                            <div key={name} className="flex justify-between items-center bg-green-900 p-3 rounded border border-green-700">
                                <span className="text-yellow-300 font-bold">#{i + 1} {name}</span>
                                <span className="text-white font-bold">{wins} <span className="text-gray-400 font-normal text-sm ml-1">({((wins / simTargetRef.current) * 100).toFixed(1)}%)</span></span>
                            </div>
                        ))}
                </div>
                <button
                    onClick={() => setGameState('start')}
                    className="bg-yellow-500 hover:bg-yellow-400 text-green-900 font-bold py-3 px-8 rounded-full text-xl shadow transition mt-4"
                >
                    Back to menu
                </button>
            </div>
        </div>
    );
}

function App() {
    const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'end'
    const [players, setPlayers] = useState([]);
    const [deck, setDeck] = useState([]);
    const [revealedCard, setRevealedCard] = useState(null);
    const [darkCardsDrawn, setDarkCardsDrawn] = useState(0);

    const [turn, setTurn] = useState(0);
    const [currentHighestBid, setCurrentHighestBid] = useState(0);
    const [highestBidder, setHighestBidder] = useState(null);

    const [logs, setLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(false);
    const [humanPendingBid, setHumanPendingBid] = useState([]); // Indices of selected cards in hand
    const [fastForward, setFastForward] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && gameState === 'playing') {
                setIsPaused(p => !p);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    // Pre-game state
    const [playerName, setPlayerName] = useState('You');
    const [spectatorMode, setSpectatorMode] = useState(false);
    const [selectedOpponents, setSelectedOpponents] = useState(['Oliver', 'Miles', 'Kirby 🐱']);
    const [hoveredOpponent, setHoveredOpponent] = useState(null);

    const isSimulatingRef = React.useRef(false);
    const simCountRef = React.useRef(0);
    const simTargetRef = React.useRef(0);
    const simResultsRef = React.useRef({});

    const [targetSimulations, setTargetSimulations] = useState(100);
    const [simulationResults, setSimulationResults] = useState({});

    // --- INITIALIZATION ---

    // --- INITIALIZATION ---
    const startGame = () => {
        let initialPlayers = createInitialPlayers({
            spectatorMode,
            playerName,
            selectedOpponents,
            MONEY_CARDS
        });

        setPlayers(initialPlayers);

        let shuffledDeck = shuffle(INITIAL_DECK);
        setDeck(shuffledDeck);
        setDarkCardsDrawn(0);
        if (!isSimulatingRef.current) {
            setLogs(['The game of High Society has begun!']);
        }
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

    const addLog = (msg) => {
        if (isSimulatingRef.current) return;
        setLogs((prev) => [msg, ...prev].slice(0, 50));
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

        // Reset bidding state for all players
        const updatedPlayers = currentPlayers.map(p => ({
            ...p,
            passed: false,
            bid: []
        }));
        setPlayers(updatedPlayers);
        setCurrentHighestBid(0);
        setHighestBidder(null);
        setHumanPendingBid([]);
        setTurn(nextTurn);

        addLog(`New auction: ${card.name} (${card.type === 'disgrace' ? 'First to pass gets it!' : 'Highest bidder wins!'})`);
    };

    // --- AI LOGIC & AUTO PASS ---
    useEffect(() => {
        if (gameState !== 'playing' || isPaused) return;

        const currentPlayer = players[turn];
        if (!currentPlayer || currentPlayer.passed) return;

        // Auto-pass if the player has completely run out of money
        if (currentPlayer.hand.length === 0) {
            const timer = setTimeout(() => {
                executePass(turn);
            }, isSimulatingRef.current ? 0 : (fastForward ? 50 : 1000));
            return () => clearTimeout(timer);
        }

        // If it is an AI turn and they have money, process AI turn
        if (currentPlayer.isAI) {
            const timer = setTimeout(() => {
                processAITurn();
            }, isSimulatingRef.current ? 0 : (fastForward ? 50 : 1200));
            return () => clearTimeout(timer);
        }
    }, [turn, gameState, revealedCard, fastForward, isPaused]);

    // --- FIREWORKS ---
    useEffect(() => {
        if (gameState === 'end' && !isSimulatingRef.current && window.confetti) {
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                window.confetti({
                    ...defaults, particleCount,
                    origin: { x: Math.random() * 0.5 + 0.25, y: Math.random() - 0.2 }
                });
                window.confetti({
                    ...defaults, particleCount,
                    origin: { x: Math.random() * 0.5 + 0.5, y: Math.random() - 0.2 }
                });
            }, 250);
        }
    }, [gameState]);

    const processAITurn = () => {
        const ai = players[turn];
        if (ai.passed) {
            goToNextPlayer();
            return;
        }

        const bestAdditionalCards = calculateAIBid({
            ai,
            deckLength: deck.length,
            revealedCard,
            currentHighestBid,
            sumArray
        });

        if (bestAdditionalCards) {
            executeBid(turn, bestAdditionalCards);
        } else {
            executePass(turn);
        }
    };

    // --- ACTIONS ---
    const toggleHumanPendingCard = (cardIndex) => {
        if (humanPendingBid.includes(cardIndex)) {
            setHumanPendingBid(humanPendingBid.filter(i => i !== cardIndex));
        } else {
            setHumanPendingBid([...humanPendingBid, cardIndex]);
        }
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

    const executeBid = (playerId, additionalCards) => {
        const p = players[playerId];
        const additionalAmount = sumArray(additionalCards);
        const newBidTotal = sumArray(p.bid) + additionalAmount;

        let newHand = [...p.hand];
        for (const card of additionalCards) {
            const idx = newHand.indexOf(card);
            if (idx > -1) newHand.splice(idx, 1);
        }

        const updatedPlayers = [...players];
        updatedPlayers[playerId] = {
            ...p,
            hand: newHand,
            bid: [...p.bid, ...additionalCards]
        };

        setPlayers(updatedPlayers);
        setCurrentHighestBid(newBidTotal);
        setHighestBidder(playerId);

        if (p.bid.length > 0) {
            addLog(`${p.name} added ${additionalAmount}k to their bid (Total: ${newBidTotal}k).`);
        } else {
            addLog(`${p.name} bid ${newBidTotal}k.`);
        }

        setHumanPendingBid([]);
        goToNextPlayer(updatedPlayers);
    };

    const executePass = (playerId) => {
        const p = players[playerId];
        addLog(`${p.name} passed.`);

        const updatedPlayers = [...players];
        updatedPlayers[playerId].passed = true;

        setPlayers(updatedPlayers);
        setHumanPendingBid([]);

        checkAuctionStatus(updatedPlayers, playerId);
    };

    const goToNextPlayer = (currentPlayers = players) => {
        const next = getNextTurn(currentPlayers, turn);
        setTurn(next);
    };

    const checkAuctionStatus = (currentPlayers, passedPlayerId) => {
        const isNegativeAuction = revealedCard.type === 'disgrace';

        if (isNegativeAuction) {
            endAuction(currentPlayers, passedPlayerId);
        } else {
            const activePlayers = currentPlayers.filter(p => !p.passed);
            if (activePlayers.length === 1) {
                endAuction(currentPlayers, activePlayers[0].id);
            } else if (activePlayers.length === 0) {
                addLog(`Everyone passed. The card is discarded.`);
                drawNextCard(deck, currentPlayers, darkCardsDrawn, (turn + 1) % currentPlayers.length);
            } else {
                goToNextPlayer(currentPlayers);
            }
        }
    };

    const endAuction = (currentPlayers, winnerId) => {
        const { updatedPlayers, logs: auctionLogs } = resolveAuction({
            players: currentPlayers,
            winnerId,
            revealedCard,
            currentHighestBid
        });

        setPlayers(updatedPlayers);
        auctionLogs.forEach(addLog);

        setTimeout(() => {
            drawNextCard(deck, updatedPlayers, darkCardsDrawn, winnerId);
        }, isSimulatingRef.current ? 0 : (fastForward ? 100 : 1500));
    };

    // --- GAME END ---
    const endGame = (currentPlayers) => {
        const { finalPlayers, minMoney } = calculateFinalScores(currentPlayers, sumArray);

        finalPlayers.forEach(p => {
            if (p.isEliminated && sumArray(p.hand) === minMoney) {
                addLog(`💀 ${p.name} eliminated for having the least money (${minMoney}k)!`);
            }
        });

        if (isSimulatingRef.current) {
            const winner = finalPlayers[0];
            simResultsRef.current[winner.name] += 1;
            setSimulationResults({ ...simResultsRef.current });

            if (simCountRef.current < simTargetRef.current) {
                simCountRef.current += 1;
                setTimeout(() => startGame(), 0);
            } else {
                isSimulatingRef.current = false;
                setGameState('simulation-end');
            }
            return;
        }

        setPlayers(finalPlayers);
        setGameState('end');
    };

    return (
        <div className="min-h-screen bg-green-950 text-white font-sans flex flex-col">

            {/* HEADER & LOGS */}
            <div className="bg-green-900 p-2 border-b border-green-700 flex justify-between items-center shadow-md z-20 relative">
                <h1 className="text-xl sm:text-2xl font-serif text-yellow-400 font-bold tracking-wider">HIGH SOCIETY</h1>
                <div className="flex items-center space-x-4 w-1/2 justify-end">
                    <div className="h-8 leading-8 overflow-hidden text-sm sm:text-base text-gray-200 text-right opacity-80 italic hidden sm:block truncate flex-1">
                        {logs[0]}
                    </div>
                    <button onClick={() => setShowLogs(!showLogs)} className="bg-green-800 hover:bg-green-700 text-yellow-400 px-3 py-1 rounded border border-green-600 shadow text-sm whitespace-nowrap transition cursor-pointer">
                        📜 Logs
                    </button>
                </div>
            </div>

            {/* Collapsible Log Panel */}
            <div className={`fixed top-0 right-0 h-full bg-green-950 border-l border-green-700 shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col w-80 max-w-[80vw] ${showLogs ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 border-b border-green-700 flex justify-between items-center bg-green-900">
                    <h2 className="text-xl font-bold text-yellow-400 font-serif">Game log</h2>
                    <button onClick={() => setShowLogs(false)} className="text-gray-300 hover:text-white text-xl cursor-pointer">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {logs.map((log, i) => (
                        <div key={i} className="text-sm text-gray-300 border-b border-green-800/50 pb-2">
                            {log}
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-gray-500 italic text-sm">No activity yet.</div>}
                </div>
            </div>

            {/* Overlay to click off logs */}
            {showLogs && (
                <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={() => setShowLogs(false)}></div>
            )}

            {gameState === 'start' && (
                <GameStartScreen
                    spectatorMode={spectatorMode} setSpectatorMode={setSpectatorMode}
                    playerName={playerName} setPlayerName={setPlayerName}
                    selectedOpponents={selectedOpponents} setSelectedOpponents={setSelectedOpponents}
                    hoveredOpponent={hoveredOpponent} setHoveredOpponent={setHoveredOpponent}
                    startGame={startGame}
                    targetSimulations={targetSimulations} setTargetSimulations={setTargetSimulations}
                    startSimulation={startSimulation}
                />
            )}

            {gameState === 'playing' && (
                <GamePlayArea
                    isSimulatingRef={isSimulatingRef} simCountRef={simCountRef} simTargetRef={simTargetRef}
                    players={players} turn={turn} deck={deck} revealedCard={revealedCard}
                    currentHighestBid={currentHighestBid} highestBidder={highestBidder}
                    fastForward={fastForward} setFastForward={setFastForward}
                    humanPendingBid={humanPendingBid}
                    handleHumanBid={handleHumanBid} executePass={executePass}
                    toggleHumanPendingCard={toggleHumanPendingCard}
                />
            )}

            {gameState === 'end' && (
                <GameOverScreen players={players} startGame={startGame} />
            )}

            {gameState === 'simulation-end' && (
                <GameSimulationEndScreen
                    simTargetRef={simTargetRef}
                    simulationResults={simulationResults}
                    setGameState={setGameState}
                />
            )}

            {isPaused && gameState === 'playing' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-emerald-900 border-2 border-yellow-500 rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center">
                        <h2 className="text-3xl font-serif text-yellow-400 mb-6 font-bold tracking-widest uppercase">Game paused</h2>
                        <div className="flex flex-col gap-4 w-full">
                            <button
                                onClick={() => setIsPaused(false)}
                                className="bg-yellow-500 hover:bg-yellow-400 text-green-900 font-bold py-3 px-6 rounded-full text-lg shadow transition w-full"
                            >
                                Resume game
                            </button>
                            <button
                                onClick={() => {
                                    setIsPaused(false);
                                    setGameState('start');
                                }}
                                className="bg-red-800 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full text-lg shadow transition w-full"
                            >
                                Quit to menu
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

if (typeof document !== 'undefined') {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
}

// Support Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MONEY_CARDS,
        INITIAL_DECK,
        sumArray,
        shuffle,
        getSubsets,
        calculateAIBid
    };
}
