/*
 * Design reminder: 따뜻한 네오-브루탈리즘 기반 가족 안전 서비스.
 * 이 페이지는 크림색 종이 질감, 굵은 네이비 경계, 민트 안전 신호, 살구색 강조, 비대칭 관제형 레이아웃을 유지한다.
 * 모든 선택은 “자녀 위치를 빠르게 확인하고 부모가 안심한다”는 철학을 강화해야 한다.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  BROWSER_SETTING_GUIDES,
  LOCATION_PERMISSION_EXPLANATIONS,
  LOCATION_PERMISSION_REQUEST_OPTIONS,
  getLocationPermissionPanelCopy,
  getLocationPermissionStatusLabel,
  mapBrowserPermissionState,
  queryGeolocationPermission,
  type LocationPermissionUiState,
} from "@/lib/locationPermission";
import { buildSocialLoginUrl, type SocialLoginProvider } from "@/lib/socialLogin";
import { toast } from "sonner";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Chrome,
  Clock3,
  Home as HomeIcon,
  KeyRound,
  LocateFixed,
  LockKeyhole,
  LogOut,
  MapPin,
  MapPinned,
  MessageCircle,
  Navigation,
  PauseCircle,
  Radar,
  RotateCcw,
  School,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
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
    eyebrow: "1단계 · 간편 소셜 로그인",
    title: "카카오톡이나 구글 계정으로 빠르게 시작해요.",
    description: "보호자가 이미 쓰는 계정으로 먼저 로그인한 뒤, 가족 역할과 위치 정보 동의를 차례로 확인합니다. 선택한 소셜 로그인 방식은 인증 포털에 전달됩니다.",
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
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const mapReady = useRef(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const familyMarkerRefs = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const familyPathRef = useRef<google.maps.Polyline | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [guardianName, setGuardianName] = useState("민지 보호자");
  const [familyRole, setFamilyRole] = useState("부모");
  const [locationPermission, setLocationPermission] = useState<LocationPermissionUiState>("idle");
  const [locationPermissionMessage, setLocationPermissionMessage] = useState("");
  const [showLocationSettingsGuide, setShowLocationSettingsGuide] = useState(false);
  const loginProviderLabel = user?.loginMethod === "google" ? "구글" : user?.loginMethod === "kakao" ? "카카오톡" : "소셜";
  const locationPanelCopy = getLocationPermissionPanelCopy(locationPermission);
  const isLocationBusy = locationPermission === "checking" || locationPermission === "requesting";
  const apiFamilyRole = familyRole === "자녀" ? "child" : "guardian";
  const trpcUtils = trpc.useUtils();
  const consentStatusQuery = trpc.consent.getStatus.useQuery(undefined, { enabled: isAuthenticated });
  const familyLocationsQuery = trpc.location.getFamilyLocations.useQuery(undefined, {
    enabled: isAuthenticated,
    // 새로 로그인한 사용자는 아직 가족 그룹에 속하지 않아 403 오류가 발생할 수 있으므로, 에러 시 빈 배열 반환
    retry: false,
  });
  const grantConsentMutation = trpc.consent.grant.useMutation({
    onSuccess: async () => {
      await Promise.all([trpcUtils.consent.getStatus.invalidate(), trpcUtils.family.myMemberships.invalidate()]);
    },
  });
  const revokeConsentMutation = trpc.consent.revoke.useMutation({
    onSuccess: async () => {
      await Promise.all([trpcUtils.consent.getStatus.invalidate(), trpcUtils.location.getFamilyLocations.invalidate()]);
    },
  });
  const pauseSharingMutation = trpc.location.pauseSharing.useMutation({
    onSuccess: async () => {
      await trpcUtils.location.getFamilyLocations.invalidate();
    },
  });
  const deleteHistoryMutation = trpc.location.deleteHistory.useMutation({
    onSuccess: async () => {
      await Promise.all([trpcUtils.consent.getStatus.invalidate(), trpcUtils.location.getFamilyLocations.invalidate()]);
    },
  });
  const updateLocationMutation = trpc.location.updateCurrent.useMutation({
    onSuccess: async () => {
      await trpcUtils.location.getFamilyLocations.invalidate();
    },
    onError: (error) => {
      // 위치 업로드 실패 시 콘솔에만 기록 (사용자 경험 방해 안 함)
      console.warn("Failed to update location:", error.message);
    },
  });
  const storedFamilyLocations = familyLocationsQuery.data?.locations ?? [];
  const storedLocationsWithCoordinates = storedFamilyLocations.filter(item => item.location);
  const hasActiveStoredConsent = consentStatusQuery.data?.active ?? false;
  const locationRetentionDays = familyLocationsQuery.data?.retentionDays ?? 30;
  const familyLocationsError = familyLocationsQuery.error;
  const isFamilyLocationsNotFound = familyLocationsError?.data?.code === "FORBIDDEN";

  // 현재 사용자의 위치가 저장되었는지 확인
  const currentUserLocation = storedFamilyLocations.find(item => item.userId === user?.id);

  const currentStep = onboardingSteps[onboardingStep];
  const CurrentStepIcon = currentStep.icon;
  const progressWidth = `${((onboardingStep + 1) / onboardingSteps.length) * 100}%`;

  useEffect(() => {
    if (user?.name) {
      setGuardianName(`${user.name} 보호자`);
    }
  }, [user?.name]);

  // 로그인 후 5분마다 현재 위치를 자동으로 감지하고 업로드
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return;
          const { latitude, longitude, accuracy } = position.coords;
          const recordedAt = new Date().getTime();
          
          updateLocationMutation.mutate({
            latitude,
            longitude,
            accuracy: accuracy ?? undefined,
            recordedAt,
          });
        },
        (error) => {
          if (!isMounted) return;
          console.warn("Geolocation error:", error.message);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
      );
    };

    // 즉시 첫 위치 업데이트
    updateLocation();

    // 5분(300,000ms)마다 위치 업데이트
    intervalId = setInterval(updateLocation, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, user?.id, updateLocationMutation]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const hasCompleted = window.localStorage.getItem("child-location-onboarding-complete");
        if (!hasCompleted && !isAuthenticated) setShowOnboarding(true);
      } catch {
        if (!isAuthenticated) setShowOnboarding(true);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated]);

  // 온보딩 중 위치 권한 확인 (로그인 후 자동 위치 추적과는 별개)
  useEffect(() => {
    if (!showOnboarding || onboardingStep !== 2) return;
    if (locationPermission === "granted" || locationPermission === "requesting") return;

    let isMounted = true;

    const checkPermission = async () => {
      if (!navigator.geolocation) {
        if (!isMounted) return;
        setLocationPermission("unsupported");
        setLocationPermissionMessage("이 브라우저에서는 위치 권한 요청을 사용할 수 없습니다. 위치 없이 데모를 계속할 수 있습니다.");
        return;
      }

      setLocationPermission("checking");
      const browserState = await queryGeolocationPermission();
      if (!isMounted) return;

      const nextState = mapBrowserPermissionState(browserState);
      setLocationPermission(nextState);
      setLocationPermissionMessage(
        browserState === "denied"
          ? "브라우저가 이미 위치 권한을 차단했습니다. 아래 설정 안내를 확인한 뒤 다시 시도해주세요."
          : browserState === "granted"
            ? "이미 이 사이트의 위치 권한이 허용되어 있습니다."
            : "아직 위치 권한을 요청하지 않았습니다. 안내를 확인한 뒤 직접 요청할 수 있습니다.",
      );
      setShowLocationSettingsGuide(browserState === "denied");
    };

    void checkPermission();

    return () => {
      isMounted = false;
    };
  }, [onboardingStep, showOnboarding]);

  const handleMapReady = (map: google.maps.Map) => {
    mapInstanceRef.current = map;
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

    if (storedLocationsWithCoordinates.length === 0) {
      new window.google.maps.Polyline({
        path: [school, academy, home],
        geodesic: true,
        strokeColor: "#17324d",
        strokeOpacity: 0.5,
        strokeWeight: 3,
        icons: [
          {
            icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 4 },
            offset: "0",
            repeat: "20px",
          },
        ],
        map,
      });
    }
  };

  const showDemoToast = (message = "데모 웹사이트에서는 실제 위치 공유가 연결되어 있지 않습니다.") => {
    toast(message, {
      description: "실서비스에서는 보호자 초대, 권한 승인, 실시간 위치 동의 절차가 필요합니다.",
    });
  };

  const saveGrantedLocation = async (position: GeolocationPosition) => {
    if (!isAuthenticated) {
      toast("로그인이 먼저 필요합니다.", {
        description: "위치 동의 기록과 가족 위치 저장은 로그인한 사용자에게만 연결됩니다.",
      });
      openOnboarding(0);
      return;
    }

    const consentResult = await grantConsentMutation.mutateAsync({
      displayName: guardianName || user?.name || "보호자",
      familyRole: apiFamilyRole,
      permissionState: "granted",
      consentText: "PinKids에서 가족 구성원이 최신 위치를 확인할 수 있도록 브라우저 위치 정보 제공에 동의합니다.",
    });

    await updateLocationMutation.mutateAsync({
      familyId: consentResult.family?.id,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
      recordedAt: position.timestamp || Date.now(),
    });
  };

  const refreshCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast("위치 권한을 사용할 수 없습니다.", {
        description: "현재 브라우저에서는 위치 업데이트를 저장할 수 없습니다.",
      });
      return;
    }

    if (!hasActiveStoredConsent) {
      toast("먼저 위치 정보 제공에 동의해주세요.", {
        description: "온보딩의 위치 동의 단계에서 동의를 저장한 뒤 현재 위치를 업데이트할 수 있습니다.",
      });
      openOnboarding(2);
      return;
    }

    setLocationPermission("requesting");
    navigator.geolocation.getCurrentPosition(
      position => {
        void (async () => {
          try {
            await updateLocationMutation.mutateAsync({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy ?? null,
              recordedAt: position.timestamp || Date.now(),
            });
            setLocationPermission("granted");
            toast("현재 위치가 업데이트되었습니다.", {
              description: "가족 위치 화면에 저장된 최신 좌표를 반영했습니다.",
            });
          } catch {
            setLocationPermission("denied");
            toast("현재 위치 저장에 실패했습니다.", {
              description: "잠시 후 다시 시도해주세요.",
            });
          }
        })();
      },
      () => {
        setLocationPermission("denied");
        toast("위치 업데이트가 허용되지 않았습니다.", {
          description: "브라우저 위치 권한을 허용한 뒤 다시 시도해주세요.",
        });
      },
      LOCATION_PERMISSION_REQUEST_OPTIONS,
    );
  };

  const revokeStoredConsent = async () => {
    await revokeConsentMutation.mutateAsync();
    setLocationPermission("idle");
    toast("위치 정보 제공 동의가 철회되었습니다.", {
      description: "저장된 최신 위치 표시는 비활성화되며, 다시 공유하려면 위치 동의를 새로 진행해야 합니다.",
    });
  };

  const pauseStoredLocationSharing = async () => {
    await pauseSharingMutation.mutateAsync();
    setLocationPermission("idle");
    toast("위치 공유가 일시 중지되었습니다.", {
      description: "동의 기록은 보관하지만, 가족 위치 목록에서는 최신 위치가 더 이상 노출되지 않습니다.",
    });
  };

  const deleteStoredLocationHistory = async () => {
    await deleteHistoryMutation.mutateAsync();
    setLocationPermission("idle");
    toast("저장된 위치 기록이 삭제되었습니다.", {
      description: "보관 기간 안내에 따라 현재 계정의 위치 포인트와 활성 동의가 정리되었습니다.",
    });
  };

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    familyMarkerRefs.current.forEach(marker => {
      marker.map = null;
    });
    familyMarkerRefs.current = [];

    if (familyPathRef.current) {
      familyPathRef.current.setMap(null);
      familyPathRef.current = null;
    }

    const bounds = new window.google.maps.LatLngBounds();
    const path: google.maps.LatLngLiteral[] = [];

    storedFamilyLocations.forEach(item => {
      if (!item.location) return;
      const position = { lat: item.location.latitude, lng: item.location.longitude };
      const pin = document.createElement("div");
      pin.className = "map-pin-marker";
      pin.innerHTML = `<span>${item.displayName.slice(0, 2)}</span>`;
      const marker = new window.google!.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position,
        title: `${item.displayName} · 저장된 최신 위치`,
        content: pin,
      });
      familyMarkerRefs.current.push(marker);
      bounds.extend(position);
      path.push(position);
    });

    if (path.length >= 2) {
      familyPathRef.current = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#f2a37b",
        strokeOpacity: 0.95,
        strokeWeight: 5,
        map: mapInstanceRef.current,
      });
    }

    if (path.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, 72);
    }
  }, [storedFamilyLocations]);

  const openOnboarding = (step = 0) => {
    setOnboardingStep(step);
    setShowOnboarding(true);
  };

  const goNextStep = () => {
    setOnboardingStep(step => Math.min(step + 1, onboardingSteps.length - 1));
  };

  const startSocialLogin = (provider: SocialLoginProvider) => {
    try {
      window.localStorage.setItem("child-location-preferred-login-provider", provider);
    } catch {
      // 저장소가 제한된 환경에서도 인증 이동은 계속 진행한다.
    }

    window.location.href = buildSocialLoginUrl(getLoginUrl(), provider);
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

  const checkLocationPermissionAgain = async () => {
    if (!navigator.geolocation) {
      setLocationPermission("unsupported");
      setLocationPermissionMessage("이 브라우저에서는 위치 권한 요청을 사용할 수 없습니다. 위치 없이 데모를 계속할 수 있습니다.");
      return;
    }

    setLocationPermission("checking");
    const browserState = await queryGeolocationPermission();
    const nextState = mapBrowserPermissionState(browserState);

    setLocationPermission(nextState);
    setShowLocationSettingsGuide(browserState === "denied");
    setLocationPermissionMessage(
      browserState === "denied"
        ? "아직 브라우저에서 위치 권한이 차단되어 있습니다. 설정을 허용으로 바꾼 뒤 다시 확인해주세요."
        : browserState === "granted"
          ? "위치 권한이 허용된 상태입니다. 다음 단계로 계속할 수 있습니다."
          : "권한 요청이 가능한 상태입니다. 아래 버튼으로 브라우저 권한 창을 열 수 있습니다.",
    );
  };

  const requestLocationConsent = async () => {
    if (!navigator.geolocation) {
      setLocationPermission("unsupported");
      setLocationPermissionMessage("이 브라우저에서는 위치 권한 요청을 사용할 수 없습니다. 위치 없이 데모를 계속할 수 있습니다.");
      toast("위치 권한 요청을 사용할 수 없습니다.", {
        description: "가족 그룹 생성과 데모 탐색은 계속할 수 있습니다.",
      });
      return;
    }

    const browserState = await queryGeolocationPermission();
    if (browserState === "denied") {
      setLocationPermission("blocked");
      setShowLocationSettingsGuide(true);
      setLocationPermissionMessage("브라우저가 이미 위치 권한을 차단했습니다. 설정 안내를 확인한 뒤 권한 다시 확인을 눌러주세요.");
      toast("브라우저 설정 변경이 필요합니다.", {
        description: "주소창 또는 브라우저 설정에서 PinKids 위치 권한을 허용해주세요.",
      });
      return;
    }

    setLocationPermission("requesting");
    setLocationPermissionMessage("브라우저 권한 창이 열리면 ‘허용’을 선택해주세요.");
    setShowLocationSettingsGuide(false);

    navigator.geolocation.getCurrentPosition(
      position => {
        void (async () => {
          try {
            await saveGrantedLocation(position);
            setLocationPermission("granted");
            setLocationPermissionMessage("위치 권한과 서비스 동의가 저장되었습니다. 다음 단계로 계속할 수 있습니다.");
            toast("위치 동의와 현재 위치가 저장되었습니다.", {
              description: "철회 버튼으로 언제든 위치 공유를 중단할 수 있습니다.",
            });
          } catch {
            setLocationPermission("denied");
            setLocationPermissionMessage("브라우저 권한은 허용되었지만 서비스 동의 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
            toast("위치 동의 저장에 실패했습니다.", {
              description: "네트워크 상태를 확인한 뒤 다시 시도해주세요.",
            });
          }
        })();
      },
      () => {
        setLocationPermission("denied");
        setLocationPermissionMessage("권한을 허용하지 않아도 데모 탐색은 계속할 수 있습니다. 필요하면 다시 요청할 수 있습니다.");
        toast("위치 권한이 허용되지 않았습니다.", {
          description: "실시간 위치 알림은 나중에 권한을 허용한 뒤 사용할 수 있습니다.",
        });
      },
      LOCATION_PERMISSION_REQUEST_OPTIONS,
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
          {isAuthenticated ? (
            <div className="hidden items-center gap-3 md:flex">
              <span className="border-[3px] border-[#17324d] bg-[#8fd3b6] px-4 py-2 text-sm font-black shadow-[4px_4px_0_#17324d]">
                {user?.name || "보호자"}님 로그인 중
              </span>
              <Button
                onClick={() => logout()}
                variant="outline"
                className="border-[3px] border-[#17324d] bg-[#fff7e7] px-4 py-5 font-black shadow-[4px_4px_0_#f2a37b] hover:bg-white"
              >
                <LogOut className="mr-2 h-4 w-4" /> 로그아웃
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => openOnboarding(0)}
              className="border-[3px] border-[#17324d] bg-[#17324d] px-5 py-5 text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]"
            >
              소셜 로그인으로 시작
            </Button>
          )}
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
                <span className="block text-[#1d8664]">쉽고 빠르게</span>
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
              <p className="mt-6 text-base font-medium leading-8 text-[#d9e5df]">로그인한 사용자가 위치 정보 제공에 동의하면 서버에 동의 내역과 최신 좌표가 저장되고, 같은 가족 그룹의 구성원 위치가 이 목록에 표시됩니다.</p>
              <div className="mt-6 border-[3px] border-[#fff7e7] bg-[#fff7e7] p-4 text-[#17324d] shadow-[5px_5px_0_#8fd3b6]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black">저장된 위치 동의 상태</p>
                    <p className="mt-1 text-xs font-bold text-[#51677a]">
                      {isAuthenticated ? (hasActiveStoredConsent ? "동의 활성화 · 가족 위치 저장 가능" : "동의 없음 · 위치 저장 전") : "로그인 후 동의 상태를 확인할 수 있습니다."}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => void refreshCurrentLocation()}
                      disabled={!isAuthenticated || updateLocationMutation.isPending || isLocationBusy}
                      className="border-[3px] border-[#17324d] bg-[#8fd3b6] font-black text-[#17324d] shadow-[4px_4px_0_#17324d] hover:bg-[#9ee4c6] disabled:opacity-60"
                    >
                      현재 위치 업데이트
                    </Button>
                    <Button
                      onClick={() => void pauseStoredLocationSharing()}
                      disabled={!hasActiveStoredConsent || pauseSharingMutation.isPending}
                      variant="outline"
                      className="border-[3px] border-[#17324d] bg-[#fff7e7] font-black shadow-[4px_4px_0_#8fd3b6] hover:bg-white disabled:opacity-60"
                    >
                      <PauseCircle className="mr-2 h-4 w-4" /> 공유 일시 중지
                    </Button>
                    <Button
                      onClick={() => void revokeStoredConsent()}
                      disabled={!hasActiveStoredConsent || revokeConsentMutation.isPending}
                      variant="outline"
                      className="border-[3px] border-[#17324d] bg-[#fff7e7] font-black shadow-[4px_4px_0_#f2a37b] hover:bg-white disabled:opacity-60"
                    >
                      동의 철회
                    </Button>
                    <Button
                      onClick={() => void deleteStoredLocationHistory()}
                      disabled={deleteHistoryMutation.isPending}
                      variant="outline"
                      className="border-[3px] border-[#17324d] bg-[#fff0e8] font-black text-[#9d3c23] shadow-[4px_4px_0_#17324d] hover:bg-white disabled:opacity-60"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> 기록 삭제
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-3 border-[3px] border-[#fff7e7] bg-[#fff7e7]/10 p-4 text-sm font-bold leading-6 text-[#d9e5df]">
                <p>
                  위치 기록 보관 정책: 최신 가족 위치 확인을 위해 좌표 기록은 서버 정책 기준 <strong className="text-[#fff7e7]">{locationRetentionDays}일</strong> 동안 보관하는 것을 전제로 안내합니다. 사용자는 언제든지 공유를 일시 중지하거나 동의를 철회할 수 있습니다.
                </p>
                <p>
                  기록 삭제를 누르면 현재 로그인한 사용자의 저장 좌표가 즉시 삭제되고 가족 위치 목록에서 사라집니다. 동의 철회는 활성 동의 상태를 종료하지만, 별도 삭제 전까지 보관 기간 내 기록이 남을 수 있으므로 민감한 위치 정보는 기록 삭제를 함께 실행하도록 안내합니다.
                </p>
              </div>
              <div className="mt-8 space-y-4">
                {storedFamilyLocations.length > 0 ? (
                  storedFamilyLocations.map((member, index) => (
                    <div key={member.memberId} className="flex items-center justify-between gap-4 border-[3px] border-[#fff7e7] bg-[#fff7e7] p-4 text-[#17324d] shadow-[5px_5px_0_#8fd3b6]">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#17324d] font-black ${index % 3 === 0 ? "bg-[#8fd3b6]" : index % 3 === 1 ? "bg-[#f2a37b]" : "bg-[#f8d9a8]"}`}>{member.displayName.slice(0, 1)}</span>
                        <div>
                          <p className="font-black">{member.displayName} · {member.role === "child" ? "자녀" : member.role === "guardian" ? "보호자" : "부모"}</p>
                          <p className="text-xs font-bold text-[#51677a]">
                            {member.location ? `동적 지도 마커 표시 중 · 좌표 ${member.location.latitude.toFixed(4)}, ${member.location.longitude.toFixed(4)} · 정확도 ${Math.round(member.location.accuracy ?? 0)}m` : "승인 대기 또는 공유 일시 중지 상태입니다."}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black">{member.location ? new Date(member.location.recordedAt).toLocaleTimeString() : "대기"}</span>
                    </div>
                  ))
                ) : (
                  children.map(child => (
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
                  ))
                )}
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
                  <div className="grid gap-5">
                    {loading && (
                      <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-4 text-sm font-black shadow-[4px_4px_0_#8fd3b6]">
                        로그인 상태를 확인하고 있습니다.
                      </div>
                    )}
                    {error && (
                      <div className="border-[3px] border-[#17324d] bg-[#fff0e8] p-4 text-sm font-black text-[#9d3c23] shadow-[4px_4px_0_#f2a37b]">
                        로그인 상태 확인이 잠시 지연되었습니다. 아래 소셜 로그인으로 다시 시작할 수 있습니다.
                      </div>
                    )}
                    {isAuthenticated ? (
                      <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#8fd3b6]">
                        <div className="flex items-center gap-3">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#17324d] bg-[#8fd3b6]">
                            <CheckCircle2 className="h-7 w-7" />
                          </span>
                          <div>
                            <p className="font-black">{user?.name || "보호자"}님, {loginProviderLabel} 계정 로그인이 완료되었습니다.</p>
                            <p className="text-sm font-bold text-[#51677a]">이제 가족 역할과 위치 정보 제공 동의를 이어서 설정합니다.</p>
                          </div>
                        </div>
                        <Button onClick={goNextStep} className="mt-5 h-14 w-full border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]">
                          다음 단계로 계속 <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => startSocialLogin("kakao")}
                          className="flex min-h-20 items-center gap-4 border-[3px] border-[#17324d] bg-[#fee500] p-4 text-left shadow-[5px_5px_0_#17324d] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0_#17324d]"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-[#17324d] bg-[#3c1e1e] text-lg font-black text-[#fee500]">K</span>
                          <span>
                            <span className="block text-lg font-black">카카오톡으로 3초 가입</span>
                            <span className="mt-1 block text-xs font-bold text-[#4c3d0d]">카카오 계정으로 보호자 확인</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => startSocialLogin("google")}
                          className="flex min-h-20 items-center gap-4 border-[3px] border-[#17324d] bg-[#fffdf5] p-4 text-left shadow-[5px_5px_0_#f2a37b] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0_#f2a37b]"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-[#17324d] bg-white">
                            <Chrome className="h-6 w-6 text-[#1d8664]" />
                          </span>
                          <span>
                            <span className="block text-lg font-black">구글 계정으로 계속</span>
                            <span className="mt-1 block text-xs font-bold text-[#51677a]">이메일 입력 없이 바로 로그인</span>
                          </span>
                        </button>
                      </div>
                    )}
                    <div className="grid gap-4">
                      <label className="text-sm font-black" htmlFor="guardian-name">표시할 보호자 이름</label>
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
                    </div>
                    <p className="border-[3px] border-[#17324d] bg-[#fffdf5] p-4 text-sm font-bold leading-6 shadow-[4px_4px_0_#8fd3b6]">실제 계정 세션은 서버 기반 인증으로 관리됩니다. 카카오톡·구글 버튼은 인증 포털로 이동하며, 로그인 후 이 화면으로 돌아와 가족 역할과 위치 동의 흐름을 이어갑니다.</p>
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
                  <div className="grid gap-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#17324d]">
                        <ShieldCheck className="mb-4 h-8 w-8 text-[#1d8664]" />
                        <p className="font-black">동의 전에는 위치를 표시하지 않음</p>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#51677a]">PinKids는 사용자가 직접 버튼을 누른 뒤에만 브라우저 위치 권한 창을 띄웁니다.</p>
                      </div>
                      <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#f2a37b]">
                        <LockKeyhole className="mb-4 h-8 w-8 text-[#d96d45]" />
                        <p className="font-black">거절해도 계속 이용 가능</p>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#51677a]">권한을 거절해도 가족 그룹 생성과 데모 지도 확인은 계속할 수 있습니다.</p>
                      </div>
                    </div>

                    <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-5 shadow-[6px_6px_0_#17324d]">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex gap-4">
                          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-[#17324d] ${locationPermission === "granted" ? "bg-[#8fd3b6]" : locationPermission === "blocked" || locationPermission === "unsupported" ? "bg-[#f2a37b]" : "bg-[#f8d9a8]"}`}>
                            {locationPermission === "granted" ? <CheckCircle2 className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
                          </span>
                          <div>
                            <p className="text-xs font-black text-[#1d8664]">현재 상태 · {getLocationPermissionStatusLabel(locationPermission)}</p>
                            <p className="mt-1 text-lg font-black">{locationPanelCopy.title}</p>
                            <p className="mt-2 text-sm font-bold leading-6 text-[#51677a]">{locationPermissionMessage || locationPanelCopy.description}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={checkLocationPermissionAgain}
                          variant="outline"
                          className="h-11 shrink-0 border-[3px] border-[#17324d] bg-[#fff7e7] px-4 font-black shadow-[4px_4px_0_#f2a37b] hover:bg-white"
                          disabled={isLocationBusy}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" /> 권한 다시 확인
                        </Button>
                      </div>
                    </div>

                    <div className="border-[3px] border-[#17324d] bg-[#fff7e7] p-5 shadow-[5px_5px_0_#8fd3b6]">
                      <p className="mb-3 font-black">위치 권한을 요청하기 전 확인사항</p>
                      <div className="grid gap-3 md:grid-cols-3">
                        {LOCATION_PERMISSION_EXPLANATIONS.map(item => (
                          <div key={item} className="border-[3px] border-[#17324d] bg-[#fffdf5] p-4 text-sm font-bold leading-6 shadow-[3px_3px_0_#17324d]">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    {(showLocationSettingsGuide || locationPermission === "blocked") && (
                      <div className="border-[3px] border-[#17324d] bg-[#fff0e8] p-5 shadow-[5px_5px_0_#f2a37b]">
                        <div className="mb-4 flex items-center gap-3">
                          <Settings className="h-6 w-6 text-[#d96d45]" />
                          <div>
                            <p className="font-black">브라우저 설정에서 다시 허용하는 방법</p>
                            <p className="text-sm font-bold text-[#716052]">설정을 바꾼 뒤 이 화면의 ‘권한 다시 확인’을 눌러주세요.</p>
                          </div>
                        </div>
                        <div className="grid gap-3">
                          {BROWSER_SETTING_GUIDES.map(guide => (
                            <div key={guide.environment} className="border-[3px] border-[#17324d] bg-[#fffdf5] p-4 text-sm leading-6 shadow-[3px_3px_0_#17324d]">
                              <p className="font-black">{guide.environment}</p>
                              <p className="mt-1 font-bold text-[#51677a]">{guide.steps}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        onClick={requestLocationConsent}
                        className="h-14 flex-1 border-[3px] border-[#17324d] bg-[#8fd3b6] px-6 font-black text-[#17324d] shadow-[5px_5px_0_#17324d] hover:bg-[#9ee4c6] disabled:opacity-70"
                        disabled={isLocationBusy || locationPermission === "blocked" || locationPermission === "unsupported"}
                      >
                        {locationPermission === "denied" ? "위치 권한 다시 요청" : "위치 권한 요청하기"}
                      </Button>
                      <Button onClick={goNextStep} className="h-14 flex-1 border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]">
                        {locationPermission === "granted" ? "권한 확인 후 계속" : "나중에 설정하고 계속"}
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
                          <p className="text-sm font-bold text-[#51677a]">역할: {familyRole} · 위치 권한: {getLocationPermissionStatusLabel(locationPermission)} · 저장 상태: {hasActiveStoredConsent ? "동의 저장됨" : "동의 미저장"}</p>
                        </div>
                      </div>
                    </div>
                    <Button onClick={completeOnboarding} disabled={grantConsentMutation.isPending || updateLocationMutation.isPending} className="h-14 border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462] disabled:opacity-70">
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
