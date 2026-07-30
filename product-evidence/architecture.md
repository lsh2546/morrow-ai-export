# AI-native operating architecture

## Decision path

```text
Small-business product + goal
  -> Market Analysis API
  -> Gemini 3.6 Flash
  -> Structured market decision
  -> Mission and AI execution log
  -> Human campaign approval
  -> Human execution log
```

## AI automatic actions

Gemini automatically:

- selects a country and buyer segment
- writes buyer-facing positioning
- recommends acquisition channels
- provides a decision rationale and confidence score

These actions use `actor_type = ai` and record the model, timestamp, status,
latency, and execution detail.

## Human approval boundary

The system does not represent that outreach has been sent automatically.
A person must approve the generated campaign. Approval produces a separate
`actor_type = human`, `stage = campaign_approval`, `status = approved` record.

## Live and demo separation

- `LIVE GEMINI`: a valid production Gemini response was parsed and saved.
- `DEMO FALLBACK`: no API key was configured or the provider call failed.

The interface presents these labels directly, and the database stores the mode.
Demo fallback results must not be used as evidence of successful Gemini
operation.

## Durable storage

Structured product records survive sessions in the production database:

- `missions`
- `execution_logs`
- `feedback`

Secrets are managed by the deployment platform and are absent from source
control.
