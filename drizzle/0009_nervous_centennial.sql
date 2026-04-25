ALTER TABLE `tribes` ADD `slug` text;--> statement-breakpoint
CREATE UNIQUE INDEX `tribes_slug_unique` ON `tribes` (`slug`);