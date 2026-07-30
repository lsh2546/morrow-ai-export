import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getD1, id } from "../../../db/runtime";

export async function POST(request: NextRequest) {
  const body = await request.json();
  await ensureSchema();
  await getD1().prepare(`INSERT INTO feedback
    (id, actor_id, name, email, company, note, pilot_interest, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id("feedback"), body.actorId ?? "anonymous", body.name, body.email, body.company ?? "", body.note ?? "", body.pilot ? 1 : 0, new Date().toISOString())
    .run();
  return NextResponse.json({ ok: true });
}
