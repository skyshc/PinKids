/*
 * Design reminder: 따뜻한 네오-브루탈리즘 기반 가족 안전 서비스.
 * 이 페이지는 크림색 종이 질감, 굵은 네이비 경계, 민트 안전 신호, 살구색 강조, 비대칭 관제형 레이아웃을 유지한다.
 * 모든 선택은 “자녀 위치를 빠르게 확인하고 부모가 안심한다”는 철학을 강화해야 한다.
 */

import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Home as HomeIcon,
  KeyRound,
  LocateFixed,
  LockKeyhole,
  MapPin,
  MapPinned,
  MessageCircle,
  Navigation,
  Radar,
  School,
  ShieldCheck,
  Smartphone,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const HERO_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663647991675/fuW72okeNRT65TWogzSyTX/child_location_hero_dashboard-gsGWabhdq5GiwvnTrenu9a.webp";
const SAFE_ZONE_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663647991675/fuW72okeNRT65TWogzSyTX/safe_zone_map_panel-nKsP8JNgSZn5kRByHJN79H.webp";
const CHECKIN_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663647991675/fuW72okeNRT65TWogzSyTX/family_checkin_cards-4CKchbXzvvatvQuYwCk4NE.webp";

const children = [
  {
    name: "지우",
    place: "학교 근처",
    status: "안전 반경 안",
    time: "방금 전",
    accent: "mint",
  },
  {
    name: "하준",
    place: "학원 도착",
    status: "체크인 완료",
    time: "12분 전",
    accent: "peach",
  },
  {
    name: "서윤",
    place: "집으로 이동 중",
    status: "경로 공유 중",
    time: "24분 전",
    accent: "navy",
  },
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

const onboardingSteps = [
  {
    eyebrow: "1단계 · 보호자 로그인",
    title: "먼저 보호자 이름으로 안전 공간을 열어요.",
    description: "실서비스에서는 휴대폰 인증이나 소셜 로그인으로 보호자를 확인합니다. 데모에서는 흐름을 보여주기 위해 이름만 입력합니다.",
    icon: KeyRound,
  },
  {
    eyebrow: "2단계 · 가족 역할 선택",
    title: "누가 위치를 보고, 누가 공유할지 정합니다.",
    description: "부모, 보호자, 자녀 역할을 나누면 위치 정보가 필요한 사람에게만 보이도록 안내할 수 있습니다.",
    icon: UsersRound,
  },
  {
    eyebrow: "3단계 · 위치 정보 동의",
    title: "위치 정보 제공은 명확한 동의 뒤에만 시작됩니다.",
    description: "브라우저 위치 권한 요청을 통해 현재 기기의 위치 제공 여부를 선택합니다. 거절해도 데모 화면은 계속 볼 수 있습니다.",
    icon: MapPinned,
  },
  {
    eyebrow: "준비 완료",
    title: "이제 가족 위치 화면으로 이동할 수 있어요.",
    description: "온보딩이 끝나면 다음 방문부터는 바로 메인 화면을 보여줍니다. 언제든 시작 버튼으로 이 흐름을 다시 열 수 있습니다.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  const mapReady = useRef(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [guardianName, setGuardianName] = useState("민지 보호자");
  const [familyRole, setFamilyRole] = useState("부모");
  const [locationPermission, setLocationPermission] = useState<"idle" | "granted" | "denied">("idle");

  const currentStep = onboardingSteps[onboardingStep];
  const CurrentStepIcon = currentStep.icon;
  const progressWidth = `${((onboardingStep + 1) / onboardingSteps.length) * 100}%`;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const hasCompleted = window.localStorage.getItem("child-location-onboarding-complete");
        if (!hasCompleted) setShowOnboarding(true);
      } catch {
        setShowOnboarding(true);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, []);

  const handleMapReady = (map: google.maps.Map) => {
    if (mapReady.current || !window.google) return;
    mapReady.current = true;

    const school = { lat: 37.5668, lng: 126.9786 };
    const academy = { lat: 37.5701, lng: 126.9822 };
    const home = { lat: 37.5639, lng: 126.9731 };

    map.setOptions({
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#f6ecd8" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#17324d" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#fff7e7" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#f0cfaa" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#17324d" }, { weight: 1.2 }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#b8d6d2" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#cbe6ce" }] },
      ],
    });

    const markerData = [
      { position: school, title: "지우 · 학교", label: "지우" },
      { position: academy, title: "하준 · 학원", label: "하준" },
      { position: home, title: "우리 집", label: "집" },
    ];

    markerData.forEach(item => {
      const pin = document.createElement("div");
      pin.className = "map-pin-marker";
      pin.innerHTML = `<span>${item.label}</span>`;
      new window.google!.maps.marker.AdvancedMarkerElement({
        map,
        position: item.position,
        title: item.title,
        content: pin,
      });
    });

    new window.google.maps.Circle({
      strokeColor: "#17324d",
      strokeOpacity: 0.85,
      strokeWeight: 2,
      fillColor: "#8fd3b6",
      fillOpacity: 0.24,
      map,
      center: school,
      radius: 380,
    });

    new window.google.maps.Polyline({
      path: [school, academy, home],
      geodesic: true,
      strokeColor: "#17324d",
      strokeOpacity: 0.95,
      strokeWeight: 4,
      icons: [
        {
          icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 4 },
          offset: "0",
          repeat: "20px",
        },
      ],
      map,
    });
  };

  const showDemoToast = (message = "데모 웹사이트에서는 실제 위치 공유가 연결되어 있지 않습니다.") => {
    toast(message, {
      description: "실서비스에서는 보호자 초대, 권한 승인, 실시간 위치 동의 절차가 필요합니다.",
    });
  };

  const openOnboarding = (step = 0) => {
    setOnboardingStep(step);
    setShowOnboarding(true);
  };

  const goNextStep = () => {
    setOnboardingStep(step => Math.min(step + 1, onboardingSteps.length - 1));
  };

  const completeOnboarding = () => {
    try {
      window.localStorage.setItem("child-location-onboarding-complete", "true");
    } catch {
      // 데모 환경에서 저장소 접근이 제한되어도 화면 흐름은 계속 진행한다.
    }
    setShowOnboarding(false);
    toast("온보딩이 완료되었습니다.", {
      description: `${guardianName || "보호자"}님, 이제 위치 보기 섹션에서 가족 상태를 확인할 수 있습니다.`,
    });
    window.setTimeout(() => document.getElementById("map")?.scrollIntoView({ behavior: "smooth" }), 150);
  };

  const requestLocationConsent = () => {
    if (!navigator.geolocation) {
      setLocationPermission("denied");
      toast("이 브라우저에서는 위치 권한 요청을 사용할 수 없습니다.", {
        description: "데모 흐름은 계속 진행할 수 있습니다.",
      });
      goNextStep();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationPermission("granted");
        toast("위치 정보 제공에 동의했습니다.", {
          description: "실서비스에서는 이 동의 내역과 철회 방법을 함께 제공합니다.",
        });
        goNextStep();
      },
      () => {
        setLocationPermission("denied");
        toast("위치 권한이 허용되지 않았습니다.", {
          description: "권한을 거절해도 가족 초대와 데모 탐색은 계속할 수 있습니다.",
        });
        goNextStep();
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 },
    );
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#fff7e7] text-[#17324d] paper-grain">
      <header className="sticky top-0 z-50 border-b-[3px] border-[#17324d] bg-[#fff7e7]/92 backdrop-blur-xl">
        <nav className="container flex h-20 items-center justify-between gap-6">
          <a href="#top" className="group flex items-center gap-3" aria-label="아이안심 홈">
            <span className="flex h-11 w-11 rotate-[-4deg] items-center justify-center border-[3px] border-[#17324d] bg-[#8fd3b6] shadow-[5px_5px_0_#17324d] transition-transform group-hover:rotate-0 group-hover:translate-x-0.5 group-hover:translate-y-0.5">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <span className="font-display text-2xl tracking-tight">아이안심</span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-bold md:flex">
            <a href="#features" className="hover:underline hover:decoration-[3px] hover:underline-offset-8">기능</a>
            <a href="#map" className="hover:underline hover:decoration-[3px] hover:underline-offset-8">위치 보기</a>
            <a href="#how" className="hover:underline hover:decoration-[3px] hover:underline-offset-8">사용 방법</a>
          </div>
          <Button
            onClick={() => openOnboarding(0)}
            className="border-[3px] border-[#17324d] bg-[#17324d] px-5 py-5 text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]"
          >
