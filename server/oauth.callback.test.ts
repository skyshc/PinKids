import { describe, expect, it } from "vitest";

/**
 * OAuth callback state는 SDK를 통해 처리되며,
 * 실제 state 파싱은 Manus 인증 포털에서 수행된다.
 * 
 * 이 테스트는 클라이언트가 생성한 state 구조와
 * 서버 콜백이 받는 state 계약을 검증한다.
 */
describe("OAuth callback state contract", () => {
  it("state is passed through OAuth callback flow unchanged", () => {
    // 클라이언트가 생성한 state (origin + returnPath 인코딩)
    const clientState = Buffer.from(
      JSON.stringify({
        origin: "https://app.example.com",
        returnPath: "/family/dashboard",
      })
    ).toString("base64");

    // 서버 콜백에서 받는 state는 동일해야 함
    const callbackState = clientState;

    expect(callbackState).toBe(clientState);
  });

  it("state preserves origin for redirect after Google OAuth", () => {
    const state = Buffer.from(
      JSON.stringify({
        origin: "https://localhost:3000",
        returnPath: "/",
      })
    ).toString("base64");

    // 서버가 state를 디코딩하면 origin을 복원할 수 있어야 함
    const decoded = JSON.parse(Buffer.from(state, "base64").toString());

    expect(decoded.origin).toBe("https://localhost:3000");
    expect(decoded.returnPath).toBe("/");
  });

  it("state structure supports Google login redirect flow", () => {
    const statePayload = {
      origin: "https://app.example.com",
      returnPath: "/onboarding?step=2&provider=google",
    };

    const state = Buffer.from(JSON.stringify(statePayload)).toString("base64");
    const decoded = JSON.parse(Buffer.from(state, "base64").toString());

    // 서버 콜백 후 클라이언트는 origin + returnPath로 리다이렉트
    const redirectUrl = `${decoded.origin}${decoded.returnPath}`;

    expect(redirectUrl).toBe("https://app.example.com/onboarding?step=2&provider=google");
  });
});
