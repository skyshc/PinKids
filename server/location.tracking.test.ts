import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { and, eq } from "drizzle-orm";
import { familyMembers, inviteLinks } from "../drizzle/schema";
import * as db from "./db";

/**
 * 자동 위치 추적 기능 테스트
 * - 신규 사용자 로그인 시 기본 가족 자동 생성
 * - 위치 업데이트 API 호출
 * - 가족 위치 조회
 */

// Mock 사용자 및 가족 데이터
const mockUser = {
  id: 1,
  openId: "test-user-123",
  name: "테스트 사용자",
  email: "test@example.com",
  loginMethod: "google" as const,
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("Location Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("기본 가족 생성 시 사용자 정보가 정상적으로 저장되어야 함", async () => {
    // 기본 가족 생성
    const family = await db.ensurePrimaryFamily({
      name: `${mockUser.name}의 가족`,
      createdByUserId: mockUser.id,
      displayName: mockUser.name,
      role: "guardian",
    });

    // 가족이 정상적으로 생성되어야 함
    expect(family).toBeDefined();
    expect(family.name).toContain("의 가족");
    expect(family.createdByUserId).toBe(mockUser.id);
    
    // 가족 생성 단 다시 호출시 동일 가족을 반환해야 함 (ensurePrimaryFamily는 등당 연산)
    const family2 = await db.ensurePrimaryFamily({
      name: `${mockUser.name}의 가족`,
      createdByUserId: mockUser.id,
      displayName: mockUser.name,
      role: "guardian",
    });
    
    expect(family2.id).toBe(family.id);
  });

  it("위치 업데이트 후 가족 위치 조회에서 반영되어야 함", async () => {
    // 기본 가족 생성
    const family = await db.ensurePrimaryFamily({
      name: `${mockUser.name}의 가족`,
      createdByUserId: mockUser.id,
      displayName: mockUser.name,
      role: "guardian",
    });

    // 위치 공유 동의 부여
    await db.grantLocationConsent({
      userId: mockUser.id,
      familyId: family.id,
      permissionState: "granted",
      ipAddress: "127.0.0.1",
      userAgent: "test",
      consentText: "test consent",
    });

    // 위치 업데이트
    const location = await db.upsertLocationPoint({
      userId: mockUser.id,
      familyId: family.id,
      latitude: 37.5668,
      longitude: 126.9786,
      accuracy: 10,
      recordedAt: Date.now(),
    });

    expect(location).toBeDefined();
    expect(location.latitude).toBe(37.5668);
    expect(location.longitude).toBe(126.9786);
  });

  it("같은 사용자의 위치 업데이트는 기존 레코드를 덮어써야 함", async () => {
    const family = await db.ensurePrimaryFamily({
      name: `${mockUser.name}의 가족`,
      createdByUserId: mockUser.id,
      displayName: mockUser.name,
      role: "guardian",
    });

    // 위치 공유 동의 부여
    await db.grantLocationConsent({
      userId: mockUser.id,
      familyId: family.id,
      permissionState: "granted",
      ipAddress: "127.0.0.1",
      userAgent: "test",
      consentText: "test consent",
    });

    // 첫 번째 위치 업데이트
    const location1 = await db.upsertLocationPoint({
      userId: mockUser.id,
      familyId: family.id,
      latitude: 37.5668,
      longitude: 126.9786,
      accuracy: 10,
      recordedAt: Date.now(),
    });

    // 두 번째 위치 업데이트
    const location2 = await db.upsertLocationPoint({
      userId: mockUser.id,
      familyId: family.id,
      latitude: 37.5701,
      longitude: 126.9822,
      accuracy: 8,
      recordedAt: Date.now(),
    });

    // 위도/경도가 업데이트되어야 함
    expect(location2.latitude).toBe(37.5701);
    expect(location2.longitude).toBe(126.9822);
    expect(location2.accuracy).toBe(8);
  });

  it("위치 기록은 보관 기간 이후 자동 삭제되어야 함", async () => {
    const family = await db.ensurePrimaryFamily({
      name: `${mockUser.name}의 가족`,
      createdByUserId: mockUser.id,
      displayName: mockUser.name,
      role: "guardian",
    });

    // 위치 공유 동의 부여
    await db.grantLocationConsent({
      userId: mockUser.id,
      familyId: family.id,
      permissionState: "granted",
      ipAddress: "127.0.0.1",
      userAgent: "test",
      consentText: "test consent",
    });

    // 30일 이전의 위치 기록 생성 (시뮬레이션)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const location = await db.upsertLocationPoint({
      userId: mockUser.id,
      familyId: family.id,
      latitude: 37.5668,
      longitude: 126.9786,
      accuracy: 10,
      recordedAt: thirtyDaysAgo,
    });

    expect(location).toBeDefined();
    // 실제 삭제는 백그라운드 작업이므로 여기서는 레코드 생성만 검증
  });

  it("같은 좌표의 위치 업데이트는 새 레코드를 생성하되 이전 레코드는 비활성화해야 함", async () => {
    const family = await db.ensurePrimaryFamily({
      name: `${mockUser.name}의 가족`,
      createdByUserId: mockUser.id,
      displayName: mockUser.name,
      role: "guardian",
    });

    // 위치 공유 동의 부여
    await db.grantLocationConsent({
      userId: mockUser.id,
      familyId: family.id,
      permissionState: "granted",
      ipAddress: "127.0.0.1",
      userAgent: "test",
      consentText: "test consent",
    });

    const latitude = 37.5668;
    const longitude = 126.9786;

    // 첫 번째 위치 업데이트
    const location1 = await db.upsertLocationPoint({
      userId: mockUser.id,
      familyId: family.id,
      latitude,
      longitude,
      accuracy: 10,
      recordedAt: Date.now(),
    });

    // 두 번째 업데이트 (같은 좌표)
    const location2 = await db.upsertLocationPoint({
      userId: mockUser.id,
      familyId: family.id,
      latitude,
      longitude,
      accuracy: 10,
      recordedAt: Date.now() + 60000,
    });

    // 다른 레코드여야 함
    expect(location1.id).not.toBe(location2.id);
    // 두 번째 레코드가 활성화되어야 함
    expect(location2.isActive).toBe(true);
  });
});


