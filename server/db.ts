import { and, desc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  families,
  familyMembers,
  InsertFamily,
  InsertFamilyMember,
  InsertLocationConsent,
  InsertLocationPoint,
  InsertUser,
  InsertInviteLink,
  InviteLink,
  LocationPoint,
  InsertSafeZone,
  InsertLocationAlert,
  SafeZone,
  locationConsents,
  locationPoints,
  users,
  inviteLinks,
  safeZones,
  familyAlertSettings,
  locationAlerts,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { notifyOwner } from "./_core/notification";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

type FamilyRole = "guardian" | "child";

type GrantConsentInput = {
  userId: number;
  familyId?: number | null;
  permissionState: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  consentText?: string | null;
  consentVersion?: string;
};

type CreateFamilyInput = {
  name: string;
  createdByUserId: number;
  displayName: string;
  role: FamilyRole;
};

type InviteFamilyMemberInput = {
  familyId: number;
  displayName: string;
  role: FamilyRole;
};

type UpsertLocationPointInput = {
  userId: number;
  familyId?: number | null;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  recordedAt?: number;
};

export async function grantLocationConsent(input: GrantConsentInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const now = Date.now();
  await db
    .update(locationConsents)
    .set({ status: "revoked", revokedAt: now })
    .where(and(eq(locationConsents.userId, input.userId), eq(locationConsents.status, "granted"), isNull(locationConsents.revokedAt)));

  const values: InsertLocationConsent = {
    userId: input.userId,
    familyId: input.familyId ?? null,
    consentVersion: input.consentVersion ?? "2026-05-11",
    status: "granted",
    grantedAt: now,
    revokedAt: null,
    permissionState: input.permissionState,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    consentText: input.consentText ?? "PinKids 위치 정보 제공 및 가족 공유에 명시적으로 동의했습니다.",
  };

  await db.insert(locationConsents).values(values);
  return getActiveLocationConsent(input.userId);
}

export async function revokeLocationConsent(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const now = Date.now();
  await db
    .update(locationConsents)
    .set({ status: "revoked", revokedAt: now })
    .where(and(eq(locationConsents.userId, userId), eq(locationConsents.status, "granted"), isNull(locationConsents.revokedAt)));

  await db.update(locationPoints).set({ isActive: false }).where(eq(locationPoints.userId, userId));
  return { revokedAt: now } as const;
}

export async function getActiveLocationConsent(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(locationConsents)
    .where(and(eq(locationConsents.userId, userId), eq(locationConsents.status, "granted"), isNull(locationConsents.revokedAt)))
    .orderBy(desc(locationConsents.grantedAt))
    .limit(1);

  return result[0];
}

export async function createFamily(input: CreateFamilyInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const now = Date.now();
  const familyValues: InsertFamily = {
    name: input.name,
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(families).values(familyValues);
  const inserted = await db.select().from(families).where(eq(families.createdByUserId, input.createdByUserId)).orderBy(desc(families.createdAt)).limit(1);
  const family = inserted[0];
  if (!family) throw new Error("Family creation failed");

  const memberValues: InsertFamilyMember = {
    familyId: family.id,
    userId: input.createdByUserId,
    displayName: input.displayName,
    role: input.role,
    inviteStatus: "accepted",
    canViewLocation: input.role === "guardian",
    canShareLocation: true,
    invitedAt: now,
    acceptedAt: now,
    revokedAt: null,
  };
  await db.insert(familyMembers).values(memberValues);

  return family;
}

export async function getFamilyById(familyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(families).where(eq(families.id, familyId)).limit(1);
  return result[0];
}

export async function getAcceptedFamilyMemberships(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.userId, userId), eq(familyMembers.inviteStatus, "accepted")))
    .orderBy(desc(familyMembers.acceptedAt));
}

export async function ensurePrimaryFamily(input: CreateFamilyInput) {
  const memberships = await getAcceptedFamilyMemberships(input.createdByUserId);
  const existingMembership = memberships[0];
  if (existingMembership) {
    const family = await getFamilyById(existingMembership.familyId);
    if (family) return family;
  }

  return createFamily(input);
}

