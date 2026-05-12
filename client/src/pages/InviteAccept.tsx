import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronLeft, Link as LinkIcon, Loader2, ShieldCheck, UsersRound, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const getInviteTokenFromPath = () => {
  if (typeof window === "undefined") return "";
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[0] === "invite" ? parts[1] ?? "" : "";
};

export default function InviteAccept() {
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const token = useMemo(() => getInviteTokenFromPath(), []);
  const trpcUtils = trpc.useUtils();

  const inviteQuery = trpc.invites.getValid.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const acceptMutation = trpc.invites.accept.useMutation({
    onSuccess: async () => {
      setAccepted(true);
      await Promise.all([
        trpcUtils.family.myMemberships.invalidate(),
        trpcUtils.location.getFamilyLocations.invalidate(),
      ]);
      toast("가족 초대를 수락했습니다.", {
        description: "이제 가족 위치 화면에서 권한에 맞는 기능을 사용할 수 있습니다.",
      });
    },
    onError: (error) => {
      toast.error("초대 수락에 실패했습니다.", {
        description: error.message || "초대 링크 만료 여부와 로그인 상태를 확인해주세요.",
      });
    },
  });

  const inviteLink = inviteQuery.data?.link;
  const roleLabel = inviteLink?.role === "guardian" ? "보호자" : "자녀";

  const acceptInvite = async () => {
    const nextDisplayName = (displayName || user?.name || "가족 구성원").trim();
    if (!nextDisplayName) {
      toast("표시 이름을 입력해주세요.");
      return;
    }
    await acceptMutation.mutateAsync({ token, displayName: nextDisplayName });
  };

  const declineInvite = () => {
    setDeclined(true);
    toast("초대를 거절했습니다.", {
      description: "이 링크는 아직 보호자가 취소하기 전까지 유효하지만, 현재 화면에서는 참여하지 않는 상태로 표시됩니다.",
    });
  };

  return (
    <div className="min-h-screen bg-[#fff7e7] text-[#17324d] paper-grain">
      <main className="container flex min-h-screen items-center justify-center py-16">
        <section className="grid w-full max-w-5xl overflow-hidden border-[4px] border-[#17324d] bg-[#fffdf5] shadow-[14px_14px_0_#f2a37b] lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="relative overflow-hidden border-b-[4px] border-[#17324d] bg-[#17324d] p-8 text-[#fff7e7] lg:border-b-0 lg:border-r-[4px]">
            <div className="absolute -left-16 top-14 h-52 w-52 rounded-full bg-[#8fd3b6]/35 blur-2xl" />
            <div className="absolute -right-12 bottom-12 h-52 w-52 rounded-full bg-[#f2a37b]/35 blur-2xl" />
            <div className="relative z-10 flex h-full min-h-[320px] flex-col justify-between gap-10">
              <div>
                <div className="mb-8 inline-flex items-center gap-2 border-[3px] border-[#fff7e7] bg-[#8fd3b6] px-4 py-2 text-sm font-black text-[#17324d] shadow-[4px_4px_0_#fff7e7]">
                  <LinkIcon className="h-4 w-4" /> 가족 초대 링크
                </div>
                <h1 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">초대를 확인하고 가족 위치 공유에 참여하세요.</h1>
                <p className="mt-5 text-sm font-medium leading-7 text-[#d9e5df]">초대 링크는 보호자가 만든 24시간 유효 링크입니다. 로그인한 사용자만 초대를 수락할 수 있으며, 참여 후 권한에 따라 위치 보기 또는 공유가 가능합니다.</p>
              </div>
              <Button onClick={() => setLocation("/")} variant="outline" className="h-12 border-[3px] border-[#fff7e7] bg-[#17324d] font-black text-[#fff7e7] shadow-[4px_4px_0_#fff7e7] hover:bg-[#254462] hover:text-[#fff7e7]">
                <ChevronLeft className="mr-2 h-4 w-4" /> 홈으로 돌아가기
              </Button>
            </div>
          </aside>

          <div className="p-6 sm:p-8 lg:p-10">
            {inviteQuery.isLoading || loading ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="text-lg font-black">초대 링크를 확인하고 있습니다.</p>
              </div>
            ) : inviteQuery.error || !token ? (
              <div className="min-h-[360px] border-[3px] border-[#17324d] bg-[#fff0e8] p-6 shadow-[6px_6px_0_#f2a37b]">
                <XCircle className="mb-5 h-12 w-12 text-[#9d3c23]" />
                <h2 className="font-display text-4xl tracking-[-0.03em]">사용할 수 없는 초대 링크입니다.</h2>
                <p className="mt-4 font-bold leading-7 text-[#51677a]">링크가 만료되었거나 이미 취소되었을 수 있습니다. 보호자에게 새 초대 링크를 요청해주세요.</p>
                <Button onClick={() => setLocation("/")} className="mt-8 h-12 border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]">홈으로 이동</Button>
              </div>
            ) : accepted ? (
              <div className="min-h-[360px] border-[3px] border-[#17324d] bg-[#e8fff4] p-6 shadow-[6px_6px_0_#8fd3b6]">
                <p className="mb-4 inline-flex border-[3px] border-[#17324d] bg-[#8fd3b6] px-3 py-1 text-xs font-black shadow-[3px_3px_0_#17324d]">상태: accepted</p>
                <CheckCircle2 className="mb-5 h-12 w-12 text-[#1d8664]" />
                <h2 className="font-display text-4xl tracking-[-0.03em]">가족 초대 수락이 완료되었습니다.</h2>
                <p className="mt-4 font-bold leading-7 text-[#51677a]">가족 위치 화면으로 이동해 현재 위치 동의와 공유 상태를 이어서 설정할 수 있습니다.</p>
                <Button onClick={() => setLocation("/")} className="mt-8 h-12 border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]">가족 위치 화면으로 이동</Button>
              </div>
            ) : declined ? (
              <div className="min-h-[360px] border-[3px] border-[#17324d] bg-[#fff0e8] p-6 shadow-[6px_6px_0_#f2a37b]">
                <p className="mb-4 inline-flex border-[3px] border-[#17324d] bg-[#f8d9a8] px-3 py-1 text-xs font-black shadow-[3px_3px_0_#17324d]">상태: declined</p>
                <XCircle className="mb-5 h-12 w-12 text-[#9d3c23]" />
                <h2 className="font-display text-4xl tracking-[-0.03em]">가족 초대를 거절했습니다.</h2>
                <p className="mt-4 font-bold leading-7 text-[#51677a]">참여하지 않기로 선택했습니다. 마음이 바뀌면 보호자에게 새 초대 링크를 요청하거나 홈으로 이동해 서비스를 둘러볼 수 있습니다.</p>
                <Button onClick={() => setLocation("/")} className="mt-8 h-12 border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]">홈으로 이동</Button>
              </div>
            ) : (
              <div>
                <p className="mb-4 inline-flex items-center gap-2 border-[3px] border-[#17324d] bg-[#8fd3b6] px-4 py-2 text-sm font-black shadow-[4px_4px_0_#17324d]"><UsersRound className="h-4 w-4" /> 상태: pending · {roleLabel}로 초대됨</p>
                <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">이 가족 그룹에 참여하시겠습니까?</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="border-[3px] border-[#17324d] bg-[#fff7e7] p-4 shadow-[4px_4px_0_#17324d]">
                    <p className="text-xs font-black text-[#51677a]">권한</p>
                    <p className="mt-2 font-black">{roleLabel}</p>
                  </div>
                  <div className="border-[3px] border-[#17324d] bg-[#fff7e7] p-4 shadow-[4px_4px_0_#17324d]">
                    <p className="text-xs font-black text-[#51677a]">위치 보기</p>
                    <p className="mt-2 font-black">{inviteLink?.canViewLocation ? "가능" : "불가"}</p>
                  </div>
                  <div className="border-[3px] border-[#17324d] bg-[#fff7e7] p-4 shadow-[4px_4px_0_#17324d]">
                    <p className="text-xs font-black text-[#51677a]">위치 공유</p>
                    <p className="mt-2 font-black">{inviteLink?.canShareLocation ? "가능" : "불가"}</p>
                  </div>
                </div>

                {!isAuthenticated ? (
                  <div className="mt-8 border-[3px] border-[#17324d] bg-[#fff7e7] p-5 shadow-[5px_5px_0_#f2a37b]">
                    <ShieldCheck className="mb-4 h-10 w-10" />
                    <p className="font-black">초대를 수락하려면 먼저 로그인해주세요.</p>
                    <p className="mt-2 text-sm font-bold text-[#51677a]">로그인 후 이 초대 링크를 다시 열면 가족 그룹에 참여할 수 있습니다.</p>
                    <Button onClick={() => { window.location.href = getLoginUrl(); }} className="mt-5 h-12 w-full border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]">로그인하고 수락 계속</Button>
                  </div>
                ) : (
                  <div className="mt-8 space-y-4">
                    <label className="block">
                      <span className="text-sm font-black text-[#51677a]">가족에게 표시할 이름</span>
                      <input
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder={user?.name || "가족 구성원"}
                        className="mt-2 h-13 w-full border-[3px] border-[#17324d] bg-white px-4 py-3 font-bold outline-none shadow-[4px_4px_0_#17324d] focus:bg-[#fff7e7]"
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button onClick={acceptInvite} disabled={acceptMutation.isPending} className="h-14 border-[3px] border-[#17324d] bg-[#8fd3b6] px-6 font-black text-[#17324d] shadow-[5px_5px_0_#17324d] hover:bg-[#9ee4c6] disabled:opacity-70">
                        {acceptMutation.isPending ? "초대 수락 중" : "초대 수락"}
                      </Button>
                      <Button onClick={declineInvite} disabled={acceptMutation.isPending} variant="outline" className="h-14 border-[3px] border-[#17324d] bg-[#fff7e7] px-6 font-black text-[#17324d] shadow-[5px_5px_0_#f2a37b] hover:bg-white disabled:opacity-70">
                        초대 거절
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
