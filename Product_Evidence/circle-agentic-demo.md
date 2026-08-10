
# Circle Agentic Economy Prize evidence plan

## Honest scope

Morrow AI is a technical testnet demonstration. It does not claim real
customers, revenue, mainnet settlement, or production financial activity.

## Three-minute video

### 0:00–0:15 — Disclosure

Display the opening card:

> **Morrow AI**
>
> **A technology demonstration of autonomous AI payments using Gemini and Circle Testnet.**
>
> **No production funds are used. All transactions occur on Arc Testnet using Test USDC.**

### 0:15–0:40 — Gemini Decision

- Submit the completed-work evidence.
- Show the live Gemini indicator, model name, HTTP status, timestamp, and latency.
- Show Gemini deciding whether payment is warranted.

### 0:40–1:00 — Policy Gate

- Show the amount cap, vendor allowlist, evidence requirement, and testnet-only rule.
- Make each rule visibly pass.
- State that no human approval is required when every rule passes below the limit.

### 1:00–1:25 — Circle API Call

- Execute the approved transfer through the Circle developer-controlled wallet.
- Show `ARC-TESTNET`, Test USDC, provider HTTP `201`, and Circle transaction ID.
- Do not expose API keys or the Entity Secret.

### 1:25–1:45 — Transaction Hash

- Show the on-chain hash:
  `0xae4116dadcf2444380b78fb8b195f4077f195deb68b8efbfe0280b00cbc48b89`
- Show the outbound source wallet and inbound destination wallet records.

### 1:45–2:05 — COMPLETE

- Show the Circle Developer Console state `Complete`.
- Emphasize that the transfer used 1 Test USDC on Arc Testnet.

### 2:05–2:35 — Audit Log

- Show separate `payment_decision`, `policy_check`, `payment_execution`, and
  `audit_seal` records.
- Point out the actor type for AI, deterministic policy, autonomous agent, and
  system audit stages.

### 2:35–3:00 — Safety proof and close

- Run or display a request blocked by the 25 USDC cap or vendor allowlist.
- Show that the blocked request never invokes Circle.
- Display and read the official closing statement:

> **This demonstration shows how AI agents can make governed, autonomous
> payments using Gemini and Circle Testnet. It is a technology demonstration
> of the future AI-native economy.**

- Keep the final card visible for 8–10 seconds over the Morrow AI wordmark.
- Do not add claims about customers, revenue, production readiness, or
  mainnet activity.

## Capture checklist

- Public application URL
- Gemini live-mode indicator and model name
- Policy Gate with individual rule results
- Circle API HTTP status and transaction ID
- Circle Developer Console `Complete` record
- Transaction hash
- Operations ledger and audit sequence
- Blocked-payment safety proof
- Sanitized JSON export containing no secrets or personal information
