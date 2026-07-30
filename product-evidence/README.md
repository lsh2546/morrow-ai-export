# Product Evidence

This folder indexes evidence for the Build with Gemini XPRIZE submission.
It deliberately contains no API keys, customer personal information, or
fabricated revenue.

## Verified production evidence

- [`production-verification.json`](production-verification.json): successful
  production Gemini request and matching stored execution log
- [`architecture.md`](architecture.md): AI decision path, human approval
  boundary, storage, and audit design
- [`submission-checklist.md`](submission-checklist.md): evidence still required
  before the Devpost deadline

## Evidence available in the live product

The Operations Evidence control room displays:

- distinct users
- completed analyses
- Gemini call attempts
- human campaign approvals
- recent execution logs
- AI automatic versus human-approved actor labels
- model name, request status, timestamp, and latency

## Evidence handling

Before submission, export or capture:

1. A successful `LIVE GEMINI` result.
2. The matching `AI AUTO` success row in the control room.
3. A `HUMAN` approval row for the same mission.
4. Gemini API usage from the relevant Google dashboard.
5. Revenue evidence and P&L.
6. Customer testimonials and contact information with explicit consent.

Store screenshots in `product-evidence/screenshots/` only after reviewing them
for API keys, email addresses, phone numbers, and unrelated account data.
