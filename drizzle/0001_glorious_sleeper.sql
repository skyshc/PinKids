CREATE TABLE `families` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `families_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `familyMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`userId` int,
	`displayName` varchar(120) NOT NULL,
	`familyRole` enum('guardian','child') NOT NULL,
	`inviteStatus` enum('pending','accepted','declined','revoked') NOT NULL DEFAULT 'pending',
	`canViewLocation` boolean NOT NULL DEFAULT false,
	`canShareLocation` boolean NOT NULL DEFAULT false,
	`invitedAt` bigint NOT NULL,
	`acceptedAt` bigint,
	`revokedAt` bigint,
	CONSTRAINT `familyMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locationConsents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`familyId` int,
	`consentVersion` varchar(32) NOT NULL,
	`consentStatus` enum('granted','revoked') NOT NULL DEFAULT 'granted',
	`grantedAt` bigint NOT NULL,
	`revokedAt` bigint,
	`permissionState` varchar(32) NOT NULL,
	`ipAddress` varchar(96),
	`userAgent` text,
	`consentText` text,
	CONSTRAINT `locationConsents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locationPoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`familyId` int,
	`latitude` double NOT NULL,
	`longitude` double NOT NULL,
	`accuracy` double,
	`recordedAt` bigint NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`source` varchar(32) NOT NULL DEFAULT 'browser',
	CONSTRAINT `locationPoints_id` PRIMARY KEY(`id`)
);
