import { describe, expect, it } from "vitest";
import { calculateDistanceMeters, getGeofenceTransition } from "./db";

describe("Geofence distance and transition rules", () => {
  it("Haversine 거리 계산으로 같은 좌표는 0m에 가깝게 반환해야 함", () => {
    const distance = calculateDistanceMeters(
      { latitude: 37.5668, longitude: 126.9786 },
      { latitude: 37.5668, longitude: 126.9786 },
    );

    expect(distance).toBeLessThan(0.01);
  });

  it("서울 시청 인근의 짧은 이동 거리를 미터 단위로 계산해야 함", () => {
    const distance = calculateDistanceMeters(
      { latitude: 37.5668, longitude: 126.9786 },
      { latitude: 37.5701, longitude: 126.9822 },
    );

    expect(distance).toBeGreaterThan(450);
    expect(distance).toBeLessThan(550);
  });

  it("안전 구역 안에서 밖으로 이동하면 exit 이벤트를 반환해야 함", () => {
    expect(
      getGeofenceTransition({
        previousDistanceMeters: 120,
        currentDistanceMeters: 420,
        radiusMeters: 300,
      }),
    ).toBe("exit");
  });

  it("안전 구역 밖에서 안으로 이동하면 enter 이벤트를 반환해야 함", () => {
    expect(
      getGeofenceTransition({
        previousDistanceMeters: 420,
        currentDistanceMeters: 120,
        radiusMeters: 300,
      }),
    ).toBe("enter");
  });

  it("이전과 현재가 모두 같은 안팎 상태이면 중복 알림을 만들지 않아야 함", () => {
    expect(
      getGeofenceTransition({
        previousDistanceMeters: 80,
        currentDistanceMeters: 120,
        radiusMeters: 300,
      }),
    ).toBeNull();

    expect(
      getGeofenceTransition({
        previousDistanceMeters: 500,
        currentDistanceMeters: 700,
        radiusMeters: 300,
      }),
    ).toBeNull();
  });

  it("첫 좌표가 이미 구역 밖이면 보호자가 확인할 수 있도록 exit 이벤트를 반환해야 함", () => {
    expect(
      getGeofenceTransition({
        previousDistanceMeters: null,
        currentDistanceMeters: 700,
        radiusMeters: 300,
      }),
    ).toBe("exit");
  });
});
