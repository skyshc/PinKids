/*
 * Design reminder: 따뜻한 네오-브루탈리즘 기반 가족 안전 서비스.
 * 이 페이지는 크림색 종이 질감, 굵은 네이비 경계, 민트 안전 신호, 살구색 강조, 비대칭 관제형 레이아웃을 유지한다.
 * 모든 선택은 "자녀 위치를 빠르게 확인하고 부모가 안심한다"는 철학을 강화해야 한다.
 */

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboardingModal } from "@/contexts/OnboardingModalContext";
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Home as HomeIcon,
  LocateFixed,
  MapPin,
  MessageCircle,
  Navigation,
  Radar,
  School,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Link } from "wouter";

const HERO_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663647991675/fuW72okeNRT65TWogzSyTX/child_location_hero_dashboard-gsGWabhdq5GiwvnTrenu9a.webp";
const SAFE_ZONE_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663647991675/fuW72okeNRT65TWogzSyTX/safe_zone_map_panel-nKsP8JNgSZn5kRByHJN79H.webp";
const CHECKIN_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663647991675/fuW72okeNRT65TWogzSyTX/family_checkin_cards-4CKchbXzvvatvQuYwCk4NE.webp";

const children = [
  { name: "지우", place: "학교 근처", status: "안전 반경 안", time: "방금 전", accent: "mint" },
  { name: "하준", place: "학원 도착", status: "체크인 완료", time: "12분 전", accent: "peach" },
  { name: "서윤", place: "집으로 이동 중", status: "경로 공유 중", time: "24분 전", accent: "navy" },
];

const features = [
  {
    icon: LocateFixed,
    title: "현재 위치 확인",
    text: "아이의 마지막 위치와 이동 방향을 한 화면에서 확인합니다.",
  },
  {
    icon: Radar,
    title: "안전 구역 알림",
    text: "학교, 집, 학원처럼 자주 가는 장소를 안전 반경으로 설정합니다.",
  },
  {
    icon: MessageCircle,
    title: "간단 체크인",
    text: "아이에게 긴 문자를 요구하지 않고 버튼 한 번으로 안부를 공유합니다.",
  },
];

const timeline = [
  { label: "학교 도착", time: "08:18", icon: School },
  { label: "방과 후 학원 이동", time: "15:32", icon: Navigation },
  { label: "가족에게 체크인", time: "16:05", icon: CheckCircle2 },
  { label: "집 반경 접근", time: "예상 18:12", icon: HomeIcon },
];

