const test = require('node:test');
const assert = require('node:assert');

// Mock out browser variables that high-society.js expects
global.React = {
    useState: () => [null, () => { }],
    useEffect: () => { },
    useRef: () => ({ current: null })
};
global.window = {};

const {
    MONEY_CARDS,
    INITIAL_DECK,
    sumArray,
    shuffle,
    getSubsets,
    calculateAIBid,
    calculateFinalScores
} = require('./high-society-logic.js');

test('sumArray', (t) => {
    assert.strictEqual(sumArray([]), 0, 'Empty array should sum to 0');
    assert.strictEqual(sumArray([1, 2, 3]), 6, 'Should sum positive numbers');
    assert.strictEqual(sumArray([-1, 1]), 0, 'Should handle negative numbers');
});

test('shuffle correctly randomizes array without losing elements', (t) => {
    const original = Array.from({ length: 100 }, (_, i) => i);
    const shuffled = shuffle(original);

    assert.strictEqual(shuffled.length, original.length, 'Length should be same');
    assert.notDeepStrictEqual(shuffled, original, 'Array should be shuffled');
    assert.deepStrictEqual([...shuffled].sort((a, b) => a - b), [...original].sort((a, b) => a - b), 'Should contain same elements');
});

test('calculateAIBid: High Roller (Miles) avoids negatives but pays heavy for prestiges', (t) => {
    const mockAI = {
        name: 'Miles',
        hand: [1, 5, 10],
        bid: []
    };
    const prestigeCard = { type: 'prestige', value: 'x2', name: 'Award (x2)', isDark: true };
    const disgraceCard = { type: 'disgrace', value: '-5', name: 'Passé (-5)', isDark: false };

    // Test on prestige card, current bid 5, he should bid over
    let bid = calculateAIBid({
        ai: mockAI,
        deckLength: 10,
        revealedCard: prestigeCard,
        currentHighestBid: 5,
        sumArray
    });

    // Can bid up to 25 according to his rules
    assert.ok(bid !== null, "Miles should bid on a prestige card");
    assert.ok(sumArray(bid) > 5, "Miles bid must strictly beat currentHighestBid");

    // Test on disgrace card, he might drop, or try to avoid
    bid = calculateAIBid({
        ai: mockAI,
        deckLength: 10,
        revealedCard: disgraceCard,
        currentHighestBid: 2,
        sumArray
    });
    assert.ok(bid !== null, "Miles generally avoids disgrace by bidding over small thresholds");
});

test('calculateAIBid: Penny Pincher (Oliver) passes early on prestige', (t) => {
    const mockAI = {
        name: 'Oliver',
        hand: [1, 2, 5, 10, 12],
        bid: []
    };
    const prestigeCard = { type: 'prestige', value: 'x2', name: 'Award (x2)', isDark: true };

    // Oliver max willingness for prestige is 14. If current is 15, he passes
    let bid = calculateAIBid({
        ai: mockAI,
        deckLength: 10,
        revealedCard: prestigeCard,
        currentHighestBid: 15,
        sumArray
    });

    assert.strictEqual(bid, null, "Oliver should drop out if the bid exceeds 14 for prestige");
});

test('calculateFinalScores: Accurately eliminates lowest money player, calculates base scores, and handles multipliers/divisors', (t) => {
    // Player 1: Has lowest money -> gets eliminated, score 0
    const p1 = {
        name: 'Poor Player',
        hand: [1], // Total 1
        bid: [],
        won: [{ type: 'luxury', value: 10 }]
    };

    // Player 2: Middle money -> gets base score minus 5 for passed card
    const p2 = {
        name: 'Passé Player',
        hand: [2, 3], // Total 5
        bid: [],
        won: [
            { type: 'luxury', value: 20 },
            { id: 'd2', type: 'disgrace', value: '-5' }
        ]
    };

    // Player 3: High money -> gets a multiplier and a divisor
    const p3 = {
        name: 'Crypto Bro',
        hand: [10], // Total 10
        bid: [],
        won: [
            { type: 'luxury', value: 15 },
            { type: 'prestige', value: 'x2' }, // x2
            { id: 'd3', type: 'disgrace', value: '/2' } // Divide by 2
        ]
    };

    const players = [p1, p2, p3];
    const { finalPlayers, minMoney } = calculateFinalScores(players, sumArray);

    assert.strictEqual(minMoney, 1, "The lowest money calculation should be 1");

    const finalP1 = finalPlayers.find(p => p.name === 'Poor Player');
    assert.ok(finalP1.isEliminated, "Player 1 should be eliminated");
    assert.strictEqual(finalP1.score, 0, "Eliminated players score 0");

    const finalP2 = finalPlayers.find(p => p.name === 'Passé Player');
    assert.ok(!finalP2.isEliminated, "Player 2 survives");
    assert.strictEqual(finalP2.score, 15, "Player 2 score should be 20 minus 5 = 15");

    const finalP3 = finalPlayers.find(p => p.name === 'Crypto Bro');
    assert.ok(!finalP3.isEliminated, "Player 3 survives");
    assert.strictEqual(finalP3.score, 15, "Player 3 score is Math.ceil((15 * 2) / 2) = 15");

    // finalPlayers array should be sorted by score descending, then money descending.
    // p2 and p3 both have score 15. p3 has 10 money, p2 has 5 money. p3 should be first.
    assert.strictEqual(finalPlayers[0].name, 'Crypto Bro', 'Crypto Bro wins tie breaker based on remaining money');
    assert.strictEqual(finalPlayers[1].name, 'Passé Player', 'Passé Player is 2nd');
    assert.strictEqual(finalPlayers[2].name, 'Poor Player', 'Poor Player is last');
});
