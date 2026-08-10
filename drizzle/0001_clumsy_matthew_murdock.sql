
CREATE TABLE `agent_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`task` text NOT NULL,
	`evidence` text NOT NULL,
	`vendor` text NOT NULL,
	`amount_usdc` integer NOT NULL,
	`decision_json` text NOT NULL,
	`policy_json` text NOT NULL,
	`execution_mode` text NOT NULL,
	`provider_http_status` integer NOT NULL,
	`transaction_id` text,
	`transaction_hash` text,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text NOT NULL
);
