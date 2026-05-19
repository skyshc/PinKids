import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useOnboardingModal } from "@/contexts/OnboardingModalContext";
import {
  CheckCircle2,
  ChevronRight,
  Home as HomeIcon,
  Link as LinkIcon,
  Navigation,
  School,
  UsersRound,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Share2 } from "lucide-react";
import QRCode from "qrcode";

const SAFE_ZONE_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663647991675/fuW72okeNRT65TWogzSyTX/safe_zone_map_panel-nKsP8JNgSZn5kRByHJN79H.webp";
const CHECKIN_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663647991675/fuW72okeNRT65TWogzSyTX/family_checkin_cards-4CKchbXzvvatvQuYwCk4NE.webp";

const timeline = [
  { label: "학교 도착", time: "08:18", icon: School },
  { label: "방과 후 학원 이동", time: "15:32", icon: Navigation },
  { label: "가족에게 체크인", time: "16:05", icon: CheckCircle2 },
  { label: "집 반경 접근", time: "예상 18:12", icon: HomeIcon },
];

const steps = [
  {
    step: "01",
    title: "소셜 로그인",
    desc: "카카오톡 또는 구글 계정으로 보호자 인증을 완료합니다. 별도 회원가입 없이 3초 안에 시작할 수 있습니다.",
    color: "mint",
  },
  {
    step: "02",
    title: "가족 역할 설정",
    desc: "부모, 보호자, 자녀 역할을 선택합니다. 역할에 따라 위치를 보거나 공유하는 권한이 달라집니다.",
    color: "peach",
  },
  {
    step: "03",
    title: "위치 정보 동의",
    desc: "브라우저 위치 권한을 허용하면 현재 위치가 가족 지도에 표시됩니다. 언제든 철회할 수 있습니다.",
    color: "cream",
  },
  {
    step: "04",
    title: "가족 초대 & 확인",
    desc: "초대 링크를 생성해 가족에게 공유하면 같은 가족 그룹에서 위치를 함께 확인할 수 있습니다.",
    color: "mint",
  },
];

