// --- Donut Chef Pure Game Logic & AI ---
(function (root) {
    'use strict';

    const CARD_TYPES = {
        INGREDIENT: 'ingredient',
        VICTORY: 'victory',
        ACTION: 'action'
    };

    const CARDS = {
        // Ingredients (Treasures)
        flour: {
            id: 'flour',
            name: 'Flour',
            emoji: '🥡',
            type: [CARD_TYPES.INGREDIENT],
            cost: 0,
            coins: 1,
            shortText: '+1 coin',
            text: '+1 coin when played.'
        },
        sugar: {
            id: 'sugar',
            name: 'Sugar',
            emoji: '🍬',
            type: [CARD_TYPES.INGREDIENT],
            cost: 3,
            coins: 2,
            shortText: '+2 coins',
            text: '+2 coins when played.'
        },
        lard: {
            id: 'lard',
            name: 'Lard',
            emoji: '🥓',
            type: [CARD_TYPES.INGREDIENT],
            cost: 6,
            coins: 3,
            shortText: '+3 coins',
            text: '+3 coins when played.'
        },

        // Victory recipes
        donut_hole: {
            id: 'donut_hole',
            name: 'Donut hole',
            emoji: '🥯',
            type: [CARD_TYPES.VICTORY],
            cost: 2,
            points: 1,
            shortText: '1 point',
            text: 'Worth 1 victory point at game end.'
        },
        donut: {
            id: 'donut',
            name: 'Donut',
            emoji: '🍩',
            type: [CARD_TYPES.VICTORY],
            cost: 5,
            points: 3,
            shortText: '3 points',
            text: 'Worth 3 victory points at game end.'
        },
        premium_donut: {
            id: 'premium_donut',
            name: 'Premium donut',
            emoji: '👑🍩',
            type: [CARD_TYPES.VICTORY],
            cost: 8,
            points: 6,
            shortText: '6 points',
            text: 'Worth 6 victory points at game end. Game ends if this pile empties.'
        },

        // Actions
        cellar: {
            id: 'cellar',
            name: 'Clear crumbs',
            emoji: '🧹',
            type: [CARD_TYPES.ACTION],
            cost: 2,
            actions: 1,
            shortText: '+1 action • cycle cards',
            text: '+1 action. Discard any number of cards, then draw that many.',
            onPlay: async (engine, player, controller) => {
                if (player.hand.length === 0) return;
                const chosen = await controller.selectCardsFromHand(player, {
                    min: 0,
                    max: player.hand.length,
                    reason: 'cellar_discard',
                    title: 'Clear crumbs',
                    message: 'Choose any number of cards to discard and replace',
                    confirmLabel: 'Discard & draw'
                });
                if (!chosen || chosen.length === 0) return;
                engine.discardCards(player, chosen);
                engine.drawCards(player, chosen.length);
                engine.notify();
            }
        },
        chapel: {
            id: 'chapel',
            name: 'Clean sweep',
            emoji: '🧼',
            type: [CARD_TYPES.ACTION],
            cost: 2,
            shortText: 'Trash up to 4 cards',
            text: 'Trash up to 4 cards from your hand permanently.',
            onPlay: async (engine, player, controller) => {
                if (player.hand.length === 0) return;
                const chosen = await controller.selectCardsFromHand(player, {
                    min: 0,
                    max: Math.min(4, player.hand.length),
                    reason: 'chapel_trash',
                    title: 'Clean sweep',
                    message: 'Choose up to 4 cards from your hand to trash',
                    confirmLabel: 'Trash selected'
                });
                if (!chosen || chosen.length === 0) return;
                engine.trashCards(player, chosen);
            }
        },
        oasis: {
            id: 'oasis',
            name: 'Sweet deal',
            emoji: '🌴',
            type: [CARD_TYPES.ACTION],
            cost: 3,
            cards: 1,
            actions: 1,
            coins: 1,
            shortText: '+1 card, +1 act, +1 coin • disc 1',
            text: '+1 card, +1 action, +1 coin. Discard 1 card from your hand.',
            onPlay: async (engine, player, controller) => {
                if (player.hand.length === 0) return;
                const chosen = await controller.selectCardsFromHand(player, {
                    min: 1,
                    max: 1,
                    reason: 'oasis_discard',
                    title: 'Sweet deal',
                    message: 'Choose 1 card from your hand to discard',
                    confirmLabel: 'Discard card'
                });
                if (chosen && chosen.length > 0) {
                    engine.discardCards(player, chosen.slice(0, 1));
                }
            }
        },
        workshop: {
            id: 'workshop',
            name: 'Free sample',
            emoji: '🎁',
            type: [CARD_TYPES.ACTION],
            cost: 3,
            shortText: 'Gain card up to 4 cost',
            text: 'Gain a card from the supply costing up to 4 coins.',
            onPlay: async (engine, player, controller) => {
                const eligible = engine.getGainableCards(4);
                if (eligible.length === 0) return;
                const cardId = await controller.selectCardToGain(player, 4, {
                    reason: 'workshop_gain',
                    title: 'Free sample',
                    message: 'Choose a card costing up to 4 coins to gain'
                });
                if (cardId) engine.gainCard(player, cardId);
            }
        },
        smithy: {
            id: 'smithy',
            name: 'Crate',
            emoji: '📦',
            type: [CARD_TYPES.ACTION],
            cost: 4,
            cards: 3,
            shortText: '+3 cards',
            text: '+3 cards.'
        },
        festival: {
            id: 'festival',
            name: 'Stacked pots',
            emoji: '🥞',
            type: [CARD_TYPES.ACTION],
            cost: 5,
            actions: 2,
            buys: 1,
            coins: 2,
            shortText: '+2 actions, +1 buy, +2 coins',
            text: '+2 actions, +1 buy, +2 coins.'
        },
        laboratory: {
            id: 'laboratory',
            name: 'Recipe research',
            emoji: '🔬',
            type: [CARD_TYPES.ACTION],
            cost: 5,
            cards: 2,
            actions: 1,
            shortText: '+2 cards, +1 action',
            text: '+2 cards, +1 action.'
        },
        market: {
            id: 'market',
            name: 'Shop sign',
            emoji: '🏪',
            type: [CARD_TYPES.ACTION],
            cost: 5,
            cards: 1,
            actions: 1,
            buys: 1,
            coins: 1,
            shortText: '+1 card, +1 act, +1 buy, +1 coin',
            text: '+1 card, +1 action, +1 buy, +1 coin.'
        },
        kings_court: {
            id: 'kings_court',
            name: 'Late night',
            emoji: '🌙',
            type: [CARD_TYPES.ACTION],
            cost: 7,
            shortText: 'Play an action in hand 3×',
            text: 'You may choose an action card from your hand and play it three times.',
            onPlay: async (engine, player, controller) => {
                const actionCandidates = player.hand.filter((c) =>
                    CARDS[c.id].type.includes(CARD_TYPES.ACTION)
                );
                if (actionCandidates.length === 0) return;

                const chosenList = await controller.selectCardsFromHand(player, {
                    min: 0,
                    max: 1,
                    candidates: actionCandidates,
                    reason: 'kings_court_target',
                    title: 'Late night',
                    message: 'Choose an action card to play 3 times (or skip)',
                    confirmLabel: 'Play 3×'
                });
                if (!chosenList || chosenList.length === 0) return;

                const chosenCard = chosenList[0];
                // Move exact card instance by UID from hand to playArea so it cannot be re-selected or trashed from hand
                const moved = engine.moveCard(player.hand, player.playArea, chosenCard.uid);
                if (!moved) return;

                const cardDef = CARDS[chosenCard.id];
                engine.log(`${player.name} triples ${cardDef.name}!`);
                engine.notify();
                for (let i = 0; i < 3; i++) {
                    engine.applyBasicCardStats(player, cardDef);
                    engine.notify();
                    if (cardDef.onPlay) {
                        await cardDef.onPlay(engine, player, controller);
                    }
                }
            }
        },
        expand: {
            id: 'expand',
            name: 'Batter bargain',
            emoji: '🥣',
            type: [CARD_TYPES.ACTION],
            cost: 7,
            shortText: 'Trash 1 • gain up to +3 cost',
            text: 'Trash 1 card from your hand. Gain a card costing up to 3 coins more than it.',
            onPlay: async (engine, player, controller) => {
                if (player.hand.length === 0) return;
                const chosen = await controller.selectCardsFromHand(player, {
                    min: 1,
                    max: 1,
                    reason: 'expand_trash',
                    title: 'Batter bargain',
                    message: 'Choose 1 card from your hand to trash and upgrade',
                    confirmLabel: 'Trash & upgrade'
                });
                if (!chosen || chosen.length === 0) return;
                const target = chosen[0];
                const trashedDef = CARDS[target.id];
                engine.trashCards(player, [target]);
                const maxCost = trashedDef.cost + 3;
                const eligible = engine.getGainableCards(maxCost);
                if (eligible.length === 0) return;
                const gainId = await controller.selectCardToGain(player, maxCost, {
                    reason: 'expand_gain',
                    title: 'Batter bargain',
                    message: `Choose a card costing up to ${maxCost} coins to gain`
                });
                if (gainId) engine.gainCard(player, gainId);
            }
        }
    };

    const SUPPLY_ORDER = [
        'flour',
        'donut_hole',
        'cellar',
        'chapel',
        'sugar',
        'oasis',
        'workshop',
        'smithy',
        'donut',
        'festival',
        'laboratory',
        'market',
        'lard',
        'kings_court',
        'expand',
        'premium_donut'
    ];

    function createInitialSupply() {
        return {
            flour: 46,
            sugar: 40,
            lard: 30,
            donut_hole: 8,
            donut: 8,
            premium_donut: 8,
            cellar: 10,
            chapel: 10,
            oasis: 10,
            workshop: 10,
            smithy: 10,
            festival: 10,
            laboratory: 10,
            market: 10,
            kings_court: 10,
            expand: 10
        };
    }

    let nextUidCounter = 1;
    function createCardInstance(id) {
        const suffix = Math.random().toString(36).slice(2, 7);
        return { id, uid: `c_${nextUidCounter++}_${suffix}` };
    }

    class PlayerState {
        constructor(name, isAI) {
            this.name = name;
            this.isAI = Boolean(isAI);
            this.deck = [];
            this.hand = [];
            this.discard = [];
            this.playArea = [];
            this.actions = 1;
            this.buys = 1;
            this.coins = 0;
            this.turnsTaken = 0;
        }

        getAllCards() {
            return [...this.deck, ...this.hand, ...this.discard, ...this.playArea];
        }

        getScore() {
            let total = 0;
            const all = this.getAllCards();
            for (const c of all) {
                const def = CARDS[c.id];
                if (def && def.points) total += def.points;
            }
            return total;
        }

        getCardCounts() {
            const counts = {};
            for (const c of this.getAllCards()) {
                counts[c.id] = (counts[c.id] || 0) + 1;
            }
            return counts;
        }

        getHandIngredientCoins() {
            let sum = 0;
            for (const c of this.hand) {
                const def = CARDS[c.id];
                if (def.type.includes(CARD_TYPES.INGREDIENT)) {
                    sum += def.coins || 0;
                }
            }
            return sum;
        }
    }

    class DonutEngine {
        constructor(options = {}) {
            this.onLog = options.onLog || (() => {});
            this.onStateChange = options.onStateChange || (() => {});
            this.rng = options.rng || Math.random;
            this.reset('human');
        }

        reset(mode = 'human') {
            this.mode = mode;
            this.supply = createInitialSupply();
            this.trash = [];
            this.activePlayerIndex = 0;
            this.turnPhase = 'action';
            this.turnCount = 0;
            this.cardsBoughtThisTurn = 0;
            this.buyPhaseSnapshot = null;
            this.isGameOver = false;
            this.gameResult = null;

            if (mode === 'ai') {
                this.players = [
                    new PlayerState('Chef Glaze 🤖', true),
                    new PlayerState('Chef Sprinkles 🤖', true)
                ];
            } else {
                this.players = [
                    new PlayerState('You 🧑‍🍳', false),
                    new PlayerState('Donut Bot 🤖', true)
                ];
            }

            for (const p of this.players) {
                for (let i = 0; i < 7; i++) p.deck.push(createCardInstance('flour'));
                for (let i = 0; i < 3; i++) p.deck.push(createCardInstance('donut_hole'));
                this.shuffle(p.deck);
                this.drawCards(p, 5);
            }
        }

        log(msg) {
            this.onLog(msg);
        }

        notify() {
            this.onStateChange(this);
        }

        shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(this.rng() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        drawCards(player, count) {
            let drawn = 0;
            for (let i = 0; i < count; i++) {
                if (player.deck.length === 0) {
                    if (player.discard.length === 0) break;
                    player.deck = [...player.discard];
                    player.discard = [];
                    this.shuffle(player.deck);
                }
                player.hand.push(player.deck.pop());
                drawn++;
            }
            return drawn;
        }

        moveCard(fromArray, toArray, uid) {
            const idx = fromArray.findIndex((c) => c.uid === uid);
            if (idx === -1) return null;
            const [card] = fromArray.splice(idx, 1);
            if (toArray) toArray.push(card);
            return card;
        }

        getGainableCards(maxCost) {
            return SUPPLY_ORDER.filter(
                (key) => this.supply[key] > 0 && CARDS[key].cost <= maxCost
            );
        }

        hasPlayableActions(player) {
            if (!player || player.actions <= 0) return false;
            return player.hand.some((c) => CARDS[c.id].type.includes(CARD_TYPES.ACTION));
        }

        canPlayIngredients(player) {
            if (!player || this.isGameOver || this.cardsBoughtThisTurn > 0) return false;
            return player.hand.some((c) => CARDS[c.id].type.includes(CARD_TYPES.INGREDIENT));
        }

        enterBuyPhase(player, allowUndo = true) {
            if (this.isGameOver || !player) return;
            if (this.turnPhase === 'action') {
                if (allowUndo && this.hasPlayableActions(player)) {
                    this.buyPhaseSnapshot = {
                        playerIndex: this.activePlayerIndex,
                        actions: player.actions,
                        buys: player.buys,
                        coins: player.coins,
                        hand: [...player.hand],
                        playArea: [...player.playArea]
                    };
                } else {
                    this.buyPhaseSnapshot = null;
                }
                this.turnPhase = 'buy';
                player.actions = 0;
                this.notify();
            }
        }

        canUndoBuyPhase() {
            if (this.isGameOver || this.turnPhase !== 'buy' || this.cardsBoughtThisTurn > 0) {
                return false;
            }
            return (
                Boolean(this.buyPhaseSnapshot) &&
                this.buyPhaseSnapshot.playerIndex === this.activePlayerIndex &&
                this.buyPhaseSnapshot.actions > 0
            );
        }

        undoBuyPhase() {
            if (!this.canUndoBuyPhase()) return false;
            const snap = this.buyPhaseSnapshot;
            const p = this.players[this.activePlayerIndex];
            p.actions = snap.actions;
            p.buys = snap.buys;
            p.coins = snap.coins;
            p.hand = [...snap.hand];
            p.playArea = [...snap.playArea];
            this.turnPhase = 'action';
            this.buyPhaseSnapshot = null;
            this.log(`${p.name} returns to action phase`);
            this.notify();
            return true;
        }

        beginTurn() {
            if (this.isGameOver) return null;
            this.turnCount++;
            if (this.turnCount > 250) {
                this.log('--- Turn limit reached ---');
                return this.finishGame();
            }

            const p = this.players[this.activePlayerIndex];
            p.turnsTaken++;
            p.actions = 1;
            p.buys = 1;
            p.coins = 0;
            this.cardsBoughtThisTurn = 0;
            this.buyPhaseSnapshot = null;

            if (this.hasPlayableActions(p)) {
                this.turnPhase = 'action';
            } else {
                this.turnPhase = 'buy';
                p.actions = 0;
            }

            this.log(`--- ${p.name} (turn ${p.turnsTaken}) ---`);
            this.notify();
            return p;
        }

        applyBasicCardStats(player, cardDef) {
            if (cardDef.cards) this.drawCards(player, cardDef.cards);
            if (cardDef.actions) player.actions += cardDef.actions;
            if (cardDef.buys) player.buys += cardDef.buys;
            if (cardDef.coins) player.coins += cardDef.coins;
        }

        async playActionCard(player, cardInstance, controller) {
            if (this.isGameOver || !cardInstance) return false;

            const cardDef = CARDS[cardInstance.id];
            if (!cardDef || !cardDef.type.includes(CARD_TYPES.ACTION)) return false;

            // If the player entered Buy phase / played basic ingredients early without buying anything yet,
            // deterministically rewind basic ingredients back to hand so the Action card plays cleanly.
            if (
                this.turnPhase === 'buy' &&
                this.canUndoBuyPhase() &&
                this.buyPhaseSnapshot.hand.some((c) => c.uid === cardInstance.uid)
            ) {
                this.undoBuyPhase();
            }

            if (this.turnPhase !== 'action') return false;
            if (player.actions <= 0) return false;

            const moved = this.moveCard(player.hand, player.playArea, cardInstance.uid);
            if (!moved) return false;

            player.actions--;
            this.log(`${player.name} plays ${cardDef.name}`);
            this.applyBasicCardStats(player, cardDef);
            this.notify();

            if (cardDef.onPlay) {
                await cardDef.onPlay(this, player, controller);
            }

            if (!this.hasPlayableActions(player)) {
                this.enterBuyPhase(player, false);
            }

            this.notify();
            return true;
        }

        playIngredient(player, cardInstance) {
            if (this.isGameOver || this.cardsBoughtThisTurn > 0 || !cardInstance) return false;
            const cardDef = CARDS[cardInstance.id];
            if (!cardDef || !cardDef.type.includes(CARD_TYPES.INGREDIENT)) return false;
            if (!player.hand.some((c) => c.uid === cardInstance.uid)) return false;

            if (this.turnPhase === 'action') {
                this.enterBuyPhase(player, true);
            }

            const moved = this.moveCard(player.hand, player.playArea, cardInstance.uid);
            if (!moved) return false;

            player.coins += cardDef.coins;
            this.log(`${player.name} plays ${cardDef.name} (+${cardDef.coins} coin${cardDef.coins > 1 ? 's' : ''})`);
            this.notify();
            return true;
        }

        playAllIngredients(player) {
            if (this.isGameOver || this.cardsBoughtThisTurn > 0) return 0;
            const ingredients = player.hand.filter((c) =>
                CARDS[c.id].type.includes(CARD_TYPES.INGREDIENT)
            );
            if (this.turnPhase === 'action') {
                this.enterBuyPhase(player, true);
            }
            if (ingredients.length === 0) {
                this.notify();
                return 0;
            }

            let gainedCoins = 0;
            for (const ing of ingredients) {
                const moved = this.moveCard(player.hand, player.playArea, ing.uid);
                if (moved) {
                    gainedCoins += CARDS[ing.id].coins;
                }
            }
            player.coins += gainedCoins;
            this.log(`${player.name} plays ${ingredients.length} ingredient${ingredients.length > 1 ? 's' : ''} (+${gainedCoins} coin${gainedCoins === 1 ? '' : 's'})`);
            this.notify();
            return gainedCoins;
        }

        buyCard(player, cardId) {
            if (this.isGameOver) return false;
            const cardDef = CARDS[cardId];
            if (!cardDef) return false;
            if (player.buys <= 0) return false;
            if ((this.supply[cardId] || 0) <= 0) return false;
            if (player.coins < cardDef.cost) return false;

            if (this.turnPhase === 'action') {
                this.enterBuyPhase(player, false);
            }
            this.buyPhaseSnapshot = null;
            this.cardsBoughtThisTurn++;
            player.coins -= cardDef.cost;
            player.buys--;
            this.supply[cardId]--;
            player.discard.push(createCardInstance(cardId));

            this.log(`${player.name} buys ${cardDef.name} (${cardDef.cost})`);
            this.notify();
            return true;
        }

        gainCard(player, cardId) {
            const cardDef = CARDS[cardId];
            if (!cardDef || (this.supply[cardId] || 0) <= 0) return false;
            this.supply[cardId]--;
            player.discard.push(createCardInstance(cardId));
            this.log(`${player.name} gains ${cardDef.name}`);
            this.notify();
            return true;
        }

        trashCards(player, cards) {
            for (const c of cards) {
                const moved = this.moveCard(player.hand, this.trash, c.uid);
                if (moved) {
                    this.log(`${player.name} trashes ${CARDS[c.id].name}`);
                }
            }
            this.notify();
        }

        discardCards(player, cards) {
            for (const c of cards) {
                const moved = this.moveCard(player.hand, player.discard, c.uid);
                if (moved) {
                    this.log(`${player.name} discards ${CARDS[c.id].name}`);
                }
            }
            this.notify();
        }

        checkGameOver() {
            if (this.supply.premium_donut === 0) return true;
            let emptyPiles = 0;
            for (const key of SUPPLY_ORDER) {
                if (this.supply[key] === 0) emptyPiles++;
            }
            return emptyPiles >= 3;
        }

        getEmptyPiles() {
            return SUPPLY_ORDER.filter((key) => this.supply[key] === 0);
        }

        finishTurn() {
            if (this.isGameOver) return this.gameResult;
            const p = this.players[this.activePlayerIndex];

            p.discard.push(...p.hand, ...p.playArea);
            p.hand = [];
            p.playArea = [];
            p.actions = 0;
            p.buys = 0;
            p.coins = 0;
            this.cardsBoughtThisTurn = 0;
            this.buyPhaseSnapshot = null;

            this.drawCards(p, 5);

            if (this.checkGameOver()) {
                return this.finishGame();
            }

            this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
            this.notify();
            return null;
        }

        finishGame() {
            this.isGameOver = true;
            const standings = this.players.map((p, idx) => ({
                index: idx,
                name: p.name,
                isAI: p.isAI,
                score: p.getScore(),
                turnsTaken: p.turnsTaken,
                totalCards: p.getAllCards().length,
                counts: p.getCardCounts()
            }));

            // Dominion official tie-breaker: higher score wins; if tied, fewer turns wins; otherwise shared tie
            const sorted = [...standings].sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.turnsTaken - b.turnsTaken;
            });

            const top = sorted[0];
            const runnerUp = sorted[1];
            const isTie =
                Boolean(runnerUp) &&
                top.score === runnerUp.score &&
                top.turnsTaken === runnerUp.turnsTaken;

            this.gameResult = {
                standings: sorted,
                winner: isTie ? null : top,
                isTie,
                emptyPiles: this.getEmptyPiles(),
                turnCount: this.turnCount
            };

            this.log('--- Game over ---');
            for (const s of sorted) {
                this.log(`${s.name}: ${s.score} pts (${s.turnsTaken} turns)`);
            }
            if (isTie) {
                this.log(`Tie game at ${top.score} points!`);
            } else {
                this.log(`Winner: ${top.name} with ${top.score} points!`);
            }

            this.notify();
            return this.gameResult;
        }
    }

    // --- Smart AI Decision Controller ---

    function countOwnedByFilter(player, predicate) {
        let count = 0;
        for (const c of player.getAllCards()) {
            if (predicate(CARDS[c.id], c.id)) count++;
        }
        return count;
    }

    function getTotalDeckCoins(player) {
        let coins = 0;
        for (const c of player.getAllCards()) {
            const def = CARDS[c.id];
            coins += def.coins || 0;
        }
        return coins;
    }

    function chooseNextAIAction(engine, player) {
        const actionsInHand = player.hand.filter((c) =>
            CARDS[c.id].type.includes(CARD_TYPES.ACTION)
        );
        if (actionsInHand.length === 0 || player.actions <= 0) return null;

        // 1. Play Late night (kings_court) first ONLY if there is another worthwhile action in hand
        const kc = actionsInHand.find((c) => c.id === 'kings_court');
        if (kc) {
            const others = actionsInHand.filter((c) => c.uid !== kc.uid && c.id !== 'chapel');
            if (others.length > 0) return kc;
        }

        // 2. Play non-terminal (+Action) cards before terminal actions
        const villageOrder = ['laboratory', 'market', 'festival', 'oasis', 'cellar'];
        for (const id of villageOrder) {
            const found = actionsInHand.find((c) => c.id === id);
            if (found) return found;
        }

        // 3. Play terminal actions in priority order
        const terminalOrder = ['smithy', 'expand', 'workshop', 'chapel'];
        for (const id of terminalOrder) {
            const found = actionsInHand.find((c) => c.id === id);
            if (found) {
                if (id === 'chapel') {
                    // Only play chapel if we actually want to trash something
                    const junk = player.hand.filter(
                        (c) =>
                            c.id === 'donut_hole' ||
                            (c.id === 'flour' && getTotalDeckCoins(player) > 4)
                    );
                    if (junk.length === 0) continue;
                }
                return found;
            }
        }

        return null;
    }

    function createAIController(engine) {
        return {
            async selectCardsFromHand(player, opts) {
                const candidates = opts.candidates || player.hand;
                const min = Math.min(opts.min || 0, candidates.length);
                const max = Math.min(
                    opts.max !== undefined ? opts.max : candidates.length,
                    candidates.length
                );

                if (opts.reason === 'cellar_discard') {
                    // Discard Victory cards & surplus terminal actions beyond remaining actions
                    const toDiscard = [];
                    let spareActions = player.actions;
                    for (const c of candidates) {
                        if (toDiscard.length >= max) break;
                        const def = CARDS[c.id];
                        if (def.type.includes(CARD_TYPES.VICTORY)) {
                            toDiscard.push(c);
                        } else if (def.type.includes(CARD_TYPES.ACTION) && !def.actions) {
                            if (spareActions > 0) {
                                spareActions--;
                            } else {
                                toDiscard.push(c);
                            }
                        }
                    }
                    return toDiscard;
                }

                if (opts.reason === 'chapel_trash') {
                    const toTrash = [];
                    let remainingCoins = getTotalDeckCoins(player);
                    const earlyGame = engine.supply.premium_donut > 4;

                    for (const c of candidates) {
                        if (toTrash.length >= max) break;
                        if (c.id === 'donut_hole' && earlyGame) {
                            toTrash.push(c);
                        } else if (c.id === 'flour' && remainingCoins - 1 >= 4) {
                            toTrash.push(c);
                            remainingCoins -= 1;
                        }
                    }
                    return toTrash;
                }

                if (opts.reason === 'oasis_discard') {
                    const sorted = [...candidates].sort((a, b) => {
                        const aVic = CARDS[a.id].type.includes(CARD_TYPES.VICTORY) ? 0 : 1;
                        const bVic = CARDS[b.id].type.includes(CARD_TYPES.VICTORY) ? 0 : 1;
                        if (aVic !== bVic) return aVic - bVic;
                        return CARDS[a.id].cost - CARDS[b.id].cost;
                    });
                    return sorted.slice(0, Math.max(1, min));
                }

                if (opts.reason === 'kings_court_target') {
                    const priority = [
                        'kings_court',
                        'laboratory',
                        'market',
                        'festival',
                        'smithy',
                        'workshop',
                        'oasis',
                        'expand',
                        'cellar'
                    ];
                    for (const id of priority) {
                        const match = candidates.find((c) => c.id === id);
                        if (match) return [match];
                    }
                    return [];
                }

                if (opts.reason === 'expand_trash') {
                    const lateGame = engine.supply.premium_donut <= 5;
                    if (lateGame && engine.supply.premium_donut > 0) {
                        const fivePlus = candidates.find(
                            (c) => CARDS[c.id].cost >= 5 && c.id !== 'premium_donut' && c.id !== 'lard'
                        );
                        if (fivePlus) return [fivePlus];
                    }
                    const cheapOrder = ['donut_hole', 'flour', 'cellar', 'chapel', 'oasis', 'workshop', 'sugar'];
                    for (const id of cheapOrder) {
                        const match = candidates.find((c) => c.id === id);
                        if (match) return [match];
                    }
                    const nonPremium = candidates.find((c) => c.id !== 'premium_donut');
                    return nonPremium ? [nonPremium] : candidates.slice(0, min);
                }

                return candidates.slice(0, min);
            },

            async selectCardToGain(player, maxCost) {
                return chooseBestGainOrBuy(engine, player, maxCost, true);
            }
        };
    }

    function chooseBestGainOrBuy(engine, player, budget, isFreeGain = false) {
        const s = engine.supply;
        const canPick = (id) => (s[id] || 0) > 0 && CARDS[id].cost <= budget;

        const actionCount = countOwnedByFilter(player, (def) =>
            def.type.includes(CARD_TYPES.ACTION)
        );
        const terminalCount = countOwnedByFilter(
            player,
            (def) => def.type.includes(CARD_TYPES.ACTION) && !def.actions
        );
        const counts = player.getCardCounts();
        const premiumsLeft = s.premium_donut || 0;

        // 8+: always buy/gain Premium donut
        if (canPick('premium_donut')) return 'premium_donut';

        // 7: Late night if we have enough actions, or Batter bargain, else Lard
        if (budget >= 7) {
            if (canPick('kings_court') && actionCount >= 4 && (counts.kings_court || 0) < 2) {
                return 'kings_court';
            }
            if (canPick('expand') && (counts.expand || 0) < 1 && premiumsLeft > 3) {
                return 'expand';
            }
        }

        // Endgame greening: Donuts when Premium donuts are running low
        if (premiumsLeft <= 4 && canPick('donut')) {
            return 'donut';
        }

        // 6: Lard
        if (canPick('lard')) return 'lard';

        // 5: Recipe research / Shop sign / Stacked pots / Donut
        if (budget >= 5) {
            if (premiumsLeft <= 5 && canPick('donut')) return 'donut';
            if (canPick('laboratory') && (counts.laboratory || 0) < 3) return 'laboratory';
            if (canPick('market') && (counts.market || 0) < 2) return 'market';
            if (canPick('festival') && terminalCount >= 2 && (counts.festival || 0) < 2) {
                return 'festival';
            }
            if (canPick('donut') && isFreeGain) return 'donut';
        }

        // 4: Crate (up to 2) or Sugar
        if (budget >= 4 && canPick('smithy') && terminalCount < 2) {
            return 'smithy';
        }

        // 3: Sugar (or early Sweet deal / Free sample)
        if (budget >= 3) {
            if (canPick('oasis') && (counts.oasis || 0) < 1 && player.turnsTaken <= 4) {
                return 'oasis';
            }
            if (canPick('sugar')) return 'sugar';
            if (canPick('workshop') && terminalCount < 1) return 'workshop';
        }

        // 2: Endgame Donut hole, or 1 early Clean sweep / Clear crumbs
        if (budget >= 2) {
            if (premiumsLeft <= 2 && canPick('donut_hole')) return 'donut_hole';
            if (
                player.turnsTaken <= 2 &&
                (counts.chapel || 0) === 0 &&
                canPick('chapel')
            ) {
                return 'chapel';
            }
            if (
                player.turnsTaken <= 3 &&
                (counts.cellar || 0) === 0 &&
                canPick('cellar')
            ) {
                return 'cellar';
            }
            if (isFreeGain && canPick('donut_hole')) return 'donut_hole';
        }

        // Mandatory free gains (Free sample / Batter bargain) must pick an eligible card if any remain
        if (isFreeGain) {
            const eligible = engine.getGainableCards(budget);
            if (eligible.length > 0) {
                eligible.sort((a, b) => CARDS[b].cost - CARDS[a].cost);
                return eligible[0];
            }
        }

        // Never voluntarily buy 0-cost Flour to bloat deck unless forced free gain with nothing else
        return null;
    }

    async function runAITurn(engine, player, delayFn = null) {
        const pause = delayFn || (() => Promise.resolve());
        const aiController = createAIController(engine);

        await pause();
        if (engine.isGameOver) return;

        // 1. Action phase
        let safety = 0;
        while (!engine.isGameOver && player.actions > 0 && safety < 40) {
            safety++;
            const nextAction = chooseNextAIAction(engine, player);
            if (!nextAction) break;
            await engine.playActionCard(player, nextAction, aiController);
            await pause();
        }

        if (engine.isGameOver) return;

        // 2. Ingredient phase
        engine.playAllIngredients(player);
        await pause();

        // 3. Buy phase (supports multiple buys!)
        let buySafety = 0;
        while (!engine.isGameOver && player.buys > 0 && buySafety < 10) {
            buySafety++;
            const pick = chooseBestGainOrBuy(engine, player, player.coins, false);
            if (!pick) break;
            const bought = engine.buyCard(player, pick);
            if (!bought) break;
            await pause();
        }

        if (!engine.isGameOver) {
            engine.finishTurn();
        }
    }

    async function simulateAIGame(maxTurns = 200, rng = Math.random) {
        const engine = new DonutEngine({ rng });
        engine.reset('ai');
        while (!engine.isGameOver && engine.turnCount <= maxTurns) {
            const active = engine.beginTurn();
            if (!active || engine.isGameOver) break;
            await runAITurn(engine, active, null);
        }
        if (!engine.isGameOver) {
            engine.finishGame();
        }
        return engine;
    }

    const exported = {
        CARD_TYPES,
        CARDS,
        SUPPLY_ORDER,
        createInitialSupply,
        createCardInstance,
        PlayerState,
        DonutEngine,
        createAIController,
        chooseNextAIAction,
        chooseBestGainOrBuy,
        runAITurn,
        simulateAIGame
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exported;
    }
    root.DonutChefLogic = exported;
})(typeof globalThis !== 'undefined' ? globalThis : window);
