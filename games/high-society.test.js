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
    calculateAIBid
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

    // Oliver max willingness for prestige is 10. If current is 12, he passes
    let bid = calculateAIBid({
        ai: mockAI,
        deckLength: 10,
        revealedCard: prestigeCard,
        currentHighestBid: 12,
        sumArray
    });

    assert.strictEqual(bid, null, "Oliver should drop out if the bid exceeds 10 for prestige");
});
