// --- Wizard Pure Game Logic ---

const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const SUIT_ICONS = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠', None: '?' };

const ALL_BOTS = [
    { name: 'Oliver', desc: 'Calculated and cautious.' },
    { name: 'Miles', desc: 'Aggressive bidder.' },
    { name: 'Kirby 🐱', desc: 'Unpredictable and chaotic.' },
    { name: 'Pookie', desc: 'Playful but smart.' },
    { name: 'Jimmy', desc: 'Mathematical and precise.' },
    { name: 'Leon 😼', desc: 'Intuitive and lucky.' },
    { name: 'Shantih 😿', desc: 'Grumpy but solid.' }
];
const BOT_NAMES = ALL_BOTS.map(b => b.name);

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function createDeck() {
    const deck = [];
    SUITS.forEach(suit => {
        // 2..10, 11=J, 12=Q, 13=K, 14=A (Ace high)
        for (let v = 2; v <= 14; v++) deck.push({ suit, value: v, type: 'normal' });
    });
    for (let i = 0; i < 4; i++) {
        deck.push({ suit: 'None', value: 0, type: 'jester' });
        deck.push({ suit: 'None', value: 15, type: 'wizard' });
    }
    return shuffle(deck);
}

function getMaxRounds(numPlayers) {
    return Math.floor(60 / Math.max(1, numPlayers));
}

function getCardDisplay(card) {
    if (card.type === 'jester') return 'J';
    if (card.type === 'wizard') return 'W';
    if (card.value === 14) return 'A';
    if (card.value === 11) return 'J';
    if (card.value === 12) return 'Q';
    if (card.value === 13) return 'K';
    return card.value;
}

function getCardIcon(card) {
    if (card.type === 'jester') return '🤡';
    if (card.type === 'wizard') return '🧙';
    return SUIT_ICONS[card.suit];
}

function isValidPlay(card, hand, leadS) {
    if (leadS === 'None' || leadS === 'Wizard' || card.type !== 'normal') return true;
    const hasLeadSuit = hand.some(c => c.suit === leadS && c.type === 'normal');
    if (hasLeadSuit && card.suit !== leadS) return false;
    return true;
}

function determineTrickWinner(trick, trumpSuit) {
    const wizardPlay = trick.find(t => t.card.type === 'wizard');
    if (wizardPlay) return wizardPlay.pIdx;

    const firstNonJesterIdx = trick.findIndex(t => t.card.type !== 'jester');
    if (firstNonJesterIdx === -1) return trick[0].pIdx;

    let winnerIdx = trick[firstNonJesterIdx].pIdx;
    let winningCard = trick[firstNonJesterIdx].card;

    for (let i = firstNonJesterIdx + 1; i < trick.length; i++) {
        const { pIdx, card } = trick[i];
        if (card.type === 'jester') continue;
        if (trumpSuit !== 'None' && card.suit === trumpSuit && winningCard.suit !== trumpSuit) {
            winningCard = card;
            winnerIdx = pIdx;
        } else if (card.suit === winningCard.suit && card.value > winningCard.value) {
            winningCard = card;
            winnerIdx = pIdx;
        }
    }

    return winnerIdx;
}

function calculateBotBid(bot, r, tSuit) {
    let strength = 0;
    bot.hand.forEach(c => {
        if (c.type === 'wizard') strength += 0.9;
        else if (c.type === 'normal' && c.suit === tSuit) strength += c.value >= 11 ? 0.65 : 0.4;
        else if (c.type === 'normal' && c.value === 14) strength += 0.45;
        else if (c.type === 'normal' && c.value >= 12) strength += 0.25;
    });

    let bias = 0;
    switch (bot.name) {
        case 'Oliver':
            bias = -0.22 + (Math.random() * 0.2 - 0.1);
            break;
        case 'Miles':
            bias = 0.32 + (Math.random() * 0.25 - 0.1);
            break;
        case 'Kirby 🐱':
            bias = Math.random() * 1.4 - 0.7;
            break;
        case 'Pookie':
            bias = Math.random() * 0.35 - 0.15;
            break;
        case 'Jimmy':
            bias = Math.random() * 0.12 - 0.06;
            break;
        case 'Leon 😼':
            bias = 0.16 + (Math.random() * 0.25 - 0.1);
            break;
        case 'Shantih 😿':
            bias = -0.14 + (Math.random() * 0.2 - 0.1);
            break;
        default:
            bias = Math.random() * 0.3 - 0.15;
            break;
    }

    return Math.max(0, Math.min(r, Math.round(strength + bias)));
}

function chooseAICardIndex(player, leadSuit, trumpSuit) {
    const choices = player.hand
        .map((c, i) => ({ c, i }))
        .filter(o => isValidPlay(o.c, player.hand, leadSuit));

    const scoreCard = (c) => {
        if (c.type === 'wizard') return 100;
        if (c.type === 'jester') return -1;
        if (trumpSuit !== 'None' && c.suit === trumpSuit) return 50 + c.value;
        if (leadSuit !== 'None' && c.suit === leadSuit) return 20 + c.value;
        return c.value;
    };

    if (player.tricks < player.bid) {
        choices.sort((a, b) => scoreCard(b.c) - scoreCard(a.c));
    } else {
        choices.sort((a, b) => scoreCard(a.c) - scoreCard(b.c));
    }
    return choices[0].i;
}

function runFullGameSync(simPlayers) {
    const numPlayers = simPlayers.length;
    const totalRounds = getMaxRounds(numPlayers);

    for (let r = 1; r <= totalRounds; r++) {
        const deck = createDeck();
        simPlayers.forEach(p => {
            p.hand = [];
            p.tricks = 0;
            for (let j = 0; j < r; j++) p.hand.push(deck.pop());
        });

        const up = deck.length > 0 ? deck.pop() : null;
        const tSuit = up
            ? (up.type === 'normal' ? up.suit : (up.type === 'wizard' ? SUITS[Math.floor(Math.random() * SUITS.length)] : 'None'))
            : 'None';

        simPlayers.forEach(p => {
            p.bid = calculateBotBid(p, r, tSuit);
        });

        let leadPlayerIdx = r % numPlayers;
        for (let t = 0; t < r; t++) {
            let lSuit = 'None';
            const trick = [];
            for (let j = 0; j < numPlayers; j++) {
                const pIdx = (leadPlayerIdx + j) % numPlayers;
                const p = simPlayers[pIdx];
                const cardIdx = chooseAICardIndex(p, lSuit, tSuit);
                const [play] = p.hand.splice(cardIdx, 1);
                trick.push({ pIdx, card: play });
                if (lSuit === 'None' && play.type !== 'jester') {
                    lSuit = play.type === 'wizard' ? 'Wizard' : play.suit;
                }
            }
            const winnerIdx = determineTrickWinner(trick, tSuit);
            simPlayers[winnerIdx].tricks++;
            leadPlayerIdx = winnerIdx;
        }

        simPlayers.forEach(p => {
            const diff = Math.abs(p.tricks - p.bid);
            p.score += diff === 0 ? (20 + p.tricks * 10) : -(diff * 10);
        });
    }
    return simPlayers;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUITS,
        SUIT_ICONS,
        ALL_BOTS,
        BOT_NAMES,
        shuffle,
        createDeck,
        getMaxRounds,
        getCardDisplay,
        getCardIcon,
        isValidPlay,
        determineTrickWinner,
        calculateBotBid,
        chooseAICardIndex,
        runFullGameSync
    };
}