export async function inviteFamilyMember(input: InviteFamilyMemberInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const now = Date.now();
  const values: InsertFamilyMember = {
    familyId: input.familyId,
    userId: null,
    displayName: input.displayName,
    role: input.role,
    inviteStatus: "pending",
    canViewLocation: input.role === "guardian",
    canShareLocation: input.role === "child" || input.role === "guardian",
    invitedAt: now,
    acceptedAt: null,
    revokedAt: null,
  };

  await db.insert(familyMembers).values(values);
  const inserted = await db.select().from(familyMembers).where(eq(familyMembers.familyId, input.familyId)).orderBy(desc(familyMembers.invitedAt)).limit(1);
  return inserted[0];
}

export async function getFamilyMemberById(memberId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(familyMembers).where(eq(familyMembers.id, memberId)).limit(1);
  return result[0];
}

export async function acceptFamilyInvite(memberId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const existingMember = await getFamilyMemberById(memberId);
  if (!existingMember || existingMember.inviteStatus !== "pending" || (existingMember.userId !== null && existingMember.userId !== userId)) {
    throw new Error("Only pending, unclaimed family invitations can be accepted");
  }

  const now = Date.now();
  await db
    .update(familyMembers)
    .set({ userId, inviteStatus: "accepted", acceptedAt: now, revokedAt: null })
    .where(eq(familyMembers.id, memberId));

  const result = await db.select().from(familyMembers).where(eq(familyMembers.id, memberId)).limit(1);
  return result[0];
}

export async function upsertLocationPoint(input: UpsertLocationPointInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const consent = await getActiveLocationConsent(input.userId);
  if (!consent) {
    throw new Error("Active location consent is required before storing location points");
  }

  const memberships = await getAcceptedFamilyMemberships(input.userId);
  const familyId = input.familyId ?? consent.familyId ?? memberships[0]?.familyId ?? null;
  const sharingMembership = memberships.find(member => member.familyId === familyId && member.canShareLocation);
  if (!sharingMembership) {
    throw new Error("Accepted family membership with location sharing permission is required");
  }

  const previousLocations = await db
    .select()
    .from(locationPoints)
    .where(and(eq(locationPoints.userId, input.userId), eq(locationPoints.isActive, true)))
    .orderBy(desc(locationPoints.recordedAt))
    .limit(1);
  const previousLocation = previousLocations[0] ?? null;

  await db.update(locationPoints).set({ isActive: false }).where(eq(locationPoints.userId, input.userId));

  const values: InsertLocationPoint = {
    userId: input.userId,
    familyId,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy ?? null,
    recordedAt: input.recordedAt ?? Date.now(),
    isActive: true,
    source: "browser",
  };
  await db.insert(locationPoints).values(values);

  const result = await db
    .select()
    .from(locationPoints)
    .where(and(eq(locationPoints.userId, input.userId), eq(locationPoints.isActive, true)))
    .orderBy(desc(locationPoints.recordedAt))
    .limit(1);

  if (result[0]) {
    await evaluateGeofenceForLocationPoint(result[0], previousLocation);
  }

  return result[0];
}

export async function getLatestFamilyLocations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const memberships = await getAcceptedFamilyMemberships(userId);
  const viewableMemberships = memberships.filter(member => member.canViewLocation);
  const familyIds = Array.from(new Set(viewableMemberships.map(member => member.familyId)));
  const rows = [];

  for (const familyId of familyIds) {
    const members = await db.select().from(familyMembers).where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.inviteStatus, "accepted")));
    for (const member of members) {
      if (!member.userId || !member.canShareLocation) continue;
      const consent = await getActiveLocationConsent(member.userId);
      const latest = await db
        .select()
        .from(locationPoints)
        .where(and(eq(locationPoints.userId, member.userId), eq(locationPoints.familyId, familyId), eq(locationPoints.isActive, true)))
        .orderBy(desc(locationPoints.recordedAt))
        .limit(1);

      rows.push({
        familyId,
        memberId: member.id,
        userId: member.userId,
        displayName: member.displayName,
        role: member.role,
        inviteStatus: member.inviteStatus,
        consentGranted: Boolean(consent),
        location: latest[0]
          ? {
              latitude: latest[0].latitude,
              longitude: latest[0].longitude,
              accuracy: latest[0].accuracy,
              recordedAt: latest[0].recordedAt,
            }
          : null,
      });
    }
  }

  return rows;
}

