const test = require('node:test');
const assert = require('node:assert');
const {
    SUPPLY_ORDER,
    createCardInstance,
    DonutEngine,
    chooseBestGainOrBuy,
    simulateAIGame
} = require('./donut-chef-logic.js');

test('DonutEngine initializes 2 players with 10-card starting decks (7 Flour, 3 Donut holes)', () => {
    const engine = new DonutEngine();
    engine.reset('human');
    assert.strictEqual(engine.players.length, 2);
    for (const p of engine.players) {
        assert.strictEqual(p.hand.length, 5);
        assert.strictEqual(p.deck.length, 5);
        assert.strictEqual(p.getAllCards().length, 10);
        assert.strictEqual(p.getScore(), 3);
    }
    assert.strictEqual(SUPPLY_ORDER.length, 16);
});

test('Late night (kings_court) moves chosen action card by UID out of hand and plays it 3 times', async () => {
    const engine = new DonutEngine();
    engine.reset('human');
    const p = engine.players[0];

    const kc = createCardInstance('kings_court');
    const smithy = createCardInstance('smithy');
    p.hand = [kc, smithy];
    p.deck = Array.from({ length: 10 }, () => createCardInstance('flour'));
    p.discard = [];
    p.playArea = [];
    p.actions = 1;
    engine.turnPhase = 'action';

    const controller = {
        async selectCardsFromHand(_player, opts) {
            assert.strictEqual(opts.reason, 'kings_court_target');
            return [smithy];
        },
        async selectCardToGain() {
            return null;
        }
    };

    const played = await engine.playActionCard(p, kc, controller);
    assert.strictEqual(played, true);
    // Both Late night and Crate must be in playArea, NOT stuck in hand!
    assert.strictEqual(p.playArea.length, 2);
    assert.ok(p.playArea.some((c) => c.uid === kc.uid));
    assert.ok(p.playArea.some((c) => c.uid === smithy.uid));
    assert.ok(!p.hand.some((c) => c.uid === smithy.uid), 'Chosen card must leave hand by UID');
    // Crate drew 3 cards × 3 = 9 cards from the 10-card deck
    assert.strictEqual(p.hand.length, 9);
    assert.strictEqual(p.deck.length, 1);
});

test('Chained Late night -> Late night -> Shop sign resolves 9 plays without duplicating cards', async () => {
    const engine = new DonutEngine();
    engine.reset('human');
    const p = engine.players[0];

    const kc1 = createCardInstance('kings_court');
    const kc2 = createCardInstance('kings_court');
    const market = createCardInstance('market');
    const festival = createCardInstance('festival');
    p.hand = [kc1, kc2, market, festival];
    p.deck = Array.from({ length: 12 }, () => createCardInstance('flour'));
    p.discard = [];
    p.playArea = [];
    p.actions = 1;
    p.buys = 1;
    p.coins = 0;
    engine.turnPhase = 'action';

    const controller = {
        async selectCardsFromHand(_player, opts) {
            // First pick kc2, then market, then festival, then skip on 3rd repetition
            return opts.candidates.length > 0 ? [opts.candidates[0]] : [];
        },
        async selectCardToGain() {
            return null;
        }
    };

    await engine.playActionCard(p, kc1, controller);
    // All 4 action cards moved cleanly into playArea; total cards conserved (4 + 12 = 16)
    assert.strictEqual(p.playArea.length, 4);
    assert.strictEqual(p.getAllCards().length, 16);
    // Market played 3× (+3 buys, +3 coins) + Festival played 3× (+3 buys, +6 coins)
    assert.strictEqual(p.buys, 1 + 3 + 3);
    assert.strictEqual(p.coins, 3 + 6);
});

test('Tie-breaking awards win to fewer turns taken, or declares shared tie on equal turns', () => {
    const engine = new DonutEngine();
    engine.reset('human');
    // Both start at 3 VP; P1 took 12 turns, P2 took 11 turns -> P2 wins tie-breaker
    engine.players[0].turnsTaken = 12;
    engine.players[1].turnsTaken = 11;
    const res1 = engine.finishGame();
    assert.strictEqual(res1.isTie, false);
    assert.strictEqual(res1.winner.name, engine.players[1].name);

    // Equal score and equal turns -> true tie
    const engine2 = new DonutEngine();
    engine2.reset('human');
    engine2.players[0].turnsTaken = 12;
    engine2.players[1].turnsTaken = 12;
    const res2 = engine2.finishGame();
    assert.strictEqual(res2.isTie, true);
    assert.strictEqual(res2.winner, null);
});

test('AI never buys 0-cost Flour and simulated AI games finish cleanly within turn cap', async () => {
    const engine = new DonutEngine();
    engine.reset('ai');
    const p = engine.players[0];
    assert.strictEqual(chooseBestGainOrBuy(engine, p, 0, false), null);
    assert.strictEqual(chooseBestGainOrBuy(engine, p, 1, false), null);

    for (let i = 0; i < 15; i++) {
        const finished = await simulateAIGame(150);
        assert.strictEqual(finished.isGameOver, true);
        assert.ok(finished.turnCount < 150, `Expected AI game to finish before 150 turns, took ${finished.turnCount}`);
        assert.ok(finished.gameResult.standings[0].score >= 6);
    }
});
