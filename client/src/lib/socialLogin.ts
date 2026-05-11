export type SocialLoginProvider = "kakao" | "google";

export function buildSocialLoginUrl(baseLoginUrl: string, provider: SocialLoginProvider) {
  const url = new URL(baseLoginUrl);
  url.searchParams.set("provider", provider);
  url.searchParams.set("login_hint_provider", provider);
  return url.toString();
}
