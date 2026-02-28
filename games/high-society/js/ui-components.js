// Opponent metadata (global)
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
        containerClasses += 'w-20 h-32 sm:w-28 sm:h-40 border-2 text-sm sm:text-base ' + (isDark ? 'border-yellow-500' : isNegative ? 'border-red-800' : 'border-emerald-800');
        titleClasses += 'text-[10px] sm:text-lg px-1 mt-1 sm:mt-0 break-words w-full';
        valueClasses += 'mt-1 sm:mt-2 text-xl sm:text-3xl';
    } else if (size === 'small') {
        containerClasses += 'w-10 h-16 sm:w-16 sm:h-24 border sm:border-2 overflow-hidden ' + (isDark ? 'border-yellow-500' : isNegative ? 'border-red-800' : 'border-emerald-800');
        titleClasses += 'text-[7.5px] sm:text-[11px] leading-[1] px-0.5 mt-0.5 sm:mt-1 break-words w-full tracking-tighter';
        valueClasses += 'mt-0 sm:mt-1 text-xs sm:text-xl';
    } else if (size === 'tiny') {
        containerClasses += 'w-8 h-12 sm:w-12 sm:h-16 border border-gray-400 overflow-hidden ' + (isDark ? 'border-yellow-500' : isNegative ? 'border-red-800' : 'border-emerald-800');
        valueClasses += 'text-[9px] sm:text-sm my-auto mx-auto tracking-tighter px-0.5 break-words w-full text-center leading-none';
    }

    const bgClasses = isDark ? 'bg-emerald-900 text-yellow-400' : isNegative ? 'bg-red-100 text-red-800' : 'bg-amber-50 text-emerald-900';
    const displayValue = card.type === 'luxury' ? card.value : (card.type === 'prestige' ? 'x2' : (card.value === 'discard' ? 'Drop' : card.value));

    if (size === 'tiny') {
        return (
            <div className={`${containerClasses} ${bgClasses}`}>
                <div className={valueClasses}>{displayValue}</div>
            </div>
        );
    }

    return (
        <div className={`${containerClasses} ${bgClasses}`}>
            <div className={titleClasses}>{card.name}</div>
            {(card.type === 'luxury' || card.type === 'prestige') && (
                <div className={valueClasses}>{displayValue}</div>
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
