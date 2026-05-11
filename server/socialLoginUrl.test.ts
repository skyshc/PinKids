import { describe, expect, it } from "vitest";
import { buildSocialLoginUrl } from "../client/src/lib/socialLogin";

describe("buildSocialLoginUrl", () => {
  it("keeps the canonical OAuth URL for Kakao without unsupported provider query pollution", () => {
    const result = buildSocialLoginUrl(
      "https://auth.example.com/app-auth?appId=demo&type=signIn&redirectUri=https%3A%2F%2Fapp.example.com%2Fapi%2Foauth%2Fcallback",
      "kakao"
    );
    const url = new URL(result);

    expect(url.searchParams.get("provider")).toBeNull();
    expect(url.searchParams.get("login_hint_provider")).toBeNull();
    expect(url.searchParams.get("appId")).toBe("demo");
    expect(url.searchParams.get("type")).toBe("signIn");
    expect(url.searchParams.get("redirectUri")).toBe("https://app.example.com/api/oauth/callback");
  });

  it("keeps the canonical OAuth URL for Google and removes stale provider hints", () => {
    const result = buildSocialLoginUrl(
      "https://auth.example.com/app-auth?appId=demo&type=signIn&provider=google&login_hint_provider=google",
      "google"
    );
    const url = new URL(result);

    expect(url.searchParams.get("provider")).toBeNull();
    expect(url.searchParams.get("login_hint_provider")).toBeNull();
    expect(url.searchParams.get("type")).toBe("signIn");
    expect(url.searchParams.get("appId")).toBe("demo");
  });

  it("preserves all base OAuth parameters when building Google login URL", () => {
    const baseUrl = "https://auth.example.com/app-auth?appId=test&type=signIn&redirectUri=https%3A%2F%2Flocalhost%3A3000%2Fapi%2Foauth%2Fcallback&state=abc123";
    const result = buildSocialLoginUrl(baseUrl, "google");
    const url = new URL(result);

    expect(url.searchParams.get("appId")).toBe("test");
    expect(url.searchParams.get("type")).toBe("signIn");
    expect(url.searchParams.get("redirectUri")).toBe("https://localhost:3000/api/oauth/callback");
    expect(url.searchParams.get("state")).toBe("abc123");
    expect(url.searchParams.get("provider")).toBeNull();
  });
});