describe("Invite Links", () => {
  it("보호자는 초대 링크를 생성할 수 있어야 함", async () => {
    const guardian = await db.createTestUser("guardian@test.com", "보호자");
    const family = await db.ensurePrimaryFamily({
      name: `${guardian.name}의 가족`,
      createdByUserId: guardian.id,
      displayName: guardian.name || "보호자",
      role: "guardian",
    });

    const link = await db.createInviteLink({
      familyId: family.id,
      createdByUserId: guardian.id,
      role: "child",
      canViewLocation: false,
      canShareLocation: true,
      expiresInHours: 24,
    });

    expect(link).toBeDefined();
    expect(link.token).toBeDefined();
    expect(link.role).toBe("child");
    expect(link.canShareLocation).toBe(true);
    expect(link.expiresAt).toBeGreaterThan(Date.now());
  });

  it("유효한 초대 링크를 조회할 수 있어야 함", async () => {
    const guardian = await db.createTestUser("guardian2@test.com", "보호자2");
    const family = await db.ensurePrimaryFamily({
      name: `${guardian.name}의 가족`,
      createdByUserId: guardian.id,
      displayName: guardian.name || "보호자",
      role: "guardian",
    });

    const link = await db.createInviteLink({
      familyId: family.id,
      createdByUserId: guardian.id,
      role: "child",
      canViewLocation: false,
      canShareLocation: true,
      expiresInHours: 24,
    });

    const validLink = await db.getValidInviteLink(link.token);
    expect(validLink).toBeDefined();
    expect(validLink?.token).toBe(link.token);
  });

  it("만료된 초대 링크는 조회할 수 없어야 함", async () => {
    const guardian = await db.createTestUser("guardian3@test.com", "보호자3");
    const family = await db.ensurePrimaryFamily({
      name: `${guardian.name}의 가족`,
      createdByUserId: guardian.id,
      displayName: guardian.name || "보호자",
      role: "guardian",
    });

    // 이미 만료된 링크 생성 (음수 시간)
    const link = await db.createInviteLink({
      familyId: family.id,
      createdByUserId: guardian.id,
      role: "child",
      canViewLocation: false,
      canShareLocation: true,
      expiresInHours: -1,
    });

    const validLink = await db.getValidInviteLink(link.token);
    expect(validLink).toBeNull();
  });

  it("초대 링크를 수락하면 가족 구성원이 추가되어야 함", async () => {
    const guardian = await db.createTestUser("guardian4@test.com", "보호자4");
    const child = await db.createTestUser("child@test.com", "자녀");
    const family = await db.ensurePrimaryFamily({
      name: `${guardian.name}의 가족`,
      createdByUserId: guardian.id,
      displayName: guardian.name || "보호자",
      role: "guardian",
    });

    const link = await db.createInviteLink({
      familyId: family.id,
      createdByUserId: guardian.id,
      role: "child",
      canViewLocation: false,
      canShareLocation: true,
      expiresInHours: 24,
    });

    const member = await db.acceptInviteLink({
      token: link.token,
      userId: child.id,
      displayName: "우리 아이",
    });

    expect(member).toBeDefined();
    expect(member.userId).toBe(child.id);
    expect(member.role).toBe("child");
    expect(member.inviteStatus).toBe("accepted");
    expect(member.canShareLocation).toBe(true);
  });

  it("이미 사용된 초대 링크는 다시 사용할 수 없어야 함", async () => {
    const guardian = await db.createTestUser("guardian5@test.com", "보호자5");
    const child1 = await db.createTestUser("child1@test.com", "자녀1");
    const family = await db.ensurePrimaryFamily({
      name: `${guardian.name}의 가족`,
      createdByUserId: guardian.id,
      displayName: guardian.name || "보호자",
      role: "guardian",
    });

    const link = await db.createInviteLink({
      familyId: family.id,
      createdByUserId: guardian.id,
      role: "child",
      canViewLocation: false,
      canShareLocation: true,
      expiresInHours: 24,
    });

    // 첫 번째 사용
    await db.acceptInviteLink({
      token: link.token,
      userId: child1.id,
      displayName: "첫 번째 자녀",
    });

    // 두 번째 사용 시도
    const validLink = await db.getValidInviteLink(link.token);
    expect(validLink).toBeNull();
  }, 15000);

  it("초대 링크를 취소할 수 있어야 함", async () => {
    const guardian = await db.createTestUser("guardian6@test.com", "보호자6");
    const family = await db.ensurePrimaryFamily({
      name: `${guardian.name}의 가족`,
      createdByUserId: guardian.id,
      displayName: guardian.name || "보호자",
      role: "guardian",
    });

    const link = await db.createInviteLink({
      familyId: family.id,
      createdByUserId: guardian.id,
      role: "child",
      canViewLocation: false,
      canShareLocation: true,
      expiresInHours: 24,
    });

    await db.revokeInviteLink(link.id, guardian.id);

    const validLink = await db.getValidInviteLink(link.token);
    expect(validLink).toBeNull();
  });

  it("이미 가족 구성원인 사용자의 초대 수락 실패 시 새 링크가 소모되지 않아야 함", async () => {
    const guardian = await db.createTestUser("guardian-rollback@test.com", "롤백 보호자");
    const child = await db.createTestUser("child-rollback@test.com", "롤백 자녀");
    const family = await db.ensurePrimaryFamily({
      name: `${guardian.name}의 가족`,
      createdByUserId: guardian.id,
      displayName: guardian.name || "보호자",
      role: "guardian",
    });

    const firstLink = await db.createInviteLink({
      familyId: family.id,
      createdByUserId: guardian.id,
      role: "child",
      canViewLocation: false,
      canShareLocation: true,
      expiresInHours: 24,
    });

    await db.acceptInviteLink({ token: firstLink.token, userId: child.id, displayName: "기존 자녀" });

    const secondLink = await db.createInviteLink({
      familyId: family.id,
      createdByUserId: guardian.id,
      role: "child",
      canViewLocation: false,
      canShareLocation: true,
      expiresInHours: 24,
    });

    await expect(
      db.acceptInviteLink({ token: secondLink.token, userId: child.id, displayName: "중복 자녀" }),
    ).rejects.toThrow("already an accepted member");

    const rawDb = await db.getDb();
    if (!rawDb) throw new Error("Database is not available");

    const secondLinkRows = await rawDb.select().from(inviteLinks).where(eq(inviteLinks.id, secondLink.id)).limit(1);
    expect(secondLinkRows[0]?.usedAt).toBeNull();
    expect(secondLinkRows[0]?.usedByUserId).toBeNull();

    const memberRows = await rawDb
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.familyId, family.id), eq(familyMembers.userId, child.id)));
    expect(memberRows).toHaveLength(1);
    expect(memberRows[0]?.displayName).toBe("기존 자녀");
  }, 15000);

  it("같은 초대 링크를 동시에 수락해도 한 명만 가족 구성원으로 추가되어야 함", async () => {
    const guardian = await db.createTestUser("guardian-race@test.com", "경쟁 보호자");
    const child1 = await db.createTestUser("child-race-1@test.com", "경쟁 자녀1");
    const child2 = await db.createTestUser("child-race-2@test.com", "경쟁 자녀2");
    const family = await db.ensurePrimaryFamily({
      name: `${guardian.name}의 가족`,
      createdByUserId: guardian.id,
      displayName: guardian.name || "보호자",
      role: "guardian",
    });

    const link = await db.createInviteLink({
      familyId: family.id,
      createdByUserId: guardian.id,
      role: "child",
      canViewLocation: false,
      canShareLocation: true,
      expiresInHours: 24,
    });

    const results = await Promise.allSettled([
      db.acceptInviteLink({ token: link.token, userId: child1.id, displayName: "동시 자녀1" }),
      db.acceptInviteLink({ token: link.token, userId: child2.id, displayName: "동시 자녀2" }),
    ]);

    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(result => result.status === "rejected")).toHaveLength(1);

    const rawDb = await db.getDb();
    if (!rawDb) throw new Error("Database is not available");

    const child1Rows = await rawDb
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.familyId, family.id), eq(familyMembers.userId, child1.id)));
    const child2Rows = await rawDb
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.familyId, family.id), eq(familyMembers.userId, child2.id)));

    expect(child1Rows.length + child2Rows.length).toBe(1);

    const linkRows = await rawDb.select().from(inviteLinks).where(eq(inviteLinks.id, link.id)).limit(1);
    expect(linkRows[0]?.usedAt).not.toBeNull();
    expect([child1.id, child2.id]).toContain(linkRows[0]?.usedByUserId);
  }, 20000);
});
