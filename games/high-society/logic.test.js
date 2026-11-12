const test = require('node:test');
const assert = require('node:assert');

const {
    sumArray,
    shuffle,
    calculateAIBid,
    calculateFinalScores,
    createInitialPlayers,
    getNextTurn,
    resolveAuction,
    simulateSingleGame
} = require('./js/logic.js');

test('sumArray', () => {
    assert.strictEqual(sumArray([]), 0, 'Empty array should sum to 0');
    assert.strictEqual(sumArray([1, 2, 3]), 6, 'Should sum positive numbers');
    assert.strictEqual(sumArray([-1, 1]), 0, 'Should handle negative numbers');
});

test('shuffle correctly randomizes array without losing elements', () => {
    const original = Array.from({ length: 100 }, (_, i) => i);
    const shuffled = shuffle(original);

    assert.strictEqual(shuffled.length, original.length, 'Length should be same');
    assert.notDeepStrictEqual(shuffled, original, 'Array should be shuffled');
    assert.deepStrictEqual([...shuffled].sort((a, b) => a - b), [...original].sort((a, b) => a - b), 'Should contain same elements');
});

test('calculateAIBid: High Roller (Miles) avoids negatives but pays heavy for prestiges', () => {
    const mockAI = {
        name: 'Miles',
        hand: [1, 2, 3, 4, 6, 8, 10, 12, 15, 20, 25],
        bid: []
    };
    const prestigeCard = { type: 'prestige', value: 'x2', name: 'Prestige', isDark: true };
    const disgraceCard = { type: 'disgrace', value: '-5', name: 'Passé! (-5)', isDark: false };

    let bid = calculateAIBid({
        ai: mockAI,
        deckLength: 10,
        revealedCard: prestigeCard,
        currentHighestBid: 5,
        sumArray
    });

    assert.ok(bid !== null, "Miles should bid on a prestige card");
    assert.ok(sumArray(bid) > 5, "Miles bid must strictly beat currentHighestBid");

    bid = calculateAIBid({
        ai: mockAI,
        deckLength: 10,
        revealedCard: disgraceCard,
        currentHighestBid: 2,
        sumArray
    });
    assert.ok(bid !== null, "Miles generally avoids disgrace by bidding over small thresholds");
});

test('calculateAIBid: Penny Pincher (Oliver) passes early on prestige', () => {
    const mockAI = {
        name: 'Oliver',
        hand: [1, 2, 5, 10, 12],
        bid: []
    };
    const prestigeCard = { type: 'prestige', value: 'x2', name: 'Prestige', isDark: true };

    const bid = calculateAIBid({
        ai: mockAI,
        deckLength: 10,
        revealedCard: prestigeCard,
        currentHighestBid: 15,
        sumArray
    });

    assert.strictEqual(bid, null, "Oliver should drop out if the bid exceeds 14 for prestige");
});

test('calculateFinalScores: Accurately eliminates lowest money player, calculates base scores, and handles multipliers/divisors', () => {
    const p1 = {
        name: 'Poor Player',
        hand: [1],
        bid: [],
        won: [{ type: 'luxury', value: 10 }]
    };

    const p2 = {
        name: 'Passé Player',
        hand: [2, 3],
        bid: [],
        won: [
            { type: 'luxury', value: 20 },
            { id: 'd2', type: 'disgrace', value: '-5' }
        ]
    };

    const p3 = {
        name: 'Crypto Bro',
        hand: [10],
        bid: [],
        won: [
            { type: 'luxury', value: 15 },
            { type: 'prestige', value: 'x2' },
            { id: 'd3', type: 'disgrace', value: '/2' }
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

    assert.strictEqual(finalPlayers[0].name, 'Crypto Bro', 'Crypto Bro wins tie breaker based on remaining money');
    assert.strictEqual(finalPlayers[1].name, 'Passé Player', 'Passé Player is 2nd');
    assert.strictEqual(finalPlayers[2].name, 'Poor Player', 'Poor Player is last');
});

test('calculateFinalScores: does not eliminate everyone when all players tie on remaining money', () => {
    const players = [
        { name: 'Alice', hand: [10], bid: [], won: [{ type: 'luxury', value: 8 }] },
        { name: 'Bob', hand: [4, 6], bid: [], won: [{ type: 'luxury', value: 5 }] },
        { name: 'Charlie', hand: [10], bid: [], won: [{ type: 'luxury', value: 3 }] }
    ];
    const { finalPlayers } = calculateFinalScores(players, sumArray);
    assert.ok(finalPlayers.every(p => !p.isEliminated), 'Nobody should be eliminated when all players tie on money');
    assert.strictEqual(finalPlayers[0].name, 'Alice');
    assert.strictEqual(finalPlayers[0].score, 8);
});

test('createInitialPlayers: correctly sets up human and AI players', () => {
    const players = createInitialPlayers({
        spectatorMode: false,
        playerName: 'Alice',
        selectedOpponents: ['Bob', 'Charlie'],
        MONEY_CARDS: [1, 2]
    });

    assert.strictEqual(players.length, 3, 'Should create 3 players');
    assert.strictEqual(players[0].name, 'Alice', 'First player is human named Alice');
    assert.strictEqual(players[0].isAI, false, 'First player is not AI');
    assert.strictEqual(players[1].name, 'Bob', 'Second player is AI Bob');
    assert.strictEqual(players[1].isAI, true, 'Second player is AI');
});

test('getNextTurn: skips players who have passed', () => {
    const players = [
        { id: 0, passed: false },
        { id: 1, passed: true },
        { id: 2, passed: false }
    ];

    const nextTurn = getNextTurn(players, 0);
    assert.strictEqual(nextTurn, 2, 'Should skip player 1 because they passed');
});

test('resolveAuction: correctly handles luxury auction winner even when player IDs are reordered', () => {
    const players = [
        { id: 10, name: 'Bob', hand: [5], bid: [8], won: [] },
        { id: 20, name: 'Alice', hand: [5], bid: [10], won: [] }
    ];

    const card = { type: 'luxury', value: 5, name: 'Jewels' };

    const { updatedPlayers, logs } = resolveAuction({
        players,
        winnerId: 20,
        revealedCard: card,
        currentHighestBid: 10
    });

    assert.strictEqual(updatedPlayers[1].won.length, 1, 'Winner gets the card');
    assert.strictEqual(updatedPlayers[1].bid.length, 0, 'Winner bid is cleared');
    assert.strictEqual(updatedPlayers[1].hand.length, 1, 'Winner hand is unchanged (spent 10)');
    assert.ok(logs[0].includes('Alice'), 'Log records actual winner name by id');

    assert.strictEqual(updatedPlayers[0].hand.length, 2, 'Loser gets their bid back into hand');
    assert.strictEqual(updatedPlayers[0].bid.length, 0, 'Loser bid is cleared');
});

test('simulateSingleGame: completes full games cleanly across bot counts', () => {
    for (let i = 0; i < 25; i++) {
        const { finalPlayers, minMoney } = simulateSingleGame(['Miles', 'Oliver', 'Claire', 'Chester']);
        assert.strictEqual(finalPlayers.length, 4);
        assert.ok(finalPlayers[0], 'Should produce a sorted winner at index 0');
        assert.strictEqual(typeof minMoney, 'number');
    }
});
