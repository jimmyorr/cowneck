# Daily Meow push server

This service stores browser Web Push subscriptions and sends the morning notification. It must run at a public HTTPS URL; GitHub Pages cannot receive subscriptions or send pushes by itself.

## Setup

1. From this directory, run `npm install`.
2. Generate VAPID keys with `npx web-push generate-vapid-keys`.
3. Copy `.env.example` to `.env` and fill in the generated keys, a `mailto:` subject, and a random `SENDER_TOKEN`.
4. Start the service with `npm start` and keep `subscriptions.json` on persistent storage.
5. Set `PUSH_API_URL` and `VAPID_PUBLIC_KEY` near the top of `games/cat-per-day.html` to the service URL and public key.
6. Configure GitHub repository secrets `PUSH_SERVER_URL` and `PUSH_SENDER_TOKEN` with the same service URL and sender token.

The workflow sends at 08:00 UTC. Change the cron expression in `.github/workflows/send-daily-meow.yml` if the desired morning is in another timezone.

The site must be served over HTTPS for Web Push. On iOS, the site must be installed to the Home Screen before notification permission can be granted.
