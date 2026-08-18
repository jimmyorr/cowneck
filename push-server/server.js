import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import webpush from 'web-push';
import fs from 'node:fs/promises';

const app = express();
const port = Number(process.env.PORT || 8787);
const subscriptionsFile = process.env.SUBSCRIPTIONS_FILE || './subscriptions.json';
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT || !process.env.SENDER_TOKEN) {
    throw new Error('VAPID keys, VAPID_SUBJECT, and SENDER_TOKEN are required.');
}

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '32kb' }));

async function readSubscriptions() {
    try {
        return JSON.parse(await fs.readFile(subscriptionsFile, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}

async function writeSubscriptions(subscriptions) {
    const temporaryFile = `${subscriptionsFile}.tmp`;
    await fs.writeFile(temporaryFile, JSON.stringify(subscriptions, null, 2));
    await fs.rename(temporaryFile, subscriptionsFile);
}

async function sendWithRetry(subscription, payload) {
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            return await webpush.sendNotification(subscription, JSON.stringify(payload));
        } catch (error) {
            lastError = error;
            if (error.statusCode === 404 || error.statusCode === 410 || error.statusCode < 500) throw error;
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        }
    }
    throw lastError;
}

app.get('/health', (_request, response) => response.json({ ok: true }));

app.post('/subscriptions', async (request, response) => {
    const subscription = request.body;
    if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        return response.status(400).json({ error: 'Invalid push subscription.' });
    }

    const subscriptions = await readSubscriptions();
    const existingIndex = subscriptions.findIndex(item => item.endpoint === subscription.endpoint);
    if (existingIndex >= 0) subscriptions[existingIndex] = subscription;
    else subscriptions.push(subscription);
    await writeSubscriptions(subscriptions);
    return response.status(204).end();
});

app.post('/send-morning', async (request, response) => {
    if (request.get('authorization') !== `Bearer ${process.env.SENDER_TOKEN}`) {
        return response.status(401).json({ error: 'Unauthorized.' });
    }

    const payload = {
        title: 'Good meow-ning!',
        body: "Today's cat is ready. Tap to answer the new Would You Rather!",
        url: '/games/cat-per-day.html'
    };
    const subscriptions = await readSubscriptions();
    const activeSubscriptions = [];
    let sent = 0;

    for (const subscription of subscriptions) {
        try {
            await sendWithRetry(subscription, payload);
            activeSubscriptions.push(subscription);
            sent++;
        } catch (error) {
            if (error.statusCode !== 404 && error.statusCode !== 410) activeSubscriptions.push(subscription);
        }
    }

    await writeSubscriptions(activeSubscriptions);
    return response.json({ sent, removed: subscriptions.length - activeSubscriptions.length });
});

app.listen(port, () => console.log(`Push server listening on port ${port}`));