export default function HowTo() {
  const { isAuthenticated } = useAuth();
  const { openOnboarding } = useOnboardingModal();

  const [inviteRole, setInviteRole] = useState<"child" | "guardian">("child");
  const [createdInviteUrl, setCreatedInviteUrl] = useState("");
  const [inviteQrCodeUrl, setInviteQrCodeUrl] = useState("");

  const trpcUtils = trpc.useUtils();
  const familyMembershipsQuery = trpc.family.myMemberships.useQuery(undefined, { enabled: isAuthenticated });
  const primaryGuardianMembership = familyMembershipsQuery.data?.memberships.find(
    m => m.role === "guardian" && m.inviteStatus === "accepted",
  );
  const primaryFamilyId = primaryGuardianMembership?.familyId ?? 0;

  const familyInviteLinksQuery = trpc.invites.getFamilyLinks.useQuery(
    { familyId: primaryFamilyId },
    { enabled: Boolean(primaryGuardianMembership), retry: false },
  );
  const activeInviteLinks =
    familyInviteLinksQuery.data?.links.filter(
      link => !link.usedAt && !link.revokedAt && link.expiresAt > Date.now(),
    ) ?? [];

  const createInviteLinkMutation = trpc.invites.create.useMutation({
    onSuccess: async result => {
      const inviteUrl = `${window.location.origin}/invite/${result.link.token}`;
      setCreatedInviteUrl(inviteUrl);
      await trpcUtils.invites.getFamilyLinks.invalidate();
      toast("가족 초대 링크가 생성되었습니다.", {
        description: "24시간 동안 사용할 수 있는 초대 링크를 복사하거나 공유할 수 있습니다.",
      });
      QRCode.toDataURL(inviteUrl, {
        width: 220,
        margin: 2,
        color: { dark: "#17324d", light: "#fff7e7" },
      })
        .then(url => setInviteQrCodeUrl(url))
        .catch(() => setInviteQrCodeUrl(""));
    },
    onError: error => {
      toast.error("초대 링크 생성에 실패했습니다.", {
        description: error.message || "보호자 권한과 네트워크 상태를 확인해주세요.",
      });
    },
  });

  const revokeInviteLinkMutation = trpc.invites.revoke.useMutation({
    onSuccess: async () => {
      setCreatedInviteUrl("");
      setInviteQrCodeUrl("");
      await trpcUtils.invites.getFamilyLinks.invalidate();
      toast("초대 링크를 취소했습니다.");
    },
  });

  const createFamilyInviteUrl = async () => {
    if (!isAuthenticated) {
      toast("로그인이 먼저 필요합니다.");
      openOnboarding(0);
      return;
    }
    if (!primaryGuardianMembership) {
      toast("초대 가능한 가족 그룹이 없습니다.", {
        description: "위치 동의를 완료하거나 보호자 권한으로 가족 그룹에 참여한 뒤 초대 링크를 만들 수 있습니다.",
      });
      openOnboarding(1);
      return;
    }
    await createInviteLinkMutation.mutateAsync({
      familyId: primaryGuardianMembership.familyId,
      role: inviteRole,
      canViewLocation: inviteRole === "guardian",
      canShareLocation: true,
      expiresInHours: 24,
    });
  };

  const copyInviteUrl = async () => {
    if (!createdInviteUrl) return;
    await navigator.clipboard.writeText(createdInviteUrl);
    toast("초대 링크를 복사했습니다.");
  };

  const shareInviteUrl = async () => {
    if (!createdInviteUrl) return;
    if (navigator.share) {
      await navigator.share({ title: "핀키즈 가족 초대", url: createdInviteUrl });
      return;
    }
    await copyInviteUrl();
  };

  return (
    <AppLayout>
      {/* Hero */}
      <section className="relative border-b-[3px] border-[#17324d] py-20 lg:py-28">
        <div className="absolute -left-16 top-12 h-56 w-56 rounded-full bg-[#8fd3b6]/30 blur-3xl" />
        <div className="container relative z-10 max-w-3xl">
          <div className="mb-6 inline-block border-[3px] border-[#17324d] bg-[#f8d9a8] px-4 py-2 text-sm font-black shadow-[4px_4px_0_#17324d]">
            사용 흐름
          </div>
          <h1 className="font-display text-5xl leading-tight tracking-[-0.04em] sm:text-6xl">
            설정은 짧고,
            <span className="block text-[#1d8664]">확인은 더 짧게.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#314b62]">
            핀키즈는 복잡한 설정 없이 4단계만으로 가족 위치 공유를 시작할 수 있습니다.
          </p>
          {!isAuthenticated && (
            <Button
              onClick={() => openOnboarding(0)}
              className="mt-8 h-14 border-[3px] border-[#17324d] bg-[#8fd3b6] px-7 text-base font-black text-[#17324d] shadow-[6px_6px_0_#17324d] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-[#9ee4c6] hover:shadow-[3px_3px_0_#17324d]"
            >
              지금 시작하기
            </Button>
          )}
        </div>
      </section>

      {/* Steps */}
      <section className="container py-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(s => (
            <div
              key={s.step}
              className="border-[3px] border-[#17324d] bg-[#fffdf5] p-6 shadow-[7px_7px_0_#17324d]"
            >
              <div
                className={`mb-5 inline-flex h-12 w-12 items-center justify-center border-[3px] border-[#17324d] font-display text-xl font-black shadow-[4px_4px_0_#17324d] ${
                  s.color === "mint" ? "bg-[#8fd3b6]" : s.color === "peach" ? "bg-[#f2a37b]" : "bg-[#f8d9a8]"
                }`}
              >
                {s.step}
              </div>
              <h3 className="text-xl font-black">{s.title}</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-[#51677a]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline + image */}
      <section className="container pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative order-2 lg:order-1">
            <img
              src={SAFE_ZONE_IMAGE}
              alt="안전 구역 지도 패널"
              className="w-full border-[4px] border-[#17324d] bg-[#fffdf5] shadow-[12px_12px_0_#17324d]"
            />
            <img
              src={CHECKIN_IMAGE}
              alt="가족 체크인 카드"
              className="absolute -bottom-12 -right-5 hidden w-[52%] rotate-3 border-[4px] border-[#17324d] bg-[#fffdf5] shadow-[10px_10px_0_#f2a37b] md:block"
            />
          </div>
          <div className="order-1 lg:order-2">
            <p className="mb-4 inline-block border-[3px] border-[#17324d] bg-[#f8d9a8] px-4 py-2 text-sm font-black shadow-[4px_4px_0_#17324d]">
              하루 이동 예시
            </p>
            <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
              아이의 하루를 타임라인으로 확인합니다.
            </h2>
            <div className="mt-8 space-y-5">
              {timeline.map((item, index) => (
                <div key={item.label} className="relative flex gap-5">
                  {index !== timeline.length - 1 && (
                    <span className="absolute left-[22px] top-12 h-[calc(100%+4px)] w-[3px] bg-[#17324d]" />
                  )}
                  <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-[#17324d] bg-[#8fd3b6] shadow-[4px_4px_0_#17324d]">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 border-[3px] border-[#17324d] bg-[#fffdf5] p-4 shadow-[5px_5px_0_#17324d]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black">{item.label}</p>
                      <p className="text-sm font-black text-[#1d8664]">{item.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Invite section */}
      <section className="container pb-24">
        <div className="grid gap-8 border-[4px] border-[#17324d] bg-[#f2a37b] p-8 shadow-[12px_12px_0_#17324d] lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:p-12">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 border-[3px] border-[#17324d] bg-[#fff7e7] px-4 py-2 text-sm font-black shadow-[4px_4px_0_#17324d]">
              <LinkIcon className="h-4 w-4" /> 가족 초대
            </p>
            <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
              가족 초대 링크로 간단히 시작하세요.
            </h2>
            <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-[#243e55]">
              보호자가 24시간 유효한 초대 링크를 만들면 가족 구성원이 로그인 후 바로 같은 가족 그룹에 참여할 수 있습니다.
            </p>
            <div className="mt-6 grid gap-3 text-sm font-black sm:grid-cols-3">
              <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-3 shadow-[4px_4px_0_#17324d]">
                만료 시간<br /><span className="text-[#1d8664]">24시간</span>
              </div>
              <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-3 shadow-[4px_4px_0_#17324d]">
                초대 대상<br /><span className="text-[#1d8664]">자녀/보호자</span>
              </div>
              <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-3 shadow-[4px_4px_0_#17324d]">
                수락 방식<br /><span className="text-[#1d8664]">로그인 후 참여</span>
              </div>
            </div>
          </div>

          {/* Invite form */}
          <div className="border-[4px] border-[#17324d] bg-[#fff7e7] p-5 shadow-[8px_8px_0_#17324d]">
            {!isAuthenticated ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <p className="font-black">초대 링크를 생성하려면 먼저 로그인해주세요.</p>
                <Button
                  onClick={() => openOnboarding(0)}
                  className="border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[4px_4px_0_#f2a37b] hover:bg-[#254462]"
                >
                  소셜 로그인으로 시작
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm font-black text-[#51677a]">초대할 가족 역할</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteRole("child")}
                    className={`border-[3px] border-[#17324d] p-4 text-left font-black shadow-[4px_4px_0_#17324d] transition-all ${inviteRole === "child" ? "bg-[#8fd3b6]" : "bg-[#fffdf5] hover:bg-white"}`}
                  >
                    자녀
                    <span className="mt-1 block text-xs font-bold text-[#51677a]">위치 공유 가능</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteRole("guardian")}
                    className={`border-[3px] border-[#17324d] p-4 text-left font-black shadow-[4px_4px_0_#17324d] transition-all ${inviteRole === "guardian" ? "bg-[#8fd3b6]" : "bg-[#fffdf5] hover:bg-white"}`}
                  >
                    보호자
                    <span className="mt-1 block text-xs font-bold text-[#51677a]">위치 보기/공유 가능</span>
                  </button>
                </div>
                <Button
                  onClick={createFamilyInviteUrl}
                  disabled={createInviteLinkMutation.isPending}
                  className="mt-5 h-14 w-full border-[3px] border-[#17324d] bg-[#17324d] px-7 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462] disabled:opacity-70"
                >
                  <UsersRound className="mr-2 h-5 w-5" />
                  {createInviteLinkMutation.isPending ? "초대 링크 생성 중" : "초대 링크 생성"}
                </Button>
                {createdInviteUrl && (
                  <div className="mt-5 space-y-3 border-[3px] border-[#17324d] bg-[#fffdf5] p-4 shadow-[5px_5px_0_#8fd3b6]">
                    <p className="text-sm font-black">생성된 초대 링크</p>
                    <div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
                      <div className="flex min-h-[160px] items-center justify-center border-[3px] border-[#17324d] bg-[#fff7e7] p-3 shadow-[4px_4px_0_#17324d]">
                        {inviteQrCodeUrl ? (
                          <img src={inviteQrCodeUrl} alt="가족 초대 QR 코드" className="h-32 w-32" />
                        ) : (
                          <span className="text-xs font-black text-[#51677a]">QR 생성 중</span>
                        )}
                      </div>
                      <div>
                        <div className="break-all border-[3px] border-[#17324d] bg-white p-3 text-xs font-bold text-[#314b62]">
                          {createdInviteUrl}
                        </div>
                        <p className="mt-2 text-xs font-bold text-[#51677a]">
                          QR 코드는 현재 브라우저에서 생성되며, 링크와 동일하게 24시간 동안 사용할 수 있습니다.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        onClick={copyInviteUrl}
                        variant="outline"
                        className="h-12 border-[3px] border-[#17324d] bg-[#fff7e7] font-black shadow-[4px_4px_0_#17324d] hover:bg-white"
                      >
                        <Copy className="mr-2 h-4 w-4" />복사
                      </Button>
                      <Button
                        onClick={shareInviteUrl}
                        variant="outline"
                        className="h-12 border-[3px] border-[#17324d] bg-[#fff7e7] font-black shadow-[4px_4px_0_#17324d] hover:bg-white"
                      >
                        <Share2 className="mr-2 h-4 w-4" />공유
                      </Button>
                    </div>
                  </div>
                )}
                <div className="mt-5 border-[3px] border-[#17324d] bg-[#fffdf5] p-4 shadow-[5px_5px_0_#f2a37b]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black">활성 초대 링크</p>
                    <span className="border-[2px] border-[#17324d] bg-[#8fd3b6] px-2 py-1 text-xs font-black">
                      {activeInviteLinks.length}개
                    </span>
                  </div>
                  {familyInviteLinksQuery.isLoading ? (
                    <p className="mt-3 text-xs font-bold text-[#51677a]">초대 상태를 불러오는 중입니다.</p>
                  ) : activeInviteLinks.length === 0 ? (
                    <p className="mt-3 text-xs font-bold text-[#51677a]">현재 공유 가능한 활성 초대 링크가 없습니다.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {activeInviteLinks.slice(0, 3).map(link => (
                        <div
                          key={link.id}
                          className="grid gap-2 border-[2px] border-[#17324d] bg-white p-3 text-xs font-bold sm:grid-cols-[1fr_auto] sm:items-center"
                        >
                          <div>
                            <p className="font-black">
                              {link.role === "guardian" ? "보호자" : "자녀"} 초대 ·{" "}
                              {new Date(link.expiresAt).toLocaleString()} 만료
                            </p>
                            <p className="mt-1 text-[#51677a]">
                              상태: pending · 위치 보기 {link.canViewLocation ? "허용" : "미허용"} · 위치 공유{" "}
                              {link.canShareLocation ? "허용" : "미허용"}
                            </p>
                          </div>
                          <Button
                            onClick={() => revokeInviteLinkMutation.mutateAsync({ linkId: link.id })}
                            disabled={revokeInviteLinkMutation.isPending}
                            variant="outline"
                            className="h-9 border-[2px] border-[#17324d] bg-[#fff7e7] text-xs font-black hover:bg-white"
                          >
                            취소
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="container pb-24">
          <div className="flex flex-col items-center gap-4 border-[4px] border-[#17324d] bg-[#8fd3b6] p-10 shadow-[12px_12px_0_#17324d] text-center">
            <h2 className="font-display text-4xl leading-tight tracking-[-0.03em]">
              준비가 되셨나요?
            </h2>
            <p className="text-base font-bold text-[#243e55]">
              소셜 로그인 한 번으로 가족 위치 공유를 시작할 수 있습니다.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => openOnboarding(0)}
                className="h-14 border-[3px] border-[#17324d] bg-[#17324d] px-10 text-base font-black text-[#fff7e7] shadow-[5px_5px_0_#17324d] hover:bg-[#254462]"
              >
                소셜 로그인으로 시작
              </Button>
              <Link href="/features">
                <Button
                  variant="outline"
                  className="h-14 border-[3px] border-[#17324d] bg-[#fff7e7] px-10 text-base font-black shadow-[5px_5px_0_#17324d] hover:bg-white"
                >
                  기능 살펴보기 <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </AppLayout>
  );
}