시작하기
          </Button>
        </nav>
      </header>

      <main id="top">
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
                <span className="block text-[#1d8664]">쉽고 따뜻하게</span>
                확인하세요.
              </h1>
              <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-[#314b62]">
                학교, 학원, 집처럼 중요한 장소를 한눈에 보고 아이가 안전 반경 안에 있는지 확인하는 간단한 위치 공유 웹사이트입니다. 복잡한 기능보다 <strong className="font-black text-[#17324d]">빠른 확인, 쉬운 초대, 안심 알림</strong>에 집중했습니다.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Button
                  onClick={() => openOnboarding(0)}
                  className="h-14 border-[3px] border-[#17324d] bg-[#8fd3b6] px-7 text-base font-black text-[#17324d] shadow-[6px_6px_0_#17324d] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-[#9ee4c6] hover:shadow-[3px_3px_0_#17324d]"
                >
                  지금 위치 확인하기
                </Button>
                <Button
                  onClick={() => document.getElementById("map")?.scrollIntoView({ behavior: "smooth" })}
                  variant="outline"
                  className="h-14 border-[3px] border-[#17324d] bg-[#fff7e7] px-7 text-base font-black shadow-[6px_6px_0_#f2a37b] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-[#ffe8cd] hover:shadow-[3px_3px_0_#f2a37b]"
                >
                  데모 지도 보기
                </Button>
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

        <section id="features" className="container py-24">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="mb-4 inline-block border-[3px] border-[#17324d] bg-[#8fd3b6] px-4 py-2 text-sm font-black shadow-[4px_4px_0_#17324d]">핵심 기능</p>
              <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">부모가 실제로 자주 확인하는 것만 담았습니다.</h2>
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

        <section id="map" className="border-y-[3px] border-[#17324d] bg-[#17324d] py-20 text-[#fff7e7]">
          <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden border-[4px] border-[#fff7e7] bg-[#fff7e7] shadow-[12px_12px_0_#f2a37b]">
              <MapView initialCenter={{ lat: 37.5668, lng: 126.9786 }} initialZoom={15} onMapReady={handleMapReady} className="h-[560px]" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="mb-4 inline-flex w-fit items-center gap-2 border-[3px] border-[#fff7e7] bg-[#f2a37b] px-4 py-2 text-sm font-black text-[#17324d] shadow-[4px_4px_0_#fff7e7]"><Radar className="h-4 w-4" /> 실시간 위치 화면</p>
              <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">지도 위에 안전 구역과 이동 경로를 함께 표시합니다.</h2>
              <p className="mt-6 text-base font-medium leading-8 text-[#d9e5df]">이 데모 지도는 서비스 화면 예시입니다. 실제 서비스에서는 자녀와 보호자의 명시적 동의, 권한 관리, 위치 데이터 보안 정책을 연결해야 합니다.</p>
              <div className="mt-8 space-y-4">
                {children.map(child => (
                  <div key={child.name} className="flex items-center justify-between gap-4 border-[3px] border-[#fff7e7] bg-[#fff7e7] p-4 text-[#17324d] shadow-[5px_5px_0_#8fd3b6]">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#17324d] font-black ${child.accent === "mint" ? "bg-[#8fd3b6]" : child.accent === "peach" ? "bg-[#f2a37b]" : "bg-[#f8d9a8]"}`}>{child.name[0]}</span>
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
          </div>
        </section>

        <section id="how" className="container py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative order-2 lg:order-1">
              <img src={SAFE_ZONE_IMAGE} alt="안전 구역 지도 패널" className="w-full border-[4px] border-[#17324d] bg-[#fffdf5] shadow-[12px_12px_0_#17324d]" />
              <img src={CHECKIN_IMAGE} alt="가족 체크인 카드" className="absolute -bottom-12 -right-5 hidden w-[52%] rotate-3 border-[4px] border-[#17324d] bg-[#fffdf5] shadow-[10px_10px_0_#f2a37b] md:block" />
            </div>
            <div className="order-1 lg:order-2">
              <p className="mb-4 inline-block border-[3px] border-[#17324d] bg-[#f8d9a8] px-4 py-2 text-sm font-black shadow-[4px_4px_0_#17324d]">사용 흐름</p>
              <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">설정은 짧고, 확인은 더 짧게.</h2>
              <div className="mt-8 space-y-5">
                {timeline.map((item, index) => (
                  <div key={item.label} className="relative flex gap-5">
                    {index !== timeline.length - 1 && <span className="absolute left-[22px] top-12 h-[calc(100%+4px)] w-[3px] bg-[#17324d]" />}
                    <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-[#17324d] bg-[#8fd3b6] shadow-[4px_4px_0_#17324d]"><item.icon className="h-5 w-5" /></span>
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

        <section className="container pb-24">
          <div className="grid gap-6 border-[4px] border-[#17324d] bg-[#f2a37b] p-8 shadow-[12px_12px_0_#17324d] lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
            <div>
              <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">가족 초대 링크로 간단히 시작하세요.</h2>
              <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-[#243e55]">다음 단계에서는 로그인, 가족 그룹 생성, 실제 위치 권한 승인, 알림 설정을 연결해 실사용 가능한 서비스로 확장할 수 있습니다.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button onClick={() => openOnboarding(1)} className="h-14 border-[3px] border-[#17324d] bg-[#17324d] px-7 font-black text-[#fff7e7] shadow-[5px_5px_0_#fff7e7] hover:bg-[#254462]"><UsersRound className="mr-2 h-5 w-5" />가족 그룹 만들기</Button>
              <Button onClick={() => showDemoToast("앱 설치 안내는 데모에서는 안내 화면만 제공합니다.")} variant="outline" className="h-14 border-[3px] border-[#17324d] bg-[#fff7e7] px-7 font-black shadow-[5px_5px_0_#17324d] hover:bg-white"><Smartphone className="mr-2 h-5 w-5" />앱 설치 안내</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-[3px] border-[#17324d] bg-[#17324d] py-8 text-[#fff7e7]">
        <div className="container flex flex-col justify-between gap-4 text-sm font-bold md:flex-row md:items-center">
          <p>아이안심 · 간단한 자녀 위치 공유 서비스 데모</p>
          <p className="flex items-center gap-2 text-[#d9e5df]"><Clock3 className="h-4 w-4" /> 실제 위치 추적은 사용자 동의와 보안 설계가 필요합니다.</p>
        </div>
      </footer>

      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17324d]/72 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
          <div className="relative grid max-h-[92vh] w-full max-w-5xl overflow-y-auto border-[4px] border-[#17324d] bg-[#fff7e7] shadow-[14px_14px_0_#f2a37b] lg:grid-cols-[0.92fr_1.08fr]">
            <button
              type="button"
              onClick={() => setShowOnboarding(false)}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center border-[3px] border-[#17324d] bg-[#fffdf5] shadow-[4px_4px_0_#17324d] transition-transform hover:translate-x-0.5 hover:translate-y-0.5"
              aria-label="온보딩 닫기"
            >
              <X className="h-5 w-5" />
            </button>

            <aside className="relative min-h-[340px] overflow-hidden border-b-[4px] border-[#17324d] bg-[#17324d] p-8 text-[#fff7e7] lg:border-b-0 lg:border-r-[4px]">
              <div className="absolute -left-16 top-12 h-52 w-52 rounded-full bg-[#8fd3b6]/35 blur-2xl" />
              <div className="absolute -right-10 bottom-12 h-52 w-52 rounded-full bg-[#f2a37b]/35 blur-2xl" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                <div>
                  <div className="mb-8 inline-flex items-center gap-2 border-[3px] border-[#fff7e7] bg-[#8fd3b6] px-4 py-2 text-sm font-black text-[#17324d] shadow-[4px_4px_0_#fff7e7]">
                    <LockKeyhole className="h-4 w-4" /> 처음 시작 설정
                  </div>
                  <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">로그인과 위치 동의를 한 번에 안내합니다.</h2>
                  <p className="mt-5 text-sm font-medium leading-7 text-[#d9e5df]">위치 공유 서비스는 신뢰가 먼저입니다. 그래서 첫 화면에서 보호자 확인, 가족 역할, 위치 제공 동의 이유를 순서대로 설명합니다.</p>
                </div>

                <div className="space-y-3">
                  {onboardingSteps.map((step, index) => (
                    <button
                      type="button"
                      key={step.eyebrow}
                      onClick={() => setOnboardingStep(index)}
                      className={`flex w-full items-center gap-3 border-[3px] p-3 text-left text-sm font-black transition-all ${index === onboardingStep ? "border-[#fff7e7] bg-[#f2a37b] text-[#17324d] shadow-[4px_4px_0_#fff7e7]" : "border-[#fff7e7]/40 bg-[#fff7e7]/5 text-[#fff7e7] hover:bg-[#fff7e7]/12"}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2px] border-current">{index + 1}</span>
                      <span>{step.eyebrow}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className="p-6 sm:p-8 lg:p-10">
              <div className="mb-8 h-4 border-[3px] border-[#17324d] bg-[#fffdf5]">
                <div className="h-full bg-[#8fd3b6] transition-all duration-500" style={{ width: progressWidth }} />
              </div>

              <div className="mb-6 flex h-16 w-16 rotate-[-3deg] items-center justify-center border-[3px] border-[#17324d] bg-[#f8d9a8] shadow-[5px_5px_0_#17324d]">
                <CurrentStepIcon className="h-8 w-8" />
              </div>
              <p className="mb-3 inline-block border-[3px] border-[#17324d] bg-[#8fd3b6] px-3 py-1 text-xs font-black shadow-[3px_3px_0_#17324d]">{currentStep.eyebrow}</p>
              <h3 id="onboarding-title" className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">{currentStep.title}</h3>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#51677a]">{currentStep.description}</p>

              <div className="mt-8">
                {onboardingStep === 0 && (
                  <div className="grid gap-4">
                    <label className="text-sm font-black" htmlFor="guardian-name">보호자 이름</label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="flex flex-1 items-center gap-3 border-[3px] border-[#17324d] bg-[#fffdf5] px-4 py-3 shadow-[4px_4px_0_#17324d]">
                        <UserRound className="h-5 w-5 text-[#1d8664]" />
                        <input
                          id="guardian-name"
                          value={guardianName}
                          onChange={event => setGuardianName(event.target.value)}
                          className="w-full bg-transparent text-base font-black outline-none placeholder:text-[#8ba0ad]"
                          placeholder="예: 민지 보호자"
                        />
                      </div>
                      <Button onClick={goNextStep} className="h-14 border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]">
                        로그인 계속하기 <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                    <p className="border-[3px] border-[#17324d] bg-[#fffdf5] p-4 text-sm font-bold leading-6 shadow-[4px_4px_0_#8fd3b6]">데모에서는 실제 계정을 만들지 않습니다. 실서비스 확장 시에는 인증, 세션, 개인정보 처리방침 동의가 연결됩니다.</p>
                  </div>
                )}

                {onboardingStep === 1 && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {["부모", "조부모", "자녀"].map(role => (
                      <button
                        type="button"
                        key={role}
                        onClick={() => setFamilyRole(role)}
                        className={`border-[3px] border-[#17324d] p-5 text-left shadow-[5px_5px_0_#17324d] transition-all hover:-translate-y-1 ${familyRole === role ? "bg-[#8fd3b6]" : "bg-[#fffdf5]"}`}
                      >
                        <UsersRound className="mb-4 h-8 w-8 text-[#1d8664]" />
                        <p className="text-xl font-black">{role}</p>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#51677a]">{role === "자녀" ? "내 위치를 가족에게 공유합니다." : "아이 위치와 알림을 확인합니다."}</p>
                      </button>
                    ))}
                    <div className="sm:col-span-3">
                      <Button onClick={goNextStep} className="mt-2 h-14 w-full border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]">
                        {familyRole} 역할로 계속 <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {onboardingStep === 2 && (
                  <div className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#17324d]">
                        <ShieldCheck className="mb-4 h-8 w-8 text-[#1d8664]" />
                        <p className="font-black">동의 전에는 위치를 표시하지 않음</p>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#51677a]">위치 정보는 사용자가 명확히 허용한 뒤에만 요청됩니다.</p>
                      </div>
                      <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#f2a37b]">
                        <LockKeyhole className="mb-4 h-8 w-8 text-[#d96d45]" />
                        <p className="font-black">언제든 철회 가능</p>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#51677a]">브라우저 설정 또는 서비스 설정에서 권한을 다시 바꿀 수 있습니다.</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button onClick={requestLocationConsent} className="h-14 flex-1 border-[3px] border-[#17324d] bg-[#8fd3b6] px-6 font-black text-[#17324d] shadow-[5px_5px_0_#17324d] hover:bg-[#9ee4c6]">
                        위치 제공에 동의하고 계속
                      </Button>
                      <Button onClick={goNextStep} variant="outline" className="h-14 flex-1 border-[3px] border-[#17324d] bg-[#fff7e7] px-6 font-black shadow-[5px_5px_0_#f2a37b] hover:bg-white">
                        나중에 설정
                      </Button>
                    </div>
                  </div>
                )}

                {onboardingStep === 3 && (
                  <div className="grid gap-4">
                    <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#17324d]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#17324d] bg-[#8fd3b6]"><CheckCircle2 className="h-7 w-7" /></span>
                        <div>
                          <p className="font-black">{guardianName || "보호자"}님 설정 완료</p>
                          <p className="text-sm font-bold text-[#51677a]">역할: {familyRole} · 위치 권한: {locationPermission === "granted" ? "동의됨" : locationPermission === "denied" ? "나중에 설정" : "선택 전"}</p>
                        </div>
                      </div>
                    </div>
                    <Button onClick={completeOnboarding} className="h-14 border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]">
                      가족 위치 화면으로 이동
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