export const LOCATION_HISTORY_RETENTION_DAYS = 30;

export async function pauseLocationSharing(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  await db.update(locationPoints).set({ isActive: false }).where(eq(locationPoints.userId, userId));
  return { pausedAt: Date.now(), retentionDays: LOCATION_HISTORY_RETENTION_DAYS } as const;
}

export async function deleteLocationHistory(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const deletedAt = Date.now();
  await db.delete(locationPoints).where(eq(locationPoints.userId, userId));
  await db
    .update(locationConsents)
    .set({ status: "revoked", revokedAt: deletedAt })
    .where(and(eq(locationConsents.userId, userId), eq(locationConsents.status, "granted"), isNull(locationConsents.revokedAt)));
  return { deletedAt, retentionDays: LOCATION_HISTORY_RETENTION_DAYS } as const;
}

// ============================================================================
// Invite Link Helpers
// ============================================================================

/**
 * 초대 링크 생성
 * @param familyId 초대할 가족 ID
 * @param createdByUserId 초대 링크를 생성한 사용자 ID
 * @param role 초대할 역할 (guardian/child)
 * @param canViewLocation 위치 보기 권한
 * @param canShareLocation 위치 공유 권한
 * @param expiresInHours 만료 시간 (기본값: 24시간)
 * @returns 생성된 초대 링크
 */
export async function createInviteLink(input: {
  familyId: number;
  createdByUserId: number;
  role: "guardian" | "child";
  canViewLocation: boolean;
  canShareLocation: boolean;
  expiresInHours?: number;
}): Promise<InviteLink> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  // 토큰 생성 (32바이트 랜덤 문자열)
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const expiresInHours = input.expiresInHours ?? 24;
  const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;

  const values: InsertInviteLink = {
    familyId: input.familyId,
    createdByUserId: input.createdByUserId,
    token,
    role: input.role,
    canViewLocation: input.canViewLocation,
    canShareLocation: input.canShareLocation,
    expiresAt,
  };

  await db.insert(inviteLinks).values(values);
  const result = await db
    .select()
    .from(inviteLinks)
    .where(eq(inviteLinks.token, token))
    .limit(1);

  if (!result[0]) {
    throw new Error("Failed to create invite link");
  }

  return result[0];
}

/**
 * 초대 링크 조회 및 검증
 * @param token 초대 링크 토큰
 * @returns 유효한 초대 링크 또는 null
 */
export async function getValidInviteLink(token: string): Promise<InviteLink | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(inviteLinks)
    .where(eq(inviteLinks.token, token))
    .limit(1);

  const link = result[0];
  if (!link) return null;

  // 만료된 링크 확인
  if (link.expiresAt < Date.now()) {
    return null;
  }

  // 이미 사용된 링크 확인
  if (link.usedAt !== null) {
    return null;
  }

  // 취소된 링크 확인
  if (link.revokedAt !== null) {
    return null;
  }

  return link;
}

/**
 * 초대 링크로 가족 구성원 추가
 * @param token 초대 링크 토큰
 * @param userId 초대를 수락하는 사용자 ID
 * @param displayName 표시할 이름
 * @returns 생성된 가족 구성원
 */
