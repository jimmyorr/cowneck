const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const {
    createDeck,
    shuffle,
    getMaxRounds,
    getCardDisplay,
    isValidPlay,
    determineTrickWinner,
    runFullGameSync
} = require('./wizard-logic.js');

test('createDeck creates 60 cards with Aces high (value 14 > King 13)', () => {
    const deck = createDeck();
    assert.strictEqual(deck.length, 60, 'Wizard deck must have 60 cards');

    const wizards = deck.filter(c => c.type === 'wizard');
    const jesters = deck.filter(c => c.type === 'jester');
    const normals = deck.filter(c => c.type === 'normal');
    assert.strictEqual(wizards.length, 4);
    assert.strictEqual(jesters.length, 4);
    assert.strictEqual(normals.length, 52);

    const spadeAce = normals.find(c => c.suit === 'Spades' && getCardDisplay(c) === 'A');
    const spadeKing = normals.find(c => c.suit === 'Spades' && getCardDisplay(c) === 'K');
    const spadeTwo = normals.find(c => c.suit === 'Spades' && getCardDisplay(c) === 2);
    assert.ok(spadeAce && spadeKing && spadeTwo);
    assert.strictEqual(spadeAce.value, 14, 'Ace must be value 14');
    assert.strictEqual(spadeKing.value, 13, 'King must be value 13');
    assert.strictEqual(spadeTwo.value, 2, 'Two must be value 2');
    assert.ok(spadeAce.value > spadeKing.value, 'Ace must beat King');
});

test('shuffle preserves all 60 cards cleanly', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    assert.strictEqual(shuffled.length, 60);
    const key = c => `${c.type}:${c.suit}:${c.value}`;
    assert.deepStrictEqual(
        shuffled.map(key).sort(),
        deck.map(key).sort()
    );
});

test('getMaxRounds matches official Wizard round counts (60 / players)', () => {
    assert.strictEqual(getMaxRounds(3), 20);
    assert.strictEqual(getMaxRounds(4), 15);
    assert.strictEqual(getMaxRounds(5), 12);
    assert.strictEqual(getMaxRounds(6), 10);
});

test('determineTrickWinner: Ace beats King of led suit', () => {
    const trick = [
        { pIdx: 0, card: { type: 'normal', suit: 'Hearts', value: 13 } },
        { pIdx: 1, card: { type: 'normal', suit: 'Hearts', value: 14 } },
        { pIdx: 2, card: { type: 'normal', suit: 'Hearts', value: 10 } }
    ];
    assert.strictEqual(determineTrickWinner(trick, 'Clubs'), 1);
});

test('determineTrickWinner: Jester-led trick uses first normal card as led suit and cannot be won by off-suit cards', () => {
    const trick = [
        { pIdx: 0, card: { type: 'jester', suit: 'None', value: 0 } },
        { pIdx: 1, card: { type: 'normal', suit: 'Diamonds', value: 7 } },
        { pIdx: 2, card: { type: 'normal', suit: 'Spades', value: 14 } }, // off-suit when Clubs is trump
        { pIdx: 3, card: { type: 'normal', suit: 'Diamonds', value: 10 } }
    ];
    assert.strictEqual(
        determineTrickWinner(trick, 'Clubs'),
        3,
        '10 of Diamonds beats 7 of Diamonds while off-suit Ace of Spades cannot win'
    );
});

test('determineTrickWinner: All-Jester trick is won by first Jester played', () => {
    const trick = [
        { pIdx: 2, card: { type: 'jester', suit: 'None', value: 0 } },
        { pIdx: 3, card: { type: 'jester', suit: 'None', value: 0 } },
        { pIdx: 0, card: { type: 'jester', suit: 'None', value: 0 } }
    ];
    assert.strictEqual(determineTrickWinner(trick, 'Spades'), 2);
});

test('determineTrickWinner: First Wizard played wins even over later Wizards and trump', () => {
    const trick = [
        { pIdx: 0, card: { type: 'normal', suit: 'Spades', value: 14 } },
        { pIdx: 1, card: { type: 'wizard', suit: 'None', value: 15 } },
        { pIdx: 2, card: { type: 'wizard', suit: 'None', value: 15 } }
    ];
    assert.strictEqual(determineTrickWinner(trick, 'Spades'), 1);
});

test('isValidPlay enforces following suit while allowing Wizards and Jesters anytime', () => {
    const hand = [
        { type: 'normal', suit: 'Hearts', value: 5 },
        { type: 'normal', suit: 'Spades', value: 9 },
        { type: 'wizard', suit: 'None', value: 15 },
        { type: 'jester', suit: 'None', value: 0 }
    ];
    assert.strictEqual(isValidPlay(hand[0], hand, 'Hearts'), true, 'Following Hearts is valid');
    assert.strictEqual(isValidPlay(hand[1], hand, 'Hearts'), false, 'Playing off-suit Spades while holding Hearts is invalid');
    assert.strictEqual(isValidPlay(hand[2], hand, 'Hearts'), true, 'Wizard is always valid');
    assert.strictEqual(isValidPlay(hand[3], hand, 'Hearts'), true, 'Jester is always valid');
    assert.strictEqual(isValidPlay(hand[1], hand, 'Wizard'), true, 'Any card is valid when a Wizard led');
    assert.strictEqual(isValidPlay(hand[1], hand, 'None'), true, 'Any card is valid when no suit is led yet');
});

test('runFullGameSync completes full multi-round games for 3, 4, 5, and 6 players', () => {
    const groups = [
        ['Oliver', 'Miles', 'Kirby 🐱'],
        ['Oliver', 'Miles', 'Kirby 🐱', 'Pookie'],
        ['Oliver', 'Miles', 'Kirby 🐱', 'Pookie', 'Jimmy'],
        ['Oliver', 'Miles', 'Kirby 🐱', 'Pookie', 'Jimmy', 'Leon 😼']
    ];
    for (const names of groups) {
        const simPlayers = names.map((name, id) => ({ id, name, isHuman: false, score: 0, bid: 0, tricks: 0, hand: [] }));
        const result = runFullGameSync(simPlayers);
        assert.strictEqual(result.length, names.length);
        for (const p of result) {
            assert.strictEqual(typeof p.score, 'number');
            assert.ok(!Number.isNaN(p.score));
            assert.strictEqual(p.hand.length, 0, 'All cards played by end of final round');
        }
    }
});

test('All Babel HTML pages pin @babel/standalone@7.29.14', () => {
    const gamesDir = __dirname;
    const htmlFiles = [
        path.join(gamesDir, 'wizard.html'),
        path.join(gamesDir, 'astro-paws.html'),
        path.join(gamesDir, 'hacker_sim.html'),
        path.join(gamesDir, 'headline_hijack.html'),
        path.join(gamesDir, 'high-flyers.html'),
        path.join(gamesDir, 'nonaga.html'),
        path.join(gamesDir, 'react_template.html'),
        path.join(gamesDir, 'high-society', 'index.html')
    ];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        assert.ok(
            !content.includes('unpkg.com/@babel/standalone/babel.min.js'),
            `${path.relative(gamesDir, file)} must not use unpinned @babel/standalone`
        );
        assert.ok(
            content.includes('@babel/standalone@7.29.14/babel.min.js'),
            `${path.relative(gamesDir, file)} must pin @babel/standalone@7.29.14`
        );
    }
});
