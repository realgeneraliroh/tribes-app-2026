ALTER TABLE `tribes` ADD `invite_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `tribes_invite_token_unique` ON `tribes` (`invite_token`);