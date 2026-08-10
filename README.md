
# MorrowAI Agentic Payments Lab

MorrowAI is a technical demonstration of a future autonomous economic agent.
Gemini evaluates whether a completed supplier task warrants payment, a
deterministic policy engine enforces recipient and spending limits, and a
Circle testnet adapter executes the payment without a human click.

This is explicitly a **testnet technology demo**. It does not claim real
customers, real revenue, production payments, or mainnet settlement.

## Build with Gemini XPRIZE

- **Prize focus:** Circle Agentic Economy Prize
- **Production URL:** https://morrow-ai-export.ljs2546.chatgpt.site
- **Google model:** `gemini-3.6-flash`
- **Google Cloud requirement:** Gemini API plus production-hosted structured
  storage
- **AI-native operation:** autonomous payment necessity decision
- **Human responsibility:** define the policy before the agent runs

## Product workflow

1. The agent receives a completed task, delivery evidence, recipient, and amount.
2. Gemini decides whether the evidence warrants payment.
3. The policy engine checks the 25 USDC cap, recipient allowlist, evidence, and
   testnet-only rule.
4. When every rule passes, the agent executes without transaction-time human
   approval.
5. AI, policy, execution, and audit-seal events are stored separately.
6. A blocked scenario proves the system fails closed before provider execution.

## Evidence and data

Durable records are stored in the production database:

- `missions`: user product inputs, objectives, generated results, and live/demo
  mode
- `execution_logs`: timestamp, AI/human actor, model, status, latency, and
  execution detail
- `agent_payments`: task evidence, policy outcome, execution mode, provider
  status, transaction reference, and completion status

## Circle testnet

Without Circle credentials the UI transparently labels the result
`sandbox_simulation`. A submission-grade testnet run requires these hosted
secrets:

- `CIRCLE_API_KEY`
- `CIRCLE_WALLET_ID`
- `CIRCLE_USDC_TOKEN_ID`
- `CIRCLE_DESTINATION_ADDRESS`
- `CIRCLE_ENTITY_SECRET_CIPHERTEXT`

Only testnet wallets and test USDC may be configured.

The submission-ready evidence index is in
[`product-evidence/`](product-evidence/README.md).

## Local setup

Requirements: Node.js 22.13 or newer.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `GEMINI_API_KEY` only in a local ignored environment file or the production
secret store. Never commit the key.

## Validation

```bash
npm run build
```

The production verification recorded on July 30, 2026 returned HTTP 200 with
`live: true`, `model: gemini-3.6-flash`, and `status: success`. See
[`product-evidence/production-verification.json`](product-evidence/production-verification.json).

## Repository structure

- `app/`: product UI and API routes
- `db/`: structured storage schema and runtime initialization
- `drizzle/`: database migrations
- `product-evidence/`: Devpost evidence index and verified production records
- `.openai/hosting.json`: deployment resource declarations; no secrets

## Privacy

Secrets, private keys, entity secrets, and raw provider responses containing
sensitive information must never be committed. Submission evidence must contain
only sanitized testnet records.
