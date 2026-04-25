PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`tribe_id` text,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`author_avatar` text,
	`author_avatar_fallback` text DEFAULT '??' NOT NULL,
	`title` text,
	`content` text NOT NULL,
	`image_url` text,
	`image_alt` text,
	`data_ai_hint_avatar` text,
	`data_ai_hint_image` text,
	`vibe_count` integer DEFAULT 0,
	`comment_count` integer DEFAULT 0,
	`is_removed` integer DEFAULT false,
	`can_be_reposted` integer DEFAULT true,
	`removal_reason` text,
	`original_post_id` text,
	`is_pinned` integer DEFAULT false,
	`mood_visibility` text DEFAULT 'public',
	`ring` text DEFAULT 'tribes',
	`mood_tag` text,
	`pinned_to_wall` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`tribe_id`) REFERENCES `tribes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "tribe_id", "author_id", "author_name", "author_avatar", "author_avatar_fallback", "title", "content", "image_url", "image_alt", "data_ai_hint_avatar", "data_ai_hint_image", "vibe_count", "comment_count", "is_removed", "can_be_reposted", "removal_reason", "original_post_id", "is_pinned", "mood_visibility", "ring", "mood_tag", "pinned_to_wall", "created_at") SELECT "id", "tribe_id", "author_id", "author_name", "author_avatar", "author_avatar_fallback", "title", "content", "image_url", "image_alt", "data_ai_hint_avatar", "data_ai_hint_image", "vibe_count", "comment_count", "is_removed", "can_be_reposted", "removal_reason", "original_post_id", "is_pinned", "mood_visibility", "ring", "mood_tag", "pinned_to_wall", "created_at" FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `bonds` ADD `inner_circle` integer DEFAULT false;