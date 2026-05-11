import { describe, expect, it } from "vitest";
import {
  BROWSER_SETTING_GUIDES,
  getLocationPermissionPanelCopy,
  getLocationPermissionStatusLabel,
  mapBrowserPermissionState,
  queryGeolocationPermission,
} from "../client/src/lib/locationPermission";

describe("location permission UX helpers", () => {
  it("maps browser permission states to UI states", () => {
    expect(mapBrowserPermissionState("granted")).toBe("granted");
    expect(mapBrowserPermissionState("prompt")).toBe("prompt");
    expect(mapBrowserPermissionState("denied")).toBe("blocked");
    expect(mapBrowserPermissionState("unsupported")).toBe("idle");
  });

  it("returns Korean labels and blocked copy for browser setting guidance", () => {
    expect(getLocationPermissionStatusLabel("blocked")).toBe("브라우저에서 차단됨");
    expect(getLocationPermissionPanelCopy("blocked").title).toContain("브라우저 설정");
    expect(BROWSER_SETTING_GUIDES.length).toBeGreaterThanOrEqual(3);
  });

  it("queries geolocation permission when Permissions API is available", async () => {
    const result = await queryGeolocationPermission({
      permissions: {
        query: async () => ({ state: "prompt" }),
      },
    });

    expect(result).toBe("prompt");
  });

  it("falls back to unsupported when permission query fails", async () => {
    const result = await queryGeolocationPermission({
      permissions: {
        query: async () => {
          throw new Error("not available");
        },
      },
    });

    expect(result).toBe("unsupported");
  });
});
