// --- GAME CONSTANTS ---
const MONEY_CARDS = [1, 2, 3, 4, 5, 8, 10, 12, 15, 20, 25];

const INITIAL_DECK = [
    { id: 'l1', type: 'luxury', value: 1, name: 'Parfum', isDark: false },
    { id: 'l2', type: 'luxury', value: 2, name: 'Champagne', isDark: false },
    { id: 'l3', type: 'luxury', value: 3, name: 'Cuisine', isDark: false },
    { id: 'l4', type: 'luxury', value: 4, name: 'Casino', isDark: false },
    { id: 'l5', type: 'luxury', value: 5, name: 'Couture', isDark: false },
    { id: 'l6', type: 'luxury', value: 6, name: 'Vacances', isDark: false },
    { id: 'l7', type: 'luxury', value: 7, name: 'Beaux-Arts', isDark: false },
    { id: 'l8', type: 'luxury', value: 8, name: 'Joaillerie', isDark: false },
    { id: 'l9', type: 'luxury', value: 9, name: 'Dressage', isDark: false },
    { id: 'l10', type: 'luxury', value: 10, name: 'Grand Tour', isDark: false },
    { id: 'p1', type: 'prestige', value: 'x2', name: 'Prestige', isDark: true },
    { id: 'p2', type: 'prestige', value: 'x2', name: 'Prestige', isDark: true },
    { id: 'p3', type: 'prestige', value: 'x2', name: 'Prestige', isDark: true },
    { id: 'd1', type: 'disgrace', value: 'discard', name: 'Faux Pas! (Drop)', isDark: false },
    { id: 'd2', type: 'disgrace', value: '-5', name: 'Passé! (-5)', isDark: false },
    { id: 'd3', type: 'disgrace', value: '/2', name: 'Scandale! (/2)', isDark: true },
];

const sumArray = (arr) => arr.reduce((a, b) => a + b, 0);

