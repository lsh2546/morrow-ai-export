import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const missions = sqliteTable("missions", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull(),
  product: text("product").notNull(),
  goal: text("goal").notNull(),
  resultJson: text("result_json").notNull(),
  mode: text("mode").notNull(),
  createdAt: text("created_at").notNull(),
});

export const executionLogs = sqliteTable("execution_logs", {
  id: text("id").primaryKey(),
  missionId: text("mission_id"),
  actorId: text("actor_id").notNull(),
  occurredAt: text("occurred_at").notNull(),
  stage: text("stage").notNull(),
  actorType: text("actor_type").notNull(),
  model: text("model"),
  status: text("status").notNull(),
  latencyMs: integer("latency_ms"),
  detail: text("detail"),
});

export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  note: text("note"),
  pilotInterest: integer("pilot_interest").notNull(),
  createdAt: text("created_at").notNull(),
});
