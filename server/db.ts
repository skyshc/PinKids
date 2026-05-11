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
  locationConsents,
  locationPoints,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

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
