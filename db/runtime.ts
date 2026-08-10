
import { env } from "cloudflare:workers";

let ready: Promise<void> | null = null;

export function getD1(): D1Database {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");
  return env.DB;
}

export async function ensureSchema() {
  if (ready) return ready;
  const db = getD1();
  ready = Promise.all([
    db.prepare(`CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, product TEXT NOT NULL, goal TEXT NOT NULL,
      result_json TEXT NOT NULL, mode TEXT NOT NULL, created_at TEXT NOT NULL
    )`).run(),
    db.prepare(`CREATE TABLE IF NOT EXISTS execution_logs (
      id TEXT PRIMARY KEY, mission_id TEXT, actor_id TEXT NOT NULL, occurred_at TEXT NOT NULL,
      stage TEXT NOT NULL, actor_type TEXT NOT NULL, model TEXT, status TEXT NOT NULL,
      latency_ms INTEGER, detail TEXT
    )`).run(),
    db.prepare(`CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL,
      company TEXT, note TEXT, pilot_interest INTEGER NOT NULL, created_at TEXT NOT NULL
    )`).run(),
    db.prepare(`CREATE TABLE IF NOT EXISTS agent_payments (
      id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, task TEXT NOT NULL, evidence TEXT NOT NULL,
      vendor TEXT NOT NULL, amount_usdc REAL NOT NULL, decision_json TEXT NOT NULL,
      policy_json TEXT NOT NULL, execution_mode TEXT NOT NULL, provider_http_status INTEGER NOT NULL,
      transaction_id TEXT, transaction_hash TEXT, status TEXT NOT NULL,
      created_at TEXT NOT NULL, completed_at TEXT NOT NULL
    )`).run(),
    db.prepare("CREATE INDEX IF NOT EXISTS missions_actor_idx ON missions(actor_id)").run(),
    db.prepare("CREATE INDEX IF NOT EXISTS logs_time_idx ON execution_logs(occurred_at)").run(),
    db.prepare("CREATE INDEX IF NOT EXISTS payments_time_idx ON agent_payments(created_at)").run(),
  ]).then(() => undefined);
  return ready;
}

export function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}
