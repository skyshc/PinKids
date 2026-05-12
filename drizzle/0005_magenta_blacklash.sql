CREATE TABLE `inviteLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`familyRole` enum('guardian','child') NOT NULL,
	`canViewLocation` boolean NOT NULL DEFAULT false,
	`canShareLocation` boolean NOT NULL DEFAULT false,
	`expiresAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`usedAt` bigint,
	`usedByUserId` int,
	`revokedAt` timestamp,
	CONSTRAINT `inviteLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `inviteLinks_token_unique` UNIQUE(`token`)
);
