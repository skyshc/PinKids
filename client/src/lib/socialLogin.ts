export type SocialLoginProvider = "kakao" | "google";

/**
 * Manus OAuth 포털은 앱 공통 인증 URL을 기준으로 동작한다.
 *
 * 개별 소셜 버튼에서 provider 쿼리 파라미터를 임의로 추가하면 포털의
 * 내부 라우팅/콜백 계약과 충돌할 수 있으므로, 실제 이동 URL은 원본
 * 인증 URL을 그대로 유지한다. 선택한 provider는 호출부에서
 * localStorage에 보관해 앱 복귀 후 안내 문구에만 사용한다.
 */
export function buildSocialLoginUrl(baseLoginUrl: string, _provider: SocialLoginProvider) {
  const url = new URL(baseLoginUrl);
  url.searchParams.delete("provider");
  url.searchParams.delete("login_hint_provider");
  return url.toString();
}
