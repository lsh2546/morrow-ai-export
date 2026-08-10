
# Agentic payment architecture

```text
Completed task + delivery evidence + recipient + amount
  -> Gemini payment-necessity decision
  -> Deterministic policy gate
       evidence accepted
       recipient allowlisted
       amount <= 25 test USDC
       testnet-only execution
  -> Circle developer-controlled wallet transfer
  -> Transaction reference
  -> Durable four-part audit trail
```

## Authority boundaries

- `actor_type = ai`: Gemini evaluates whether completed work warrants payment.
- `actor_type = policy`: deterministic controls approve or block execution.
- `actor_type = agent`: the payment agent calls Circle without a
  transaction-time human approval.
- `actor_type = system`: the final audit seal records sequence completion.

Humans define the policy before the run. They do not click to approve an
individual transaction that satisfies every rule.

## Fail-closed behavior

Any missing evidence, Gemini failure, unapproved recipient, or amount over the
limit blocks the transaction before the provider is called.

## Environment labels

- `circle_testnet`: real Circle testnet API call with configured test wallet.
- `sandbox_simulation`: transparent local execution used only while Circle
  credentials are absent.
- `not_executed`: policy blocked the request before provider execution.

Only `circle_testnet` records with Circle provider evidence should be presented
as completed testnet transactions.