export async function acceptInviteLink(input: {
  token: string;
  userId: number;
  displayName: string;
}): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  return await db.transaction(async tx => {
    const nowMs = Date.now();
    const links = await tx
      .select()
      .from(inviteLinks)
      .where(eq(inviteLinks.token, input.token))
      .limit(1);
    const link = links[0];

    if (!link || link.expiresAt <= nowMs || link.usedAt !== null || link.revokedAt !== null) {
      throw new Error("Invalid or expired invite link");
    }

    const existingMembership = await tx
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.familyId, link.familyId), eq(familyMembers.userId, input.userId)))
      .limit(1);

    if (existingMembership[0]?.inviteStatus === "accepted") {
      throw new Error("User is already an accepted member of this family");
    }

    const now = Date.now();
    const consumeResult = await tx
      .update(inviteLinks)
      .set({ usedAt: now, usedByUserId: input.userId })
      .where(and(eq(inviteLinks.id, link.id), isNull(inviteLinks.usedAt), isNull(inviteLinks.revokedAt)));

    const affectedRows = Array.isArray(consumeResult)
      ? Number((consumeResult[0] as { affectedRows?: number } | undefined)?.affectedRows ?? 0)
      : Number((consumeResult as { affectedRows?: number } | undefined)?.affectedRows ?? 0);

    if (affectedRows !== 1) {
      throw new Error("Invite link has already been used or revoked");
    }

    if (existingMembership[0]) {
      await tx
        .update(familyMembers)
        .set({
          displayName: input.displayName,
          role: link.role,
          inviteStatus: "accepted",
          canViewLocation: link.canViewLocation,
          canShareLocation: link.canShareLocation,
          acceptedAt: now,
          revokedAt: null,
        })
        .where(eq(familyMembers.id, existingMembership[0].id));
    } else {
      const values: InsertFamilyMember = {
        familyId: link.familyId,
        userId: input.userId,
        displayName: input.displayName,
        role: link.role,
        inviteStatus: "accepted",
        canViewLocation: link.canViewLocation,
        canShareLocation: link.canShareLocation,
        invitedAt: now,
        acceptedAt: now,
        revokedAt: null,
      };

      await tx.insert(familyMembers).values(values);
    }

    const result = await tx
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.familyId, link.familyId), eq(familyMembers.userId, input.userId)))
      .limit(1);

    if (!result[0]) {
      throw new Error("Failed to create family membership from invite link");
    }

    return result[0];
  });
}

/**
 * 초대 링크 취소
 * @param linkId 초대 링크 ID
 * @param userId 취소 요청 사용자 ID (생성자만 가능)
 */
export async function revokeInviteLink(linkId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const link = await db
    .select()
    .from(inviteLinks)
    .where(eq(inviteLinks.id, linkId))
    .limit(1);

  if (!link[0]) {
    throw new Error("Invite link not found");
  }

  if (link[0].createdByUserId !== userId) {
    throw new Error("Only the creator can revoke the invite link");
  }

  await db
    .update(inviteLinks)
    .set({ revokedAt: new Date() })
    .where(eq(inviteLinks.id, linkId));
}

/**
 * 가족의 초대 링크 목록 조회
 * @param familyId 가족 ID
 * @param userId 요청 사용자 ID (가족 구성원이어야 함)
 */
export async function getFamilyInviteLinks(familyId: number, userId: number): Promise<InviteLink[]> {
  const db = await getDb();
  if (!db) return [];

  // 사용자가 가족 구성원인지 확인
  const membership = await db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, userId)))
    .limit(1);

  if (!membership[0]) {
    throw new Error("User is not a member of this family");
  }

  return await db
    .select()
    .from(inviteLinks)
    .where(eq(inviteLinks.familyId, familyId))
    .orderBy(desc(inviteLinks.createdAt));
}


// ============================================================================
// Test Helpers
// ============================================================================

/**
 * 테스트용 사용자 생성
 */
export async function createTestUser(email: string, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const openId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const values: InsertUser = {
    openId,
    name,
    email,
    loginMethod: "test",
    role: "user",
  };

  await db.insert(users).values(values);
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  if (!result[0]) {
    throw new Error("Failed to create test user");
  }

  return result[0];
}

export type SafeZoneInput = {
  familyId: number;
  userId: number;
  name: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  alertsEnabled?: boolean;
};

export function calculateDistanceMeters(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): number {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degree: number) => (degree * Math.PI) / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getGeofenceTransition(input: { currentDistanceMeters: number; previousDistanceMeters?: number | null; radiusMeters: number }): "enter" | "exit" | null {
  const currentOutside = input.currentDistanceMeters > input.radiusMeters;
  const previousOutside = input.previousDistanceMeters == null ? false : input.previousDistanceMeters > input.radiusMeters;
  if (currentOutside === previousOutside) return null;
  return currentOutside ? "exit" : "enter";
}

export async function listSafeZones(familyId: number): Promise<SafeZone[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(safeZones).where(eq(safeZones.familyId, familyId)).orderBy(desc(safeZones.updatedAt));
}

export async function createSafeZone(input: SafeZoneInput): Promise<SafeZone> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const memberships = await getAcceptedFamilyMemberships(input.userId);
  const membership = memberships.find(member => member.familyId === input.familyId) ?? null;
  if (!membership || !membership.canViewLocation) {
    throw new Error("Accepted family membership with location viewing permission is required");
  }

  const now = Date.now();
  const values: InsertSafeZone = {
    familyId: input.familyId,
    createdByUserId: input.userId,
    name: input.name,
    centerLatitude: input.centerLatitude,
    centerLongitude: input.centerLongitude,
    radiusMeters: input.radiusMeters,
    isActive: true,
    alertsEnabled: input.alertsEnabled ?? true,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(safeZones).values(values);
  const result = await db
    .select()
    .from(safeZones)
    .where(and(eq(safeZones.familyId, input.familyId), eq(safeZones.createdByUserId, input.userId)))
    .orderBy(desc(safeZones.createdAt))
    .limit(1);

  if (!result[0]) throw new Error("Failed to create safe zone");
  return result[0];
}

export async function updateSafeZone(input: {
  id: number;
  userId: number;
  name?: string;
  centerLatitude?: number;
  centerLongitude?: number;
  radiusMeters?: number;
  isActive?: boolean;
  alertsEnabled?: boolean;
}): Promise<SafeZone> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const existing = await db.select().from(safeZones).where(eq(safeZones.id, input.id)).limit(1);
  const zone = existing[0];
  if (!zone) throw new Error("Safe zone not found");

  const memberships = await getAcceptedFamilyMemberships(input.userId);
  const membership = memberships.find(member => member.familyId === zone.familyId) ?? null;
  if (!membership || !membership.canViewLocation) {
    throw new Error("Accepted family membership with location viewing permission is required");
  }

  await db
    .update(safeZones)
    .set({
      name: input.name ?? zone.name,
      centerLatitude: input.centerLatitude ?? zone.centerLatitude,
      centerLongitude: input.centerLongitude ?? zone.centerLongitude,
      radiusMeters: input.radiusMeters ?? zone.radiusMeters,
      isActive: input.isActive ?? zone.isActive,
      alertsEnabled: input.alertsEnabled ?? zone.alertsEnabled,
      updatedAt: Date.now(),
    })
    .where(eq(safeZones.id, input.id));

  const result = await db.select().from(safeZones).where(eq(safeZones.id, input.id)).limit(1);
  if (!result[0]) throw new Error("Failed to update safe zone");
  return result[0];
}

export async function deleteSafeZone(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const existing = await db.select().from(safeZones).where(eq(safeZones.id, id)).limit(1);
  const zone = existing[0];
  if (!zone) throw new Error("Safe zone not found");

  const memberships = await getAcceptedFamilyMemberships(userId);
  const membership = memberships.find(member => member.familyId === zone.familyId) ?? null;
  if (!membership || !membership.canViewLocation) {
    throw new Error("Accepted family membership with location viewing permission is required");
  }

  await db.update(safeZones).set({ isActive: false, updatedAt: Date.now() }).where(eq(safeZones.id, id));
}

export async function getFamilyAlertSetting(familyId: number, userId: number) {
  const db = await getDb();
  if (!db) return { familyId, userId, geofenceAlertsEnabled: true, updatedAt: Date.now() };

  const existing = await db
    .select()
    .from(familyAlertSettings)
    .where(and(eq(familyAlertSettings.familyId, familyId), eq(familyAlertSettings.userId, userId)))
    .limit(1);

  return existing[0] ?? { familyId, userId, geofenceAlertsEnabled: true, updatedAt: Date.now() };
}

export async function setFamilyAlertSetting(input: { familyId: number; userId: number; geofenceAlertsEnabled: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const memberships = await getAcceptedFamilyMemberships(input.userId);
  const membership = memberships.find(member => member.familyId === input.familyId) ?? null;
  if (!membership || !membership.canViewLocation) {
    throw new Error("Accepted family membership with location viewing permission is required");
  }

  const existing = await db
    .select()
    .from(familyAlertSettings)
    .where(and(eq(familyAlertSettings.familyId, input.familyId), eq(familyAlertSettings.userId, input.userId)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(familyAlertSettings)
      .set({ geofenceAlertsEnabled: input.geofenceAlertsEnabled, updatedAt: Date.now() })
      .where(eq(familyAlertSettings.id, existing[0].id));
  } else {
    await db.insert(familyAlertSettings).values({ ...input, updatedAt: Date.now() });
  }

  return await getFamilyAlertSetting(input.familyId, input.userId);
}

export async function listLocationAlerts(familyId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(locationAlerts)
    .where(eq(locationAlerts.familyId, familyId))
    .orderBy(desc(locationAlerts.createdAt))
    .limit(limit);
}

async function hasEnabledGeofenceRecipient(familyId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const viewers = await db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.inviteStatus, "accepted"), eq(familyMembers.canViewLocation, true)));

  if (viewers.length === 0) return true;

  for (const viewer of viewers) {
    if (!viewer.userId) continue;
    const setting = await getFamilyAlertSetting(familyId, viewer.userId);
    if (setting.geofenceAlertsEnabled) return true;
  }

  return false;
}

