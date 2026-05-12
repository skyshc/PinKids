ALTER TABLE `families` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `families` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `familyMembers` MODIFY COLUMN `invitedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `familyMembers` MODIFY COLUMN `acceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `familyMembers` MODIFY COLUMN `revokedAt` timestamp;--> statement-breakpoint
ALTER TABLE `locationConsents` MODIFY COLUMN `grantedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `locationConsents` MODIFY COLUMN `revokedAt` timestamp;--> statement-breakpoint
ALTER TABLE `locationPoints` MODIFY COLUMN `recordedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `familyMembers` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `locationConsents` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `locationPoints` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;