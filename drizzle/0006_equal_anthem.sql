CREATE TABLE `familyAlertSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`userId` int NOT NULL,
	`geofenceAlertsEnabled` boolean NOT NULL DEFAULT true,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `familyAlertSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locationAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`safeZoneId` int NOT NULL,
	`memberUserId` int NOT NULL,
	`locationPointId` int,
	`geofenceEventType` enum('exit','enter') NOT NULL,
	`latitude` double NOT NULL,
	`longitude` double NOT NULL,
	`distanceMeters` double NOT NULL,
	`message` varchar(255) NOT NULL,
	`createdAt` bigint NOT NULL,
	`acknowledgedAt` bigint,
	CONSTRAINT `locationAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safeZones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`centerLatitude` double NOT NULL,
	`centerLongitude` double NOT NULL,
	`radiusMeters` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`alertsEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `safeZones_id` PRIMARY KEY(`id`)
);
