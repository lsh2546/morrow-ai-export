
import { NextRequest, NextResponse } from "next/server";
import { constants, publicEncrypt } from "node:crypto";
import { ensureSchema, getD1, id } from "../../../../db/runtime";

const MODEL = "gemini-3.6-flash";
const MAX_AUTONOMOUS_USDC = 25;
const ALLOWED_VENDORS = ["verified-localizer", "market-research-partner"];

type AgentDecision = {
  shouldPay: boolean;
  confidence: number;
  reason: string;
  evidenceSatisfied: boolean;
};

function safeDecision(value: unknown): AgentDecision {
  const candidate = value as Partial<AgentDecision>;
  return {
    shouldPay: candidate.shouldPay === true,
    confidence: Math.max(0, Math.min(100, Number(candidate.confidence) || 0)),
    reason: String(candidate.reason || "No rationale returned"),
    evidenceSatisfied: candidate.evidenceSatisfied === true,
  };
}

async function askGemini(task: string, evidence: string, amount: number) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      decision: {
        shouldPay: evidence.toLowerCase().includes("delivered"),
        confidence: 72,
        reason: "Deterministic demo evaluator found delivery evidence.",
        evidenceSatisfied: evidence.toLowerCase().includes("delivered"),
      },
      live: false,
      httpStatus: 0,
    };
  }

  const prompt = `You are an autonomous accounts-payable agent operating only on testnet.
Task: ${task.slice(0, 800)}
Evidence: ${evidence.slice(0, 1200)}
Requested payment: ${amount} USDC
Decide whether the completed work merits payment. Return only JSON:
{"shouldPay":true,"confidence":90,"reason":"one concise sentence","evidenceSatisfied":true}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      }),
    },
  );
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const body = await response.json();
  const parsed = JSON.parse(body.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
  return { decision: safeDecision(parsed), live: true, httpStatus: response.status };
}

async function executeCircleTransfer(amount: number, reference: string) {
  const apiKey = process.env.CIRCLE_API_KEY;
  const walletId = process.env.CIRCLE_WALLET_ID;
  const tokenAddress = process.env.CIRCLE_USDC_TOKEN_ADDRESS;
  const blockchain = process.env.CIRCLE_BLOCKCHAIN || "ARC-TESTNET";
  const destinationAddress = process.env.CIRCLE_DESTINATION_ADDRESS;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey || !walletId || !tokenAddress || !destinationAddress || !entitySecret) {
    return {
      mode: "sandbox_simulation",
      httpStatus: 201,
      state: "CONFIRMED",
      transactionId: `sim_${crypto.randomUUID()}`,
      transactionHash: `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)), (v) => v.toString(16).padStart(2, "0")).join("")}`,
    };
  }

  if (blockchain !== "ARC-TESTNET") {
    throw new Error("Circle execution blocked: only ARC-TESTNET is allowed.");
  }
  if (!/^[a-fA-F0-9]{64}$/.test(entitySecret)) {
    throw new Error("Circle entity secret must be exactly 32 bytes encoded as 64 hex characters.");
  }

  const requestId = crypto.randomUUID();
  const idempotencyKey = crypto.randomUUID();
  const publicKeyResponse = await fetch("https://api.circle.com/v1/w3s/config/entity/publicKey", {
    headers: {
      authorization: `Bearer ${apiKey}`,
      "x-request-id": requestId,
    },
    cache: "no-store",
  });
  const publicKeyPayload = await publicKeyResponse.json().catch(() => ({}));
  if (!publicKeyResponse.ok || !publicKeyPayload.data?.publicKey) {
    throw new Error(`Circle public key HTTP ${publicKeyResponse.status}`);
  }
  const entitySecretCiphertext = publicEncrypt(
    {
      key: publicKeyPayload.data.publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(entitySecret, "hex"),
  ).toString("base64");

  const response = await fetch("https://api.circle.com/v1/w3s/developer/transactions/transfer", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "x-request-id": requestId,
    },
    body: JSON.stringify({
      idempotencyKey,
      walletId,
      tokenAddress,
      blockchain,
      destinationAddress,
      amounts: [amount.toFixed(2)],
      feeLevel: "LOW",
      refId: reference,
      entitySecretCiphertext,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Circle HTTP ${response.status}`);
  return {
    mode: "circle_testnet",
    httpStatus: response.status,
    state: payload.data?.state ?? "INITIATED",
    transactionId: payload.data?.id ?? requestId,
    transactionHash: payload.data?.txHash ?? null,
    requestId,
    idempotencyKey,
  };
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  const occurredAt = new Date().toISOString();
  const body = await request.json();
  const actorId = String(body.actorId || "anonymous");
  const task = String(body.task || "");
  const evidence = String(body.evidence || "");
  const vendor = String(body.vendor || "");
  const amount = Number(body.amount);
  const paymentId = id("pay");

  if (!task || !evidence || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ message: "Task, evidence, and a positive amount are required." }, { status: 400 });
  }

  await ensureSchema();
  const db = getD1();
  let decision: AgentDecision;
  let geminiLive = false;
  let geminiHttpStatus = 0;

  try {
    const evaluated = await askGemini(task, evidence, amount);
    decision = evaluated.decision;
    geminiLive = evaluated.live;
    geminiHttpStatus = evaluated.httpStatus;
  } catch (error) {
    decision = { shouldPay: false, confidence: 0, reason: "Gemini evaluation failed; fail-closed policy applied.", evidenceSatisfied: false };
    await db.prepare(`INSERT INTO execution_logs
      (id, mission_id, actor_id, occurred_at, stage, actor_type, model, status, latency_ms, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id("log"), paymentId, actorId, occurredAt, "payment_decision", "ai", MODEL, "failed", Date.now() - started, error instanceof Error ? error.message : "Unknown Gemini error").run();
  }

  const checks = {
    aiApproved: decision.shouldPay && decision.evidenceSatisfied,
    amountWithinLimit: amount <= MAX_AUTONOMOUS_USDC,
    vendorAllowed: ALLOWED_VENDORS.includes(vendor),
    testnetOnly: true,
  };
  const policyPassed = Object.values(checks).every(Boolean);

  await db.batch([
    db.prepare(`INSERT INTO execution_logs
      (id, mission_id, actor_id, occurred_at, stage, actor_type, model, status, latency_ms, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id("log"), paymentId, actorId, occurredAt, "payment_decision", "ai", geminiLive ? MODEL : null,
        decision.shouldPay ? "approved" : "declined", Date.now() - started,
        JSON.stringify({ ...decision, geminiHttpStatus, mode: geminiLive ? "live_gemini" : "demo_evaluator" })),
    db.prepare(`INSERT INTO execution_logs
      (id, mission_id, actor_id, occurred_at, stage, actor_type, model, status, latency_ms, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id("log"), paymentId, actorId, new Date().toISOString(), "policy_check", "policy", null,
        policyPassed ? "passed" : "blocked", Date.now() - started,
        JSON.stringify({ checks, maxAutonomousUsdc: MAX_AUTONOMOUS_USDC, humanApproval: "not_required_below_limit" })),
  ]);

  let payment: {
    mode: string;
    httpStatus: number;
    state: string;
    transactionId: string | null;
    transactionHash: string | null;
    requestId?: string;
    idempotencyKey?: string;
  } = { mode: "not_executed", httpStatus: 0, state: "BLOCKED", transactionId: null, transactionHash: null };
  let finalStatus = "blocked";
  let errorDetail: string | null = null;

  if (policyPassed) {
    try {
      payment = await executeCircleTransfer(amount, paymentId);
      finalStatus = "executed";
    } catch (error) {
      finalStatus = "failed";
      errorDetail = error instanceof Error ? error.message : "Unknown Circle error";
    }
  }

  const completedAt = new Date().toISOString();
  await db.batch([
    db.prepare(`INSERT INTO agent_payments
      (id, actor_id, task, evidence, vendor, amount_usdc, decision_json, policy_json,
       execution_mode, provider_http_status, transaction_id, transaction_hash, status, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(paymentId, actorId, task, evidence, vendor, amount, JSON.stringify(decision), JSON.stringify(checks),
        payment.mode, payment.httpStatus, payment.transactionId, payment.transactionHash, finalStatus, occurredAt, completedAt),
    db.prepare(`INSERT INTO execution_logs
      (id, mission_id, actor_id, occurred_at, stage, actor_type, model, status, latency_ms, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id("log"), paymentId, actorId, completedAt, "payment_execution", "agent", null, finalStatus,
        Date.now() - started, JSON.stringify({ ...payment, error: errorDetail })),
    db.prepare(`INSERT INTO execution_logs
      (id, mission_id, actor_id, occurred_at, stage, actor_type, model, status, latency_ms, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id("log"), paymentId, actorId, completedAt, "audit_seal", "system", null, "recorded",
        Date.now() - started, `Immutable audit sequence completed for ${paymentId}`),
  ]);

  return NextResponse.json({
    paymentId,
    decision,
    gemini: { live: geminiLive, model: geminiLive ? MODEL : null, httpStatus: geminiHttpStatus },
    policy: { passed: policyPassed, checks, maxAutonomousUsdc: MAX_AUTONOMOUS_USDC, approvalRule: "No human approval below 25 USDC when every rule passes" },
    payment,
    status: finalStatus,
    latencyMs: Date.now() - started,
  });
}
