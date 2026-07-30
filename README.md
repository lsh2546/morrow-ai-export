# MorrowAI

MorrowAI is a Gemini-powered export operator for small businesses. A founder
describes a local product and commercial goal; an AI agent selects a target
market, creates localized buyer positioning, recommends acquisition channels,
and records every decision for human approval.

## Build with Gemini XPRIZE

- **Category:** Small Business Services
- **Production URL:** https://morrow-ai-export.ljs2546.chatgpt.site
- **Google model:** `gemini-3.6-flash`
- **Google Cloud requirement:** Gemini API plus production-hosted structured
  storage
- **AI-native operation:** market analysis and campaign preparation
- **Human responsibility:** final campaign approval

## Product workflow

1. A user submits a product and market objective.
2. Gemini selects a country and buyer segment.
3. Gemini creates a localized headline, pitch, channel plan, rationale, and
   confidence score.
4. The result and execution metadata are saved.
5. A human approves or requests revision.
6. The control room reports users, analyses, Gemini calls, approvals, and
   recent agent logs.

## Evidence and data

Durable records are stored in the production database:

- `missions`: user product inputs, objectives, generated results, and live/demo
  mode
- `execution_logs`: timestamp, AI/human actor, model, status, latency, and
  execution detail
- `feedback`: customer feedback and paid-pilot interest

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

Customer contact details and raw production exports must not be committed.
Share personal customer evidence only through the private Devpost judging
channel after obtaining customer consent.
