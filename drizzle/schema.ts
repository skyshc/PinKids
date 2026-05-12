import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, double, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const familyRoleEnum = mysqlEnum("familyRole", ["guardian", "child"]);
export const inviteStatusEnum = mysqlEnum("inviteStatus", ["pending", "accepted", "declined", "revoked"]);
export const consentStatusEnum = mysqlEnum("consentStatus", ["granted", "revoked"]);
export const geofenceEventTypeEnum = mysqlEnum("geofenceEventType", ["exit", "enter"]);

export const families = mysqlTable("families", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export const familyMembers = mysqlTable("familyMembers", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  userId: int("userId"),
  displayName: varchar("displayName", { length: 120 }).notNull(),
  role: familyRoleEnum.notNull(),
  inviteStatus: inviteStatusEnum.default("pending").notNull(),
  canViewLocation: boolean("canViewLocation").default(false).notNull(),
  canShareLocation: boolean("canShareLocation").default(false).notNull(),
  invitedAt: bigint("invitedAt", { mode: "number" }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  acceptedAt: bigint("acceptedAt", { mode: "number" }),
  revokedAt: bigint("revokedAt", { mode: "number" }),
});

export const locationConsents = mysqlTable("locationConsents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  familyId: int("familyId"),
  consentVersion: varchar("consentVersion", { length: 32 }).notNull(),
  status: consentStatusEnum.default("granted").notNull(),
  grantedAt: bigint("grantedAt", { mode: "number" }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  revokedAt: bigint("revokedAt", { mode: "number" }),
  permissionState: varchar("permissionState", { length: 32 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 96 }),
  userAgent: text("userAgent"),
  consentText: text("consentText"),
});

export const inviteLinks = mysqlTable("inviteLinks", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  role: familyRoleEnum.notNull(),
  canViewLocation: boolean("canViewLocation").default(false).notNull(),
  canShareLocation: boolean("canShareLocation").default(false).notNull(),
  expiresAt: bigint("expiresAt", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  usedAt: bigint("usedAt", { mode: "number" }),
  usedByUserId: int("usedByUserId"),
  revokedAt: timestamp("revokedAt"),
});

export const locationPoints = mysqlTable("locationPoints", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  familyId: int("familyId"),
  latitude: double("latitude").notNull(),
  longitude: double("longitude").notNull(),
  accuracy: double("accuracy"),
  recordedAt: bigint("recordedAt", { mode: "number" }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  source: varchar("source", { length: 32 }).default("browser").notNull(),
});

export const safeZones = mysqlTable("safeZones", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  centerLatitude: double("centerLatitude").notNull(),
  centerLongitude: double("centerLongitude").notNull(),
  radiusMeters: int("radiusMeters").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  alertsEnabled: boolean("alertsEnabled").default(true).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export const familyAlertSettings = mysqlTable("familyAlertSettings", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  userId: int("userId").notNull(),
  geofenceAlertsEnabled: boolean("geofenceAlertsEnabled").default(true).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export const locationAlerts = mysqlTable("locationAlerts", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  safeZoneId: int("safeZoneId").notNull(),
  memberUserId: int("memberUserId").notNull(),
  locationPointId: int("locationPointId"),
  eventType: geofenceEventTypeEnum.notNull(),
  latitude: double("latitude").notNull(),
  longitude: double("longitude").notNull(),
  distanceMeters: double("distanceMeters").notNull(),
  message: varchar("message", { length: 255 }).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  acknowledgedAt: bigint("acknowledgedAt", { mode: "number" }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Family = typeof families.$inferSelect;
export type InsertFamily = typeof families.$inferInsert;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = typeof familyMembers.$inferInsert;
export type LocationConsent = typeof locationConsents.$inferSelect;
export type InsertLocationConsent = typeof locationConsents.$inferInsert;
export type LocationPoint = typeof locationPoints.$inferSelect;
export type InsertLocationPoint = typeof locationPoints.$inferInsert;
export type InviteLink = typeof inviteLinks.$inferSelect;
export type InsertInviteLink = typeof inviteLinks.$inferInsert;
export type SafeZone = typeof safeZones.$inferSelect;
export type InsertSafeZone = typeof safeZones.$inferInsert;
export type FamilyAlertSetting = typeof familyAlertSettings.$inferSelect;
export type InsertFamilyAlertSetting = typeof familyAlertSettings.$inferInsert;
export type LocationAlert = typeof locationAlerts.$inferSelect;
export type InsertLocationAlert = typeof locationAlerts.$inferInsert;
