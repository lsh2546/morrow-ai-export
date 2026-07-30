import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getD1, id } from "../../../db/runtime";

const MODEL = "gemini-3.6-flash";
const fallback = {
  market: "United States · Independent wellness retailers",
  headline: "A calmer ritual, bottled in Seoul.",
  pitch:
    "Small-batch yuja tea concentrate made with whole Korean citrus. Shelf-ready, giftable, and built for the growing alcohol-free ritual category.",
  channels: ["Faire outreach", "LinkedIn buyer list", "Email sequence"],
  reason:
    "High category growth, simple English positioning, and low localization risk make this the fastest market to validate.",
  confidence: 87,
};

export async function POST(request: NextRequest) {
  const started = Date.now();
  const occurredAt = new Date().toISOString();
  const { product, goal, actorId = "anonymous" } = await request.json();
  const apiKey = process.env.GEMINI_API_KEY;
  let result = fallback;
  let mode = "demo";
  let status = "demo_fallback";
  let detail = "GEMINI_API_KEY is not configured";

  if (apiKey) {
    const prompt = `You are an export market operator for a Korean small business.
Product: ${String(product).slice(0, 1000)}
Goal: ${String(goal).slice(0, 500)}
Choose one specific country and buyer segment that can be tested quickly. Return only JSON:
{"market":"country · segment","headline":"short localized headline","pitch":"2 sentence buyer pitch","channels":["3 channels"],"reason":"one sentence decision rationale","confidence":85}`;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
          }),
        },
      );
      if (!response.ok) {
        const providerError = await response.text();
        throw new Error(
          `Gemini HTTP ${response.status}: ${providerError.slice(0, 700)}`,
        );
      }
      const data = await response.json();
      result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
      mode = "live";
      status = "success";
      detail = "Gemini response parsed and stored";
    } catch (error) {
      status = "failed";
      detail = error instanceof Error ? error.message : "Unknown Gemini error";
    }
  }

  const missionId = id("mission");
  const latency = Date.now() - started;
  try {
    await ensureSchema();
    const db = getD1();
    await db.batch([
      db.prepare(`INSERT INTO missions
        (id, actor_id, product, goal, result_json, mode, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(missionId, actorId, String(product), String(goal), JSON.stringify(result), mode, occurredAt),
      db.prepare(`INSERT INTO execution_logs
        (id, mission_id, actor_id, occurred_at, stage, actor_type, model, status, latency_ms, detail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id("log"), missionId, actorId, occurredAt, "market_analysis", "ai", apiKey ? MODEL : null, status, latency, detail),
    ]);
  } catch (error) {
    detail += ` · storage unavailable: ${error instanceof Error ? error.message : "unknown"}`;
  }

  return NextResponse.json({
    ...result,
    live: mode === "live",
    missionId,
    execution: { occurredAt, model: apiKey ? MODEL : null, status, latencyMs: latency, detail },
  });
}
