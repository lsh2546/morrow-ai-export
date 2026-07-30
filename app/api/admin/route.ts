import { NextResponse } from "next/server";
import { ensureSchema, getD1 } from "../../../db/runtime";

export async function GET() {
  await ensureSchema();
  const db = getD1();
  const [users, analyses, gemini, approvals, feedback, logs] = await db.batch([
    db.prepare("SELECT COUNT(DISTINCT actor_id) AS value FROM missions"),
    db.prepare("SELECT COUNT(*) AS value FROM missions"),
    db.prepare("SELECT COUNT(*) AS value FROM execution_logs WHERE actor_type = 'ai' AND model IS NOT NULL"),
    db.prepare("SELECT COUNT(*) AS value FROM execution_logs WHERE actor_type = 'human' AND status = 'approved'"),
    db.prepare("SELECT COUNT(*) AS value FROM feedback"),
    db.prepare(`SELECT occurred_at, stage, actor_type, model, status, latency_ms, detail
      FROM execution_logs ORDER BY occurred_at DESC LIMIT 12`),
  ]);
  const value = (row: D1Result) => Number((row.results?.[0] as { value?: number })?.value ?? 0);
  return NextResponse.json({
    users: value(users), analyses: value(analyses), geminiCalls: value(gemini),
    approvals: value(approvals), feedback: value(feedback), logs: logs.results ?? [],
  });
}
