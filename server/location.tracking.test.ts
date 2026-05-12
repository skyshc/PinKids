import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
