ALTER TABLE `families` MODIFY COLUMN `createdAt` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `families` MODIFY COLUMN `updatedAt` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `familyMembers` MODIFY COLUMN `invitedAt` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `familyMembers` MODIFY COLUMN `acceptedAt` bigint;--> statement-breakpoint
ALTER TABLE `familyMembers` MODIFY COLUMN `revokedAt` bigint;--> statement-breakpoint
ALTER TABLE `locationConsents` MODIFY COLUMN `grantedAt` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `locationConsents` MODIFY COLUMN `revokedAt` bigint;--> statement-breakpoint
ALTER TABLE `locationPoints` MODIFY COLUMN `recordedAt` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `familyMembers` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `locationConsents` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `locationPoints` DROP COLUMN `createdAt`;