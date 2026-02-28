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
                        <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full bg-green-900 border border-green-700 rounded p-2 text-white focus:outline-none focus:border-yellow-500"
                            maxLength="16" placeholder="You" />
                    </div>
                )}

                <div className="mb-8">
                    <label className="block text-yellow-400 font-bold mb-3">Select opponents ({!spectatorMode ? '2 to 4' : '3 to 5'})</label>
                    <div className="flex flex-wrap gap-2 justify-center mb-4 relative">
                        {AVAILABLE_OPPONENTS.map(opp => {
                            const isSelected = selectedOpponents.includes(opp);
                            return (
                                <button key={opp}
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
                                >{opp}</button>
                            );
                        })}
                        <div className="h-8 md:h-6 w-full mt-2 text-center text-xs md:text-sm text-yellow-300 italic transition-opacity duration-200">
                            {hoveredOpponent ? OPPONENT_DETAILS[hoveredOpponent].desc : "Hover over an opponent to see their playstyle."}
                        </div>
                    </div>
                    <p className="text-sm text-gray-400 text-center italic mt-2">
                        {selectedOpponents.length} selected. Total players: {selectedOpponents.length + (!spectatorMode ? 1 : 0)}
                    </p>
                </div>

                <div className="text-center mt-6">
                    <button onClick={startGame}
                        className={`${spectatorMode ? 'bg-green-700 hover:bg-green-600 border border-green-500 text-yellow-300 w-full mb-3' : 'bg-yellow-500 hover:bg-yellow-400 text-green-900 w-full sm:w-auto'} font-bold py-3 px-8 rounded-full text-xl shadow-lg transition transform hover:scale-105`}
                    >Start game</button>
                </div>
                {spectatorMode && (
                    <div className="bg-green-950/50 p-4 rounded-lg border border-green-700 mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-yellow-400 font-bold">Simulate games</label>
                            <input type="number" min="1" max="1000" value={targetSimulations}
                                onChange={(e) => setTargetSimulations(parseInt(e.target.value) || 1)}
                                className="w-24 bg-green-900 border border-green-700 rounded p-1 text-white text-center focus:outline-none focus:border-yellow-500 font-bold" />
                        </div>
                        <button onClick={startSimulation} className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 rounded-full shadow transition text-lg tracking-wide uppercase">Run simulation</button>
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
            <div className="flex justify-around p-1 sm:p-1 bg-green-900/50 flex-wrap shrink-0">
                {players.filter(p => p.isAI).map(p => (
                    <div key={p.id} style={{ width: `${100 / players.filter(p => p.isAI).length}%`, maxWidth: '200px' }} className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition-colors flex-1 ${turn === p.id ? 'bg-yellow-500/20 border border-yellow-500' : 'border border-transparent'}`}>
                        <div className="font-bold text-yellow-300 text-xs sm:text-base text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">{p.name}</div>
                        <div className="text-[9px] sm:text-[10px] text-gray-300 mb-1 sm:mb-2 leading-none">Hand: {p.hand.length}</div>
                        <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1 mb-1 sm:mb-3 min-h-[48px] sm:min-h-[64px] content-start">
                            {p.won.length > 0 ? p.won.map((c, i) => <React.Fragment key={i}>{renderCard(c, 'tiny')}</React.Fragment>) : <span className="text-[9px] sm:text-[10px] text-gray-500 italic mt-1 sm:mt-2">No estate</span>}
                        </div>
                        {p.pendingDiscard && <div className="text-[9px] sm:text-xs text-red-400 font-bold uppercase animate-pulse mb-0.5 sm:mb-1 -mt-1 sm:-mt-2">Pending Drop!</div>}
                        <div className="min-h-[30px] sm:min-h-[40px] flex items-center justify-center mt-auto">
                            {p.passed ? (
                                <span className="text-red-400 font-bold text-[10px] sm:text-xs bg-red-900/50 px-1 sm:px-2 py-0.5 sm:py-1 rounded">Passed</span>
                            ) : (
                                <div className="flex -space-x-2 sm:-space-x-4">
                                    {p.bid.map((val, idx) => (
                                        <div key={idx} className="w-6 h-8 sm:w-8 sm:h-12 bg-white rounded border border-gray-400 flex items-center justify-center text-[10px] sm:text-xs text-green-900 font-bold shadow">{val}k</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center relative z-10 p-2 sm:p-4 min-h-0 sm:gap-8">
                <div className="flex items-center space-x-3 sm:space-x-4 mb-2 sm:mb-0 shrink-0">
                    <div className="relative w-16 h-28 sm:w-28 sm:h-40 rounded-lg border-2 border-green-700 bg-green-800 flex items-center justify-center shadow-inner">
                        <span className="text-green-600 font-bold opacity-50 text-sm sm:text-lg text-center leading-tight">{deck.length} <br />Left</span>
                    </div>
                    <div className="animate-fade-in scale-90 sm:scale-100">{renderCard(revealedCard, 'large')}</div>
                </div>
                <div className="text-center flex flex-col justify-center bg-black/40 p-2 sm:p-4 rounded-xl border border-green-700 w-full sm:w-[320px] h-32 sm:h-40 shrink-0">
                    <h3 className="text-yellow-400 font-bold uppercase tracking-widest text-[10px] sm:text-sm mb-1 sm:mb-2 min-h-[2.5rem] flex items-center justify-center">
                        {revealedCard?.type === 'disgrace' ? 'Avoidance auction (first to pass gets it!)' : 'Luxury auction'}
                    </h3>
                    <div className="text-lg sm:text-2xl font-serif">Highest bid: <span className="text-yellow-300 font-bold">{currentHighestBid}k</span></div>
                    <div className="h-4 sm:h-6 text-gray-300 text-[10px] sm:text-sm mt-0 sm:mt-1 flex items-center justify-center">
                        {highestBidder !== null ? `by ${players[highestBidder].name}` : ''}
                    </div>
                </div>
            </div>

            {(() => {
                const human = players.find(p => !p.isAI);
                if (!human) return (
                    <div className="mt-auto p-8 border-t-2 bg-green-900 border-green-700 flex flex-col items-center justify-center relative">
                        <div className="text-yellow-500 text-2xl uppercase tracking-widest font-bold mb-2">Spectator mode</div>
                        <div className="text-gray-300">Watch the AI players battle for high society!</div>
                        <button onClick={() => setFastForward(!fastForward)} className={`mt-4 px-6 py-2 rounded-full font-bold shadow transition-colors text-sm ${fastForward ? 'bg-yellow-500 text-green-900' : 'bg-green-800 text-yellow-400 border border-yellow-500 hover:bg-green-700'}`}>
                            {fastForward ? '⏩ FAST FORWARD (ON)' : '▶️ FAST FORWARD (OFF)'}
                        </button>
                    </div>
                );

                const isHumanTurn = turn === human.id;
                return (
                    <div className={`mt-auto p-2 sm:p-3 border-t-2 shrink-0 ${isHumanTurn ? 'bg-green-800 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-green-900 border-green-700'}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mb-2 sm:mb-2 max-w-6xl mx-auto w-full gap-2 sm:gap-0">
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
                            <div className="shrink-0 flex flex-col items-center w-full sm:w-auto gap-2 z-10">
                                <div className="mb-1 sm:mb-2 h-10 sm:h-14 flex items-center space-x-1 sm:space-x-2 w-full justify-center">
                                    <span className="text-[10px] sm:text-sm text-gray-300 whitespace-nowrap">On table:</span>
                                    {human.passed ? (
                                        <span className="text-red-400 font-bold text-xs sm:text-base px-2 py-1 bg-red-900/50 rounded">You passed</span>
                                    ) : (
                                        human.bid.map((val, idx) => (
                                            <div key={idx} className="w-6 h-8 sm:w-10 sm:h-14 bg-gray-200 rounded border border-gray-400 flex items-center justify-center text-xs sm:text-sm text-green-900 font-bold shadow">{val}k</div>
                                        ))
                                    )}
                                    {human.bid.length === 0 && !human.passed && <span className="text-gray-500 text-[10px] sm:text-sm">Nothing</span>}
                                </div>
                                {isHumanTurn && !human.passed && (
                                    <div className="flex flex-row justify-between sm:justify-center items-center gap-2 sm:gap-6 bg-black/30 p-1 sm:p-3 rounded-lg w-full max-w-md">
                                        <div className="flex space-x-2 sm:space-x-4 ml-1 sm:ml-0">
                                            <div className="text-center">
                                                <div className="text-[8px] sm:text-xs text-gray-400 uppercase leading-none">Adding</div>
                                                <div className="text-sm sm:text-xl font-bold text-white leading-none mt-1">+{sumArray(humanPendingBid.map(i => human.hand[i]))}k</div>
                                            </div>
                                            <div className="text-center border-l border-gray-600 pl-2 sm:pl-4">
                                                <div className="text-[8px] sm:text-xs text-yellow-500 uppercase leading-none">New total</div>
                                                <div className="text-sm sm:text-xl font-bold text-yellow-300 leading-none mt-1">{sumArray(human.bid) + sumArray(humanPendingBid.map(i => human.hand[i]))}k</div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-1 sm:space-x-2">
                                            <button onClick={handleHumanBid}
                                                disabled={(sumArray(human.bid) + sumArray(humanPendingBid.map(i => human.hand[i]))) <= currentHighestBid}
                                                className="bg-yellow-500 disabled:bg-gray-600 disabled:text-gray-400 hover:bg-yellow-400 text-green-900 font-bold py-1 px-2 sm:py-2 sm:px-6 rounded shadow transition text-[10px] sm:text-base leading-tight">
                                                {human.bid.length > 0 ? 'Raise bid' : 'Submit bid'}
                                            </button>
                                            <button onClick={() => executePass(human.id)} className="bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-2 sm:py-2 sm:px-6 rounded shadow transition text-[10px] sm:text-base leading-tight">Pass</button>
                                        </div>
                                    </div>
                                )}
                                {!isHumanTurn && (
                                    <div className="text-yellow-400 font-bold animate-pulse py-1 sm:py-4 text-xs sm:text-base text-center w-full">Waiting for {players[turn]?.name}...</div>
                                )}
                            </div>
                            <div className="flex-1 hidden sm:block"></div>
                        </div>
                        <div className="flex justify-start sm:justify-center -space-x-1 sm:space-x-0 sm:gap-2 max-w-6xl mx-auto pb-1 pt-1 px-2 w-full overflow-x-auto flex-nowrap">
                            {(() => {
                                const handItems = human.hand.map((val, originalIndex) => ({ val, originalIndex }));
                                handItems.sort((a, b) => a.val - b.val);
                                return handItems.map((item, sortedIdx) => (
                                    <React.Fragment key={sortedIdx}>
                                        {renderMoneyCard(item.val, humanPendingBid.includes(item.originalIndex), isHumanTurn && !human.passed ? () => toggleHumanPendingCard(item.originalIndex) : undefined)}
                                    </React.Fragment>
                                ));
                            })()}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

function GameOverScreen({ players, startGame, setGameState }) {
    return (
        <div className="flex-1 flex flex-col items-center p-4 bg-green-900 overflow-y-auto">
            <div className="bg-emerald-800 p-6 md:p-10 rounded-xl shadow-2xl border border-yellow-500 w-full max-w-4xl m-auto">
                <h2 className="text-3xl md:text-5xl font-serif text-yellow-400 mb-2 text-center">Game over</h2>
                <p className="text-center text-gray-300 mb-8">The 4th dark card was revealed, closing the auctions!</p>
                <div className="space-y-4">
                    {players.map((p, idx) => (
                        <div key={p.id} className={`flex flex-col md:flex-row items-center p-4 rounded border ${p.isEliminated ? 'bg-red-950/50 border-red-800 opacity-70' : 'bg-green-950/50 border-green-700'}`}>
                            <div className="w-full md:w-1/4 flex flex-col items-center md:items-start mb-4 md:mb-0">
                                <span className="text-xl font-bold text-white flex items-center gap-2">{idx === 0 && !p.isEliminated && '🏆'}{p.isEliminated && '💀'}{p.name}</span>
                                <span className={`text-sm ${p.isEliminated ? 'text-red-400 font-bold' : 'text-gray-400'}`}>Money left: {sumArray(p.hand)}k</span>
                            </div>
                            <div className="w-full md:w-1/2 flex flex-wrap gap-2 justify-center">
                                {p.won.map((c, i) => <React.Fragment key={i}>{renderCard(c, 'small')}</React.Fragment>)}
                                {p.won.length === 0 && <span className="text-gray-500 italic">No assets acquired</span>}
                            </div>
                            <div className="w-full md:w-1/4 flex flex-col items-center md:items-end mt-4 md:mt-0">
                                {p.isEliminated ? (
                                    <span className="text-red-500 font-bold text-xl uppercase tracking-widest text-center md:text-right">Eliminated<br /><span className="text-xs text-red-400 normal-case">Poorest player</span></span>
                                ) : (
                                    <><span className="text-sm text-gray-400 uppercase tracking-widest">Total score</span><span className="text-4xl font-serif text-yellow-300">{p.score}</span></>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button onClick={startGame} className="bg-yellow-500 hover:bg-yellow-400 text-green-900 font-bold py-3 px-8 rounded-full text-xl shadow-lg transition">Play another game</button>
                    <button onClick={() => setGameState('start')} className="bg-green-700 hover:bg-green-600 border border-green-500 text-yellow-300 font-bold py-3 px-8 rounded-full text-xl shadow-lg transition">Main menu</button>
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
                    {Object.entries(simulationResults).sort((a, b) => b[1] - a[1]).map(([name, wins], i) => (
                        <div key={name} className="flex justify-between items-center bg-green-900 p-3 rounded border border-green-700">
                            <span className="text-yellow-300 font-bold">#{i + 1} {name}</span>
                            <span className="text-white font-bold">{wins} <span className="text-gray-400 font-normal text-sm ml-1">({((wins / simTargetRef.current) * 100).toFixed(1)}%)</span></span>
                        </div>
                    ))}
                </div>
                <button onClick={() => setGameState('start')} className="bg-yellow-500 hover:bg-yellow-400 text-green-900 font-bold py-3 px-8 rounded-full text-xl shadow transition mt-4">Back to menu</button>
            </div>
        </div>
    );
}
