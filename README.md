# CookUp Website + n8n HTTP Workflow

This project replaces the n8n built-in form UI with a Next.js website and HTTP webhook endpoints.

## Files

- `workflows/cookup-http-webhooks.json` is the importable n8n workflow generated from `C:/Users/HARIS ALI/Downloads/cookup (1).json`.
- `app/page.tsx` is the customer order page.
- `app/order/received/page.tsx` polls n8n until the chef approves or rejects the proposal.
- `app/order/confirm/page.tsx` lets the customer confirm or cancel the approved proposal.
- `app/order/confirmed/page.tsx` and `app/order/cancelled/page.tsx` are final result pages.

## n8n Webhook Endpoints

After importing and activating `workflows/cookup-http-webhooks.json`, configure the Next app with your n8n production webhook URLs:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
N8N_ORDER_WEBHOOK_URL=http://localhost:5678/webhook/cookup/order
N8N_STATUS_WEBHOOK_URL=http://localhost:5678/webhook/cookup/status
N8N_DECISION_WEBHOOK_URL=http://localhost:5678/webhook/cookup/decision
```

For n8n test mode, use `/webhook-test/` instead of `/webhook/`.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Regenerate Workflow

If you edit the original downloaded workflow and want to regenerate the HTTP version:

```bash
npm run generate:workflow
```