export async function evaluateGeofenceForLocationPoint(current: LocationPoint, previous: LocationPoint | null = null) {
  const db = await getDb();
  if (!db || !current.familyId) return [];

  const zones = await db
    .select()
    .from(safeZones)
    .where(and(eq(safeZones.familyId, current.familyId), eq(safeZones.isActive, true), eq(safeZones.alertsEnabled, true)));

  if (zones.length === 0) return [];
  const familyAlertsEnabled = await hasEnabledGeofenceRecipient(current.familyId);
  if (!familyAlertsEnabled) return [];

  const createdAlerts = [];
  for (const zone of zones) {
    const currentDistance = calculateDistanceMeters(
      { latitude: zone.centerLatitude, longitude: zone.centerLongitude },
      { latitude: current.latitude, longitude: current.longitude },
    );
    const previousDistance = previous
      ? calculateDistanceMeters(
          { latitude: zone.centerLatitude, longitude: zone.centerLongitude },
          { latitude: previous.latitude, longitude: previous.longitude },
        )
      : null;
    const eventType = getGeofenceTransition({
      currentDistanceMeters: currentDistance,
      previousDistanceMeters: previousDistance,
      radiusMeters: zone.radiusMeters,
    });

    if (!eventType) continue;
    const message = eventType === "exit"
      ? `${zone.name} 안전 구역을 벗어났습니다.`
      : `${zone.name} 안전 구역 안으로 돌아왔습니다.`;
    const values: InsertLocationAlert = {
      familyId: current.familyId,
      safeZoneId: zone.id,
      memberUserId: current.userId,
      locationPointId: current.id,
      eventType,
      latitude: current.latitude,
      longitude: current.longitude,
      distanceMeters: Math.round(currentDistance),
      message,
      createdAt: current.recordedAt ?? Date.now(),
      acknowledgedAt: null,
    };

    await db.insert(locationAlerts).values(values);
    const inserted = await db
      .select()
      .from(locationAlerts)
      .where(and(eq(locationAlerts.familyId, current.familyId), eq(locationAlerts.safeZoneId, zone.id), eq(locationAlerts.memberUserId, current.userId)))
      .orderBy(desc(locationAlerts.createdAt))
      .limit(1);
    if (inserted[0]) {
      createdAlerts.push(inserted[0]);
      await notifyOwner({
        title: eventType === "exit" ? "안전 구역 이탈 알림" : "안전 구역 복귀 알림",
        content: `${message}\n가족 ID: ${current.familyId}\n사용자 ID: ${current.userId}\n거리: ${Math.round(currentDistance)}m`,
      }).catch(error => {
        console.warn("[Geofence] Failed to dispatch owner notification:", error);
      });
    }
  }

  return createdAlerts;
}

export async function acknowledgeLocationAlert(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const existing = await db.select().from(locationAlerts).where(eq(locationAlerts.id, alertId)).limit(1);
  const alert = existing[0];
  if (!alert) throw new Error("Location alert not found");

  const memberships = await getAcceptedFamilyMemberships(userId);
  const membership = memberships.find(member => member.familyId === alert.familyId) ?? null;
  if (!membership || !membership.canViewLocation) {
    throw new Error("Accepted family membership with location viewing permission is required");
  }

  const acknowledgedAt = Date.now();
  await db.update(locationAlerts).set({ acknowledgedAt }).where(eq(locationAlerts.id, alertId));

  const result = await db.select().from(locationAlerts).where(eq(locationAlerts.id, alertId)).limit(1);
  return result[0];
}
