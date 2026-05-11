import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  LOCATION_HISTORY_RETENTION_DAYS: 30,
  getActiveLocationConsent: vi.fn(),
  ensurePrimaryFamily: vi.fn(),
  getFamilyById: vi.fn(),
  grantLocationConsent: vi.fn(),
  revokeLocationConsent: vi.fn(),
  createFamily: vi.fn(),
  inviteFamilyMember: vi.fn(),
  acceptFamilyInvite: vi.fn(),
  getFamilyMemberById: vi.fn(),
  getAcceptedFamilyMemberships: vi.fn(),
  upsertLocationPoint: vi.fn(),
  getLatestFamilyLocations: vi.fn(),
  pauseLocationSharing: vi.fn(),
  deleteLocationHistory: vi.fn(),
}));

vi.mock("./db", () => dbMock);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 42,
    openId: "guardian-open-id",
    email: "guardian@example.com",
    name: "민지 보호자",
    loginMethod: "google",
    role: "user",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    lastSignedIn: new Date("2026-01-03T00:00:00.000Z"),
  };

  return {
    user,
    req: {
      protocol: "https",
      ip: "203.0.113.10",
      headers: {
        "user-agent": "vitest-browser",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("location consent and family location procedures", () => {
  beforeEach(() => {
    Object.values(dbMock).forEach(mockFn => {
      if (typeof mockFn === "function" && "mockReset" in mockFn) mockFn.mockReset();
    });
  });

  it("creates a primary family and stores a granted location consent", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const family = { id: 7, name: "민지 보호자의 가족", createdByUserId: 42 };
    const consent = { id: 11, userId: 42, familyId: 7, status: "granted" };

    dbMock.ensurePrimaryFamily.mockResolvedValue(family);
    dbMock.grantLocationConsent.mockResolvedValue(consent);

    const result = await caller.consent.grant({
      displayName: "민지 보호자",
      familyRole: "guardian",
      permissionState: "granted",
      consentText: "위치 정보 제공에 동의합니다.",
    });

    expect(dbMock.ensurePrimaryFamily).toHaveBeenCalledWith({
      name: "민지 보호자의 가족",
      createdByUserId: 42,
      displayName: "민지 보호자",
      role: "guardian",
    });
    expect(dbMock.grantLocationConsent).toHaveBeenCalledWith({
      userId: 42,
      familyId: 7,
      permissionState: "granted",
      ipAddress: "203.0.113.10",
      userAgent: "vitest-browser",
      consentText: "위치 정보 제공에 동의합니다.",
    });
    expect(result).toEqual({ success: true, family, consent });
  });

  it("stores the current location under the first accepted family membership", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const location = {
      id: 31,
      userId: 42,
      familyId: 7,
      latitude: 37.5668,
      longitude: 126.9786,
      accuracy: 18,
      recordedAt: 1_778_000_000_000,
    };

    dbMock.getAcceptedFamilyMemberships.mockResolvedValue([{ familyId: 7, userId: 42, role: "child", inviteStatus: "accepted", canShareLocation: true, canViewLocation: false }]);
    dbMock.upsertLocationPoint.mockResolvedValue(location);

    const result = await caller.location.updateCurrent({
      latitude: 37.5668,
      longitude: 126.9786,
      accuracy: 18,
      recordedAt: 1_778_000_000_000,
    });

    expect(dbMock.upsertLocationPoint).toHaveBeenCalledWith({
      userId: 42,
      familyId: 7,
      latitude: 37.5668,
      longitude: 126.9786,
      accuracy: 18,
      recordedAt: 1_778_000_000_000,
    });
    expect(result).toEqual({ location });
  });

  it("returns latest family member locations and revokes active consent", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const locations = [
      {
        memberId: 5,
        familyId: 7,
        displayName: "지우",
        role: "child",
        location: { latitude: 37.57, longitude: 126.98, accuracy: 24, recordedAt: 1_778_000_000_000 },
      },
    ];

    dbMock.getAcceptedFamilyMemberships.mockResolvedValue([{ familyId: 7, userId: 42, role: "guardian", inviteStatus: "accepted", canShareLocation: true, canViewLocation: true }]);
    dbMock.getLatestFamilyLocations.mockResolvedValue(locations);
    dbMock.revokeLocationConsent.mockResolvedValue({ revokedCount: 1 });

    await expect(caller.location.getFamilyLocations()).resolves.toEqual({ locations, retentionDays: 30 });
    await expect(caller.consent.revoke()).resolves.toEqual({ success: true, revokedCount: 1 });
    expect(dbMock.getLatestFamilyLocations).toHaveBeenCalledWith(42);
    expect(dbMock.revokeLocationConsent).toHaveBeenCalledWith(42);
  });

  it("allows only accepted guardians with view permission to invite family members", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const invitedMember = { id: 19, familyId: 7, displayName: "지우", role: "child", status: "invited" };

    dbMock.getAcceptedFamilyMemberships.mockResolvedValue([{ familyId: 7, userId: 42, role: "guardian", inviteStatus: "accepted", canViewLocation: true, canShareLocation: true }]);
    dbMock.inviteFamilyMember.mockResolvedValue(invitedMember);

    await expect(caller.family.invite({ familyId: 7, displayName: "지우", role: "child" })).resolves.toEqual({ member: invitedMember });
    expect(dbMock.inviteFamilyMember).toHaveBeenCalledWith({ familyId: 7, displayName: "지우", role: "child" });

    dbMock.getAcceptedFamilyMemberships.mockResolvedValue([{ familyId: 7, userId: 42, role: "child", inviteStatus: "accepted", canViewLocation: false, canShareLocation: true }]);
    await expect(caller.family.invite({ familyId: 7, displayName: "하준", role: "child" })).rejects.toThrow("Only accepted guardians can invite family members");
  });

  it("pauses location sharing and deletes stored location history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    dbMock.getAcceptedFamilyMemberships.mockResolvedValue([{ familyId: 7, userId: 42, role: "child", inviteStatus: "accepted", canViewLocation: false, canShareLocation: true }]);
    dbMock.pauseLocationSharing.mockResolvedValue({ updatedMemberships: 1, retentionDays: 30 });
    dbMock.deleteLocationHistory.mockResolvedValue({ deletedLocations: 2, revokedCount: 1, retentionDays: 30 });

    await expect(caller.location.pauseSharing()).resolves.toEqual({ success: true, updatedMemberships: 1, retentionDays: 30 });
    await expect(caller.location.deleteHistory()).resolves.toEqual({ success: true, deletedLocations: 2, revokedCount: 1, retentionDays: 30 });
    expect(dbMock.pauseLocationSharing).toHaveBeenCalledWith(42);
    expect(dbMock.deleteLocationHistory).toHaveBeenCalledWith(42);
  });

  it("rejects sensitive location operations without accepted role permissions", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    dbMock.getAcceptedFamilyMemberships.mockResolvedValue([{ familyId: 7, userId: 42, role: "child", inviteStatus: "pending", canShareLocation: true, canViewLocation: false }]);
    await expect(caller.location.updateCurrent({ familyId: 7, latitude: 37.5, longitude: 127 })).rejects.toThrow("Only accepted guardian or child members with sharing permission can update location");

    // 가족 미소속 신규 사용자: 빈 배열 반환
    dbMock.getAcceptedFamilyMemberships.mockResolvedValue([]);
    const resultNoFamily = await caller.location.getFamilyLocations();
    expect(resultNoFamily.locations).toEqual([]);

    // 가족 내 비권한 사용자: 403 반환
    dbMock.getAcceptedFamilyMemberships.mockResolvedValue([{ familyId: 7, userId: 42, role: "child", inviteStatus: "accepted", canShareLocation: true, canViewLocation: false }]);
    await expect(caller.location.getFamilyLocations()).rejects.toThrow("Only accepted guardians with viewing permission can read family locations");

    dbMock.getAcceptedFamilyMemberships.mockResolvedValue([{ familyId: 7, userId: 42, role: "child", inviteStatus: "pending", canShareLocation: true, canViewLocation: false }]);
    await expect(caller.location.pauseSharing()).rejects.toThrow("Only accepted guardian or child members with sharing permission can pause location sharing");

    dbMock.getAcceptedFamilyMemberships.mockResolvedValue([{ familyId: 7, userId: 42, role: "guardian", inviteStatus: "accepted", canShareLocation: false, canViewLocation: true }]);
    await expect(caller.location.deleteHistory()).rejects.toThrow("Only accepted guardian or child members with sharing permission can delete their location history");

    dbMock.getFamilyMemberById.mockResolvedValue({ id: 99, familyId: 7, userId: 100, inviteStatus: "accepted", role: "child" });
    await expect(caller.family.acceptInvite({ memberId: 99 })).rejects.toThrow("Only pending, unclaimed family invitations can be accepted");
  });

  it("requires accepted membership before granting consent for an existing family", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    dbMock.getAcceptedFamilyMemberships.mockResolvedValue([]);
    await expect(caller.consent.grant({ familyId: 7, familyRole: "child" })).rejects.toThrow("Accepted family membership is required");
    expect(dbMock.grantLocationConsent).not.toHaveBeenCalled();
  });
});
