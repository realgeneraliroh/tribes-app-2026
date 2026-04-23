CREATE TABLE `media_files` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bucket` text NOT NULL,
	`s3_key` text NOT NULL,
	`context` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`encrypted` integer DEFAULT false,
	`encryption_meta` text,
	`public_url` text,
	`created_at` integer DEFAULT (unixepoch()),
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_bans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`banned_by` text NOT NULL,
	`reason` text,
	`duration` text NOT NULL,
	`related_post_id` text,
	`expires_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`banned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`role` text DEFAULT 'Human_Free' NOT NULL,
	`bio` text,
	`avatar` text,
	`reserved_alias` text,
	`reputation_score` integer DEFAULT 0,
	`reputation_status` text DEFAULT 'Newcomer',
	`email_verified` integer DEFAULT false,
	`created_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "name", "email", "role", "bio", "avatar", "reserved_alias", "reputation_score", "reputation_status", "email_verified", "created_at") SELECT "id", "name", "email", "role", "bio", "avatar", "reserved_alias", "reputation_score", "reputation_status", "email_verified", "created_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;