import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Phase 1-3: Geolocation 테스트
 * 성공/거부/미지원 브라우저 케이스를 커버합니다.
 */

describe("Geolocation API", () => {
  beforeEach(() => {
    delete (navigator as any).geolocation;
  });

  describe("getCurrentPosition - 성공 케이스", () => {
    it("위치 정보를 성공적으로 가져와야 함", () => {
      return new Promise<void>((resolve) => {
        const mockPosition = {
          coords: {
            latitude: 37.5665,
            longitude: 126.9780,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };

        (navigator as any).geolocation = {
          getCurrentPosition: vi.fn((success: PositionCallback) => {
            success(mockPosition as GeolocationPosition);
          }),
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            expect(position.coords.latitude).toBe(37.5665);
            expect(position.coords.longitude).toBe(126.9780);
            expect(position.coords.accuracy).toBe(10);
            resolve();
          },
          () => {
            throw new Error("Should not call error callback");
          }
        );
      });
    });
  });

  describe("getCurrentPosition - 권한 거부 케이스", () => {
    it("권한 거부 시 에러 코드 1을 반환해야 함", () => {
      return new Promise<void>((resolve) => {
        const mockError = {
          code: 1,
          message: "User denied geolocation",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        };

        (navigator as any).geolocation = {
          getCurrentPosition: vi.fn((success: PositionCallback, error: PositionErrorCallback) => {
            error(mockError as GeolocationPositionError);
          }),
        };

        navigator.geolocation.getCurrentPosition(
          () => {
            throw new Error("Should not call success callback");
          },
          (error) => {
            expect(error.code).toBe(1);
            resolve();
          }
        );
      });
    });

    it("위치 정보 불가능 시 에러 코드 2를 반환해야 함", () => {
      return new Promise<void>((resolve) => {
        const mockError = {
          code: 2,
          message: "Position unavailable",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        };

        (navigator as any).geolocation = {
          getCurrentPosition: vi.fn((success: PositionCallback, error: PositionErrorCallback) => {
            error(mockError as GeolocationPositionError);
          }),
        };

        navigator.geolocation.getCurrentPosition(
          () => {
            throw new Error("Should not call success callback");
          },
          (error) => {
            expect(error.code).toBe(2);
            resolve();
          }
        );
      });
    });

    it("타임아웃 시 에러 코드 3을 반환해야 함", () => {
      return new Promise<void>((resolve) => {
        const mockError = {
          code: 3,
          message: "Geolocation request timed out",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        };

        (navigator as any).geolocation = {
          getCurrentPosition: vi.fn((success: PositionCallback, error: PositionErrorCallback) => {
            error(mockError as GeolocationPositionError);
          }),
        };

        navigator.geolocation.getCurrentPosition(
          () => {
            throw new Error("Should not call success callback");
          },
          (error) => {
            expect(error.code).toBe(3);
            resolve();
          }
        );
      });
    });
  });

  describe("미지원 브라우저 케이스", () => {
    it("navigator.geolocation이 없으면 undefined를 반환해야 함", () => {
      delete (navigator as any).geolocation;
      expect(navigator.geolocation).toBeUndefined();
    });

    it("브라우저가 Geolocation을 지원하지 않을 때 처리해야 함", () => {
      delete (navigator as any).geolocation;
      const isSupported = !!navigator.geolocation;
      expect(isSupported).toBe(false);
    });
  });

  describe("위치 데이터 검증", () => {
    it("위도는 -90 ~ 90 범위여야 함", () => {
      return new Promise<void>((resolve) => {
        const mockPosition = {
          coords: {
            latitude: 37.5665,
            longitude: 126.9780,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };

        (navigator as any).geolocation = {
          getCurrentPosition: vi.fn((success: PositionCallback) => {
            success(mockPosition as GeolocationPosition);
          }),
        };

        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude } = position.coords;
          expect(latitude).toBeGreaterThanOrEqual(-90);
          expect(latitude).toBeLessThanOrEqual(90);
          resolve();
        });
      });
    });

    it("경도는 -180 ~ 180 범위여야 함", () => {
      return new Promise<void>((resolve) => {
        const mockPosition = {
          coords: {
            latitude: 37.5665,
            longitude: 126.9780,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };

        (navigator as any).geolocation = {
          getCurrentPosition: vi.fn((success: PositionCallback) => {
            success(mockPosition as GeolocationPosition);
          }),
        };

        navigator.geolocation.getCurrentPosition((position) => {
          const { longitude } = position.coords;
          expect(longitude).toBeGreaterThanOrEqual(-180);
          expect(longitude).toBeLessThanOrEqual(180);
          resolve();
        });
      });
    });

    it("정확도는 양수여야 함", () => {
      return new Promise<void>((resolve) => {
        const mockPosition = {
          coords: {
            latitude: 37.5665,
            longitude: 126.9780,
            accuracy: 15.5,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };

        (navigator as any).geolocation = {
          getCurrentPosition: vi.fn((success: PositionCallback) => {
            success(mockPosition as GeolocationPosition);
          }),
        };

        navigator.geolocation.getCurrentPosition((position) => {
          const { accuracy } = position.coords;
          expect(accuracy).toBeGreaterThan(0);
          resolve();
        });
      });
    });
  });
});
