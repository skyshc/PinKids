import { describe, expect, it } from "vitest";
import { buildSocialLoginUrl } from "../client/src/lib/socialLogin";

describe("buildSocialLoginUrl", () => {
  it("adds Kakao provider hints to the base auth URL", () => {
    const result = buildSocialLoginUrl(
      "https://auth.example.com/app-auth?appId=demo&type=signIn",
      "kakao"
    );
    const url = new URL(result);

    expect(url.searchParams.get("provider")).toBe("kakao");
    expect(url.searchParams.get("login_hint_provider")).toBe("kakao");
    expect(url.searchParams.get("appId")).toBe("demo");
  });

  it("adds Google provider hints to the base auth URL", () => {
    const result = buildSocialLoginUrl(
      "https://auth.example.com/app-auth?appId=demo&type=signIn",
      "google"
    );
    const url = new URL(result);

    expect(url.searchParams.get("provider")).toBe("google");
    expect(url.searchParams.get("login_hint_provider")).toBe("google");
    expect(url.searchParams.get("type")).toBe("signIn");
  });
});
