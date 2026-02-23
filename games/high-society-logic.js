// --- GAME CONSTANTS ---
const MONEY_CARDS = [1, 2, 3, 4, 5, 8, 10, 12, 15, 20, 25];

const INITIAL_DECK = [
    { id: 'l1', type: 'luxury', value: 1, name: 'Luxury 1', isDark: false },
    { id: 'l2', type: 'luxury', value: 2, name: 'Luxury 2', isDark: false },
    { id: 'l3', type: 'luxury', value: 3, name: 'Luxury 3', isDark: false },
    { id: 'l4', type: 'luxury', value: 4, name: 'Luxury 4', isDark: false },
    { id: 'l5', type: 'luxury', value: 5, name: 'Luxury 5', isDark: false },
    { id: 'l6', type: 'luxury', value: 6, name: 'Luxury 6', isDark: false },
    { id: 'l7', type: 'luxury', value: 7, name: 'Luxury 7', isDark: false },
    { id: 'l8', type: 'luxury', value: 8, name: 'Luxury 8', isDark: false },
    { id: 'l9', type: 'luxury', value: 9, name: 'Luxury 9', isDark: false },
    { id: 'l10', type: 'luxury', value: 10, name: 'Luxury 10', isDark: false },
    { id: 'p1', type: 'prestige', value: 'x2', name: 'Award (x2)', isDark: true },
    { id: 'p2', type: 'prestige', value: 'x2', name: 'Award (x2)', isDark: true },
    { id: 'p3', type: 'prestige', value: 'x2', name: 'Award (x2)', isDark: true },
    { id: 'd1', type: 'disgrace', value: 'discard', name: 'Faux Pas (Drop)', isDark: false },
    { id: 'd2', type: 'disgrace', value: '-5', name: 'Passé (-5)', isDark: false },
    { id: 'd3', type: 'disgrace', value: '/2', name: 'Scandale (/2)', isDark: true },
];

const sumArray = (arr) => arr.reduce((a, b) => a + b, 0);

// Helper to shuffle array
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

// Extracted AI logic for easier testing
function calculateAIBid({ ai, deckLength, revealedCard, currentHighestBid, sumArray }) {
    const currentBidTotal = sumArray(ai.bid);
    const availableTotal = sumArray(ai.hand) + currentBidTotal;
    const isNegativeAuction = revealedCard.type === 'disgrace';

    // Heuristics for max willingness to pay based on personality
    let maxWillingness = 0;
    let negativeThreshold = 8;
    let negativeDropChance = 0.4;

    if (ai.name === 'Oliver') { // Penny Pincher
        if (isNegativeAuction) {
            maxWillingness = 8;
            negativeDropChance = 0.7;
        } else {
            if (revealedCard.type === 'prestige') maxWillingness = 10;
            else maxWillingness = revealedCard.value;
        }
    } else if (ai.name === 'Miles') { // High Roller
        if (isNegativeAuction) {
            maxWillingness = 15;
            negativeDropChance = 0.2;
        } else {
            if (revealedCard.type === 'prestige') maxWillingness = 25;
            else maxWillingness = revealedCard.value * 2;
        }
    } else if (ai.name === 'Kirby 🐱') { // Unpredictable
        const roll = Math.random();
        if (isNegativeAuction) {
            maxWillingness = roll > 0.5 ? 20 : 5;
            negativeDropChance = roll > 0.5 ? 0.1 : 0.8;
        } else {
            if (revealedCard.type === 'prestige') maxWillingness = roll > 0.5 ? 22 : 8;
            else maxWillingness = roll > 0.5 ? revealedCard.value * 2.5 : revealedCard.value;
        }
    } else if (ai.name === 'Pookie') { // Averse to negatives
        if (isNegativeAuction) {
            maxWillingness = 25;
            negativeDropChance = 0.05;
        } else {
            if (revealedCard.type === 'prestige') maxWillingness = 12;
            else maxWillingness = revealedCard.value * 1.2;
        }
    } else if (ai.name === 'Jimmy') { // Balanced/Aggressive Late
        if (isNegativeAuction) {
            maxWillingness = deckLength < 8 ? 20 : 10;
            negativeDropChance = deckLength < 8 ? 0.1 : 0.5;
        } else {
            if (revealedCard.type === 'prestige') maxWillingness = 18;
            else maxWillingness = revealedCard.value * 1.5;
        }
    } else { // default
        if (isNegativeAuction) {
            maxWillingness = 12;
            negativeDropChance = 0.4;
        } else {
            if (revealedCard.type === 'prestige') maxWillingness = 15;
            else maxWillingness = revealedCard.value * 1.5;
        }
    }

    if (isNegativeAuction) {
        if (currentHighestBid > negativeThreshold && Math.random() < negativeDropChance) maxWillingness = 0;
    }

    if (availableTotal < 30 && ai.name !== 'Kirby 🐱') maxWillingness *= 0.6;

    let bestAdditionalCards = null;
    let lowestSufficientTotal = Infinity;

    const allCombinations = getSubsets(ai.hand);

    for (const combo of allCombinations) {
        const proposedTotal = currentBidTotal + sumArray(combo);
        if (proposedTotal > currentHighestBid && proposedTotal <= maxWillingness && proposedTotal < lowestSufficientTotal) {
            lowestSufficientTotal = proposedTotal;
            bestAdditionalCards = combo;
        }
    }

    if (isNegativeAuction && currentHighestBid === 0 && Math.random() < 0.2) {
        bestAdditionalCards = null;
    }

    return bestAdditionalCards;
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