function shuffle(array) {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

const getSubsets = (arr) => {
    let subsets = [[]];
    for (let el of arr) {
        const last = subsets.length;
        for (let i = 0; i < last; i++) {
            subsets.push([...subsets[i], el]);
        }
    }
    return subsets;
};

function calculateAIBid({ ai, deckLength, revealedCard, currentHighestBid, sumArray }) {
    const currentBidTotal = sumArray(ai.bid);
    const availableTotal = sumArray(ai.hand) + currentBidTotal;
    const isNegativeAuction = revealedCard.type === 'disgrace';

    let maxWillingness = 0;
    let negativeThreshold = 8;
    let negativeDropChance = 0.4;

    switch (ai.name) {
        case 'Oliver':
            if (isNegativeAuction) { maxWillingness = 12; negativeDropChance = 0.45; }
            else { maxWillingness = revealedCard.type === 'prestige' ? 14 : revealedCard.value * 1.3; }
            break;
        case 'Miles':
            if (isNegativeAuction) { maxWillingness = 15; negativeDropChance = 0.2; }
            else { maxWillingness = revealedCard.type === 'prestige' ? 25 : revealedCard.value * 2; }
            break;
        case 'Kirby 🐱':
            const roll = Math.random();
            if (isNegativeAuction) { maxWillingness = roll > 0.5 ? 20 : 5; negativeDropChance = roll > 0.5 ? 0.1 : 0.8; }
            else { maxWillingness = revealedCard.type === 'prestige' ? (roll > 0.5 ? 22 : 8) : (roll > 0.5 ? revealedCard.value * 2.5 : revealedCard.value); }
            break;
        case 'Pookie':
            if (isNegativeAuction) { maxWillingness = 18; negativeDropChance = 0.15; }
            else { maxWillingness = revealedCard.type === 'prestige' ? 16 : revealedCard.value * 1.4; }
            break;
        case 'Jimmy':
            if (isNegativeAuction) { maxWillingness = deckLength < 8 ? 20 : 10; negativeDropChance = deckLength < 8 ? 0.1 : 0.5; }
            else { maxWillingness = revealedCard.type === 'prestige' ? 18 : revealedCard.value * 1.5; }
            break;
        default:
            if (isNegativeAuction) { maxWillingness = 12; negativeDropChance = 0.4; }
            else { maxWillingness = revealedCard.type === 'prestige' ? 15 : revealedCard.value * 1.5; }
            break;
    }

    if (isNegativeAuction) {
        if (currentHighestBid > negativeThreshold && Math.random() < negativeDropChance) maxWillingness = 0;
    }

    if (availableTotal < 30 && ai.name !== 'Kirby 🐱') maxWillingness *= 0.6;

    let bestAdditionalCards = null;
    let lowestSufficientTotal = Infinity;

    const searchCombos = (idx, chosen, comboSum) => {
        if (idx === ai.hand.length) {
            const proposedTotal = currentBidTotal + comboSum;
            if (proposedTotal > currentHighestBid && proposedTotal <= maxWillingness) {
                if (proposedTotal < lowestSufficientTotal || (proposedTotal === lowestSufficientTotal && bestAdditionalCards && chosen.length < bestAdditionalCards.length)) {
                    lowestSufficientTotal = proposedTotal;
                    bestAdditionalCards = [...chosen];
                }
            }
            return;
        }
        if (currentBidTotal + comboSum <= maxWillingness) {
            chosen.push(ai.hand[idx]);
            searchCombos(idx + 1, chosen, comboSum + ai.hand[idx]);
            chosen.pop();
        }
        searchCombos(idx + 1, chosen, comboSum);
    };
    searchCombos(0, [], 0);

    if (isNegativeAuction && currentHighestBid === 0 && Math.random() < 0.2) bestAdditionalCards = null;

    return bestAdditionalCards;
}

function calculateFinalScores(players, sumFn) {
    let finalPlayers = players.map(p => ({ ...p, hand: [...p.hand, ...p.bid], bid: [], isEliminated: false }));

    let minMoney = Infinity;
    finalPlayers.forEach(p => { const money = sumFn(p.hand); if (money < minMoney) minMoney = money; });
    const allTiedMin = finalPlayers.length > 0 && finalPlayers.every(p => sumFn(p.hand) === minMoney);
    if (!allTiedMin) {
        finalPlayers.forEach(p => { if (sumFn(p.hand) === minMoney) p.isEliminated = true; });
    }

    finalPlayers.forEach(p => {
        if (p.isEliminated) { p.score = 0; return; }
        let baseScore = 0, multipliers = 0, divisors = 0;
        p.won.forEach(card => {
            if (card.type === 'luxury') baseScore += card.value;
            if (card.id === 'd2') baseScore -= 5;
            if (card.type === 'prestige') multipliers++;
            if (card.id === 'd3') divisors++;
        });
        for (let i = 0; i < multipliers; i++) baseScore *= 2;
        for (let i = 0; i < divisors; i++) baseScore = Math.ceil(baseScore / 2);
        p.score = baseScore;
    });

    finalPlayers.sort((a, b) => {
        if (a.isEliminated && !b.isEliminated) return 1;
        if (!a.isEliminated && b.isEliminated) return -1;
        if (a.score !== b.score) return b.score - a.score;
        return sumFn(b.hand) - sumFn(a.hand);
    });

    return { finalPlayers, minMoney };
}

function createInitialPlayers({ spectatorMode, playerName, selectedOpponents, MONEY_CARDS }) {
    const initialPlayers = [];
    let playerIndex = 0;

    if (!spectatorMode) {
        initialPlayers.push({ id: playerIndex++, name: playerName.trim() || 'You', isAI: false, hand: [...MONEY_CARDS], bid: [], won: [], passed: false, isEliminated: false, pendingDiscard: false });
    }

    const aiPlayers = selectedOpponents.map(name => ({ id: playerIndex++, name, isAI: true, hand: [...MONEY_CARDS], bid: [], won: [], passed: false, isEliminated: false, pendingDiscard: false }));
    initialPlayers.push(...aiPlayers);

    return initialPlayers;
}

function getNextTurn(players, currentTurn) {
    let next = (currentTurn + 1) % players.length;
    let safeGuard = 0;
    while (players[next].passed && safeGuard < players.length + 1) {
        next = (next + 1) % players.length;
        safeGuard++;
    }
    return next;
}

function resolveAuction({ players, winnerId, revealedCard, currentHighestBid }) {
    const isNegativeAuction = revealedCard.type === 'disgrace';
    const updatedPlayers = JSON.parse(JSON.stringify(players));
    let logs = [];

    const winner = updatedPlayers.find(p => p.id === winnerId) || updatedPlayers[winnerId];

    if (isNegativeAuction) {
        updatedPlayers.forEach(p => {
            if (p.id === winnerId) { p.won.push(revealedCard); p.hand = [...p.hand, ...p.bid]; p.bid = []; }
            else { p.bid = []; }
        });
        if (revealedCard.value === 'discard') {
            const luxuryCards = winner.won.filter(c => c.type === 'luxury');
            if (luxuryCards.length > 0) {
                luxuryCards.sort((a, b) => a.value - b.value);
                const lowest = luxuryCards[0];
                winner.won = winner.won.filter(c => c.id !== lowest.id);
                logs.push(`${winner.name} took Faux Pas and automatically discarded their lowest luxury: ${lowest.name}!`);
            } else {
                winner.pendingDiscard = true;
                logs.push(`${winner.name} took Faux Pas but had no Luxury cards. The next Luxury card they win will be discarded!`);
            }
        } else if (revealedCard.value === '-5') {
            logs.push(`${winner.name} took ${revealedCard.name} and saved their money! Others lost their bids.`);
        } else {
            logs.push(`${winner.name} took the negative card and saved their money! Others lost their bids.`);
        }
    } else {
        updatedPlayers.forEach(p => {
            if (p.id === winnerId) {
                if (p.pendingDiscard && revealedCard.type === 'luxury') {
                    p.pendingDiscard = false;
                    p.won.push(revealedCard);
                    winner.won = winner.won.filter(c => c.id !== revealedCard.id);
                    logs.push(`${winner.name} won ${revealedCard.name}, but it was immediately discarded due to their pending Faux Pas!`);
                } else {
                    p.won.push(revealedCard);
                    logs.push(`${winner.name} won ${revealedCard.name} for ${currentHighestBid}k!`);
                }
                p.bid = [];
            } else { p.hand = [...p.hand, ...p.bid]; p.bid = []; }
        });
    }

    return { updatedPlayers, logs };
}

function simulateSingleGame(selectedOpponents) {
    let players = createInitialPlayers({ spectatorMode: true, playerName: '', selectedOpponents, MONEY_CARDS });
    const deck = shuffle(INITIAL_DECK);
    let darkCardsDrawn = 0;
    let turn = Math.floor(Math.random() * players.length);

    while (deck.length > 0) {
        const card = deck.shift();
        if (card.isDark) {
            darkCardsDrawn++;
            if (darkCardsDrawn >= 4) break;
        }
        players = players.map(p => ({ ...p, passed: false, bid: [] }));
        let currentHighestBid = 0;

        while (true) {
            const current = players[turn];
            const additionalCards = current.hand.length > 0
                ? calculateAIBid({ ai: current, deckLength: deck.length, revealedCard: card, currentHighestBid, sumArray })
                : null;

            if (additionalCards && additionalCards.length > 0) {
                const newHand = [...current.hand];
                for (const c of additionalCards) {
                    const idx = newHand.indexOf(c);
                    if (idx > -1) newHand.splice(idx, 1);
                }
                const newBid = [...current.bid, ...additionalCards];
                players[turn] = { ...current, hand: newHand, bid: newBid };
                currentHighestBid = sumArray(newBid);
                turn = getNextTurn(players, turn);
            } else {
                players[turn] = { ...current, passed: true };
                if (card.type === 'disgrace') {
                    ({ updatedPlayers: players } = resolveAuction({ players, winnerId: current.id, revealedCard: card, currentHighestBid }));
                    break;
                }
                const active = players.filter(p => !p.passed);
                if (active.length === 1) {
                    const winnerId = active[0].id;
                    ({ updatedPlayers: players } = resolveAuction({ players, winnerId, revealedCard: card, currentHighestBid }));
                    turn = players.findIndex(p => p.id === winnerId);
                    if (turn === -1) turn = 0;
                    break;
                }
                if (active.length === 0) {
                    turn = (turn + 1) % players.length;
                    break;
                }
                turn = getNextTurn(players, turn);
            }
        }
    }

    return calculateFinalScores(players, sumArray);
}

// Support Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MONEY_CARDS, INITIAL_DECK, sumArray, shuffle, getSubsets, calculateAIBid, calculateFinalScores, createInitialPlayers, getNextTurn, resolveAuction, simulateSingleGame };
}
