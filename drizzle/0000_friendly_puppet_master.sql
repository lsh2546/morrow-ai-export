CREATE TABLE `execution_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`mission_id` text,
	`actor_id` text NOT NULL,
	`occurred_at` text NOT NULL,
	`stage` text NOT NULL,
	`actor_type` text NOT NULL,
	`model` text,
	`status` text NOT NULL,
	`latency_ms` integer,
	`detail` text
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text,
	`note` text,
	`pilot_interest` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`product` text NOT NULL,
	`goal` text NOT NULL,
	`result_json` text NOT NULL,
	`mode` text NOT NULL,
	`created_at` text NOT NULL
);