const benefits = [
  { icon: CheckCircle2, title: "3초 위치 확인", desc: "앱 없이 브라우저에서 바로 확인" },
  { icon: ShieldCheck, title: "동의 기반 공유", desc: "명시적 동의 후에만 위치 저장" },
  { icon: Smartphone, title: "모바일 최적화", desc: "스마트폰에서도 편하게 사용" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { openOnboarding } = useOnboardingModal();

  return (
    <AppLayout>
      {/* Hero */}
      <section className="relative border-b-[3px] border-[#17324d]">
        <div className="absolute -left-16 top-24 h-56 w-56 rounded-full bg-[#f2a37b]/40 blur-3xl" />
        <div className="absolute right-8 top-32 h-72 w-72 rounded-full bg-[#8fd3b6]/45 blur-3xl" />
        <div className="container grid min-h-[calc(100vh-80px)] items-center gap-12 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-8 inline-flex rotate-[-1deg] items-center gap-2 border-[3px] border-[#17324d] bg-[#f8d9a8] px-4 py-2 text-sm font-black shadow-[4px_4px_0_#17324d]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1d8664] pulse-dot" />
              가족 위치 공유 데모 서비스
            </div>
            <h1 className="font-display text-5xl leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              아이의 위치를
              <span className="block text-[#1d8664]">쉽고 빠르게</span>
              확인하세요.
            </h1>
            <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-[#314b62]">
              학교, 학원, 집처럼 중요한 장소를 한눈에 보고 아이가 안전 반경 안에 있는지 확인하는 간단한 위치 공유 웹사이트입니다. 복잡한 기능보다 <strong className="font-black text-[#17324d]">빠른 확인, 쉬운 초대, 안심 알림</strong>에 집중했습니다.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
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
                  지금 위치 확인하기
                </Button>
              )}
              <Link href="/map">
                <Button
                  variant="outline"
                  className="h-14 border-[3px] border-[#17324d] bg-[#fff7e7] px-7 text-base font-black shadow-[6px_6px_0_#f2a37b] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-[#ffe8cd] hover:shadow-[3px_3px_0_#f2a37b]"
                >
                  데모 지도 보기
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
              {[
                ["3초", "최근 위치 확인"],
                ["5곳", "안전 구역"],
                ["1번", "체크인 버튼"],
              ].map(([value, label]) => (
                <div key={label} className="border-[3px] border-[#17324d] bg-white/60 p-4 shadow-[4px_4px_0_#17324d]">
                  <div className="font-display text-2xl">{value}</div>
                  <div className="mt-1 text-xs font-bold text-[#51677a]">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <div className="absolute -left-5 -top-5 z-20 hidden rotate-[-6deg] border-[3px] border-[#17324d] bg-[#f2a37b] px-5 py-3 font-black shadow-[5px_5px_0_#17324d] md:block">
              안전 반경 안
            </div>
            <div className="relative overflow-hidden border-[4px] border-[#17324d] bg-[#fffdf5] shadow-[12px_12px_0_#17324d]">
              <img src={HERO_IMAGE} alt="자녀 위치 공유 대시보드 일러스트" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-8 right-3 z-20 w-[78%] border-[3px] border-[#17324d] bg-[#fff7e7] p-4 shadow-[7px_7px_0_#f2a37b] sm:w-[440px]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#17324d] bg-[#8fd3b6]"><MapPin className="h-6 w-6" /></span>
                  <div>
                    <p className="text-sm font-black">지우가 학교 반경 안에 있어요</p>
                    <p className="text-xs font-bold text-[#5b6f80]">마지막 업데이트: 방금 전</p>
                  </div>
                </div>
                <BellRing className="h-6 w-6 text-[#d96d45]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features preview */}
      <section className="container py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-4 inline-block border-[3px] border-[#17324d] bg-[#8fd3b6] px-4 py-2 text-sm font-black shadow-[4px_4px_0_#17324d]">핵심 기능</p>
            <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">부모가 실제로 자주 확인하는 것만 담았습니다.</h2>
            <Link href="/features">
              <Button
                variant="outline"
                className="mt-6 border-[3px] border-[#17324d] bg-[#fff7e7] px-5 py-5 font-black shadow-[4px_4px_0_#17324d] hover:bg-white"
              >
                모든 기능 보기 <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {features.map(feature => (
              <Card key={feature.title} className="group border-[3px] border-[#17324d] bg-[#fffdf5] shadow-[7px_7px_0_#17324d] transition-all hover:-translate-y-1 hover:shadow-[9px_9px_0_#17324d]">
                <CardContent className="p-6">
                  <feature.icon className="mb-5 h-9 w-9 text-[#1d8664]" />
                  <h3 className="text-xl font-black">{feature.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-[#51677a]">{feature.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Map preview CTA */}
      <section className="border-y-[3px] border-[#17324d] bg-[#17324d] py-16 text-[#fff7e7]">
        <div className="container grid gap-10 lg:grid-cols-[1fr_1fr] items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 border-[3px] border-[#fff7e7] bg-[#f2a37b] px-4 py-2 text-sm font-black text-[#17324d] shadow-[4px_4px_0_#fff7e7]">
              <Radar className="h-4 w-4" /> 실시간 위치 화면
            </p>
            <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
              지도 위에 안전 구역과 이동 경로를 함께 표시합니다.
            </h2>
            <p className="mt-6 text-base font-medium leading-8 text-[#d9e5df]">
              로그인한 사용자가 위치 정보 제공에 동의하면 서버에 동의 내역과 최신 좌표가 저장되고, 같은 가족 그룹의 구성원 위치가 지도에 표시됩니다.
            </p>
            <Link href="/map">
              <Button className="mt-8 h-14 border-[3px] border-[#fff7e7] bg-[#8fd3b6] px-7 text-base font-black text-[#17324d] shadow-[6px_6px_0_#f2a37b] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-[#9ee4c6] hover:shadow-[3px_3px_0_#f2a37b]">
                위치 보기 화면으로 <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {children.map(child => (
              <div key={child.name} className="flex items-center justify-between gap-4 border-[3px] border-[#fff7e7] bg-[#fff7e7] p-4 text-[#17324d] shadow-[5px_5px_0_#8fd3b6]">
                <div className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#17324d] font-black ${child.accent === "mint" ? "bg-[#8fd3b6]" : child.accent === "peach" ? "bg-[#f2a37b]" : "bg-[#f8d9a8]"}`}>
                    {child.name[0]}
                  </span>
                  <div>
                    <p className="font-black">{child.name} · {child.place}</p>
                    <p className="text-xs font-bold text-[#51677a]">{child.status}</p>
                  </div>
                </div>
                <span className="text-xs font-black">{child.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to preview */}
      <section className="container py-24">
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
              사용 방법
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
            <Link href="/how-to">
              <Button
                variant="outline"
                className="mt-8 border-[3px] border-[#17324d] bg-[#fff7e7] px-5 py-5 font-black shadow-[4px_4px_0_#17324d] hover:bg-white"
              >
                사용 방법 전체 보기 <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t-[3px] border-[#17324d] bg-[#17324d] py-16 text-[#fff7e7]">
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
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                onClick={() => openOnboarding(0)}
                className="h-14 border-[3px] border-[#17324d] bg-[#17324d] px-10 text-base font-black text-[#fff7e7] shadow-[5px_5px_0_#fff7e7] hover:bg-[#254462]"
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
