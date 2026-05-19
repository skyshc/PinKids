import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboardingModal } from "@/contexts/OnboardingModalContext";
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  LocateFixed,
  LockKeyhole,
  MessageCircle,
  Radar,
  ShieldCheck,
  Smartphone,
  UsersRound,
} from "lucide-react";
import { Link } from "wouter";

const features = [
  {
    icon: LocateFixed,
    title: "현재 위치 확인",
    text: "아이의 마지막 위치와 이동 방향을 한 화면에서 확인합니다.",
    color: "mint",
  },
  {
    icon: Radar,
    title: "안전 구역 알림",
    text: "학교, 집, 학원처럼 자주 가는 장소를 안전 반경으로 설정합니다.",
    color: "peach",
  },
  {
    icon: MessageCircle,
    title: "간단 체크인",
    text: "아이에게 긴 문자를 요구하지 않고 버튼 한 번으로 안부를 공유합니다.",
    color: "cream",
  },
  {
    icon: UsersRound,
    title: "가족 초대",
    text: "24시간 유효한 초대 링크로 가족 구성원을 손쉽게 추가합니다.",
    color: "mint",
  },
  {
    icon: BellRing,
    title: "이탈 알림",
    text: "아이가 안전 구역을 벗어나면 즉시 알림을 받습니다.",
    color: "peach",
  },
  {
    icon: LockKeyhole,
    title: "개인정보 보호",
    text: "명확한 동의 절차와 언제든 철회 가능한 위치 공유 설계를 따릅니다.",
    color: "cream",
  },
];

const benefits = [
  { icon: CheckCircle2, title: "3초 위치 확인", desc: "앱 없이 브라우저에서 바로 확인" },
  { icon: ShieldCheck, title: "동의 기반 공유", desc: "명시적 동의 후에만 위치 저장" },
  { icon: Smartphone, title: "모바일 최적화", desc: "스마트폰에서도 편하게 사용" },
];

export default function Features() {
  const { isAuthenticated } = useAuth();
  const { openOnboarding } = useOnboardingModal();

  return (
    <AppLayout>
      {/* Hero */}
      <section className="relative border-b-[3px] border-[#17324d] py-20 lg:py-28">
        <div className="absolute -left-16 top-12 h-56 w-56 rounded-full bg-[#f2a37b]/30 blur-3xl" />
        <div className="absolute right-8 top-20 h-72 w-72 rounded-full bg-[#8fd3b6]/35 blur-3xl" />
        <div className="container relative z-10 max-w-3xl">
          <div className="mb-6 inline-block border-[3px] border-[#17324d] bg-[#8fd3b6] px-4 py-2 text-sm font-black shadow-[4px_4px_0_#17324d]">
            핵심 기능
          </div>
          <h1 className="font-display text-5xl leading-tight tracking-[-0.04em] sm:text-6xl">
            부모가 실제로
            <span className="block text-[#1d8664]">자주 확인하는 것만</span>
            담았습니다.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#314b62]">
            복잡한 기능보다 빠른 확인, 쉬운 초대, 안심 알림에 집중했습니다. 핀키즈는 보호자가 필요한 순간에 바로 쓸 수 있는 서비스를 목표로 합니다.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            {isAuthenticated ? (
              <Link href="/map">
                <Button className="h-14 border-[3px] border-[#17324d] bg-[#8fd3b6] px-7 text-base font-black text-[#17324d] shadow-[6px_6px_0_#17324d] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-[#9ee4c6] hover:shadow-[3px_3px_0_#17324d]">
                  위치 보기 화면으로 <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => openOnboarding(0)}
                className="h-14 border-[3px] border-[#17324d] bg-[#8fd3b6] px-7 text-base font-black text-[#17324d] shadow-[6px_6px_0_#17324d] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-[#9ee4c6] hover:shadow-[3px_3px_0_#17324d]"
              >
                로그인 후 시작하기
              </Button>
            )}
            <Link href="/how-to">
              <Button
                variant="outline"
                className="h-14 border-[3px] border-[#17324d] bg-[#fff7e7] px-7 text-base font-black shadow-[6px_6px_0_#f2a37b] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-[#ffe8cd] hover:shadow-[3px_3px_0_#f2a37b]"
              >
                사용 방법 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="container py-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(feature => (
            <Card
              key={feature.title}
              className="group border-[3px] border-[#17324d] bg-[#fffdf5] shadow-[7px_7px_0_#17324d] transition-all hover:-translate-y-1 hover:shadow-[9px_9px_0_#17324d]"
            >
              <CardContent className="p-8">
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center border-[3px] border-[#17324d] shadow-[4px_4px_0_#17324d] ${
                    feature.color === "mint"
                      ? "bg-[#8fd3b6]"
                      : feature.color === "peach"
                        ? "bg-[#f2a37b]"
                        : "bg-[#f8d9a8]"
                  }`}
                >
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-black">{feature.title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-[#51677a]">{feature.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y-[3px] border-[#17324d] bg-[#17324d] py-16 text-[#fff7e7]">
        <div className="container">
          <p className="mb-4 inline-block border-[3px] border-[#fff7e7] bg-[#f2a37b] px-4 py-2 text-sm font-black text-[#17324d] shadow-[4px_4px_0_#fff7e7]">
            왜 핀키즈인가요?
          </p>
          <h2 className="mb-12 font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
            설계 원칙 세 가지
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map(b => (
              <div
                key={b.title}
                className="border-[3px] border-[#fff7e7] bg-[#fff7e7]/10 p-6 shadow-[5px_5px_0_#8fd3b6]"
              >
                <b.icon className="mb-4 h-8 w-8 text-[#8fd3b6]" />
                <p className="text-xl font-black">{b.title}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-[#d9e5df]">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="container py-20">
          <div className="border-[4px] border-[#17324d] bg-[#f2a37b] p-10 shadow-[12px_12px_0_#17324d] text-center">
            <h2 className="font-display text-4xl leading-tight tracking-[-0.03em]">
              지금 바로 시작해보세요.
            </h2>
            <p className="mt-4 text-base font-bold text-[#243e55]">
              소셜 로그인 한 번으로 가족 위치 공유를 시작할 수 있습니다.
            </p>
            <Button
              onClick={() => openOnboarding(0)}
              className="mt-8 h-14 border-[3px] border-[#17324d] bg-[#17324d] px-10 text-base font-black text-[#fff7e7] shadow-[5px_5px_0_#fff7e7] hover:bg-[#254462]"
            >
              소셜 로그인으로 시작
            </Button>
          </div>
        </section>
      )}
    </AppLayout>
  );
}
