import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getD1, id } from "../../../db/runtime";

export async function POST(request: NextRequest) {
  const { missionId, actorId = "anonymous" } = await request.json();
  await ensureSchema();
  await getD1().prepare(`INSERT INTO execution_logs
    (id, mission_id, actor_id, occurred_at, stage, actor_type, model, status, latency_ms, detail)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id("log"), missionId, actorId, new Date().toISOString(), "campaign_approval", "human", null, "approved", 0, "Human approved the campaign")
    .run();
  return NextResponse.json({ ok: true });
}
