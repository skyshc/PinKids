import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useOnboardingModal } from "@/contexts/OnboardingModalContext";
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
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Chrome,
  KeyRound,
  LockKeyhole,
  MapPinned,
  RotateCcw,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const onboardingSteps = [
  {
    eyebrow: "1단계 · 간편 소셜 로그인",
    title: "카카오톡이나 구글 계정으로 빠르게 시작해요.",
    description:
      "보호자가 이미 쓰는 계정으로 먼저 로그인한 뒤, 가족 역할과 위치 정보 동의를 차례로 확인합니다. 선택한 소셜 로그인 방식은 인증 포털에 전달됩니다.",
    icon: KeyRound,
  },
  {
    eyebrow: "2단계 · 가족 역할 선택",
    title: "누가 위치를 보고, 누가 공유할지 정합니다.",
    description:
      "부모, 보호자, 자녀 역할을 나누면 위치 정보가 필요한 사람에게만 보이도록 안내할 수 있습니다.",
    icon: UsersRound,
  },
  {
    eyebrow: "3단계 · 위치 정보 동의",
    title: "위치 정보 제공은 명확한 동의 뒤에만 시작됩니다.",
    description:
      "브라우저 위치 권한 요청을 통해 현재 기기의 위치 제공 여부를 선택합니다. 거절해도 데모 화면은 계속 볼 수 있습니다.",
    icon: MapPinned,
  },
  {
    eyebrow: "준비 완료",
    title: "이제 가족 위치 화면으로 이동할 수 있어요.",
    description:
      "온보딩이 끝나면 다음 방문부터는 바로 메인 화면을 보여줍니다. 언제든 시작 버튼으로 이 흐름을 다시 열 수 있습니다.",
    icon: ShieldCheck,
  },
];

export default function OnboardingModal() {
  const { user, loading, error, isAuthenticated } = useAuth();
  const { showOnboarding, onboardingStep, setOnboardingStep, closeOnboarding } = useOnboardingModal();

  const [guardianName, setGuardianName] = useState("민지 보호자");
  const [familyRole, setFamilyRole] = useState("부모");
  const [locationPermission, setLocationPermission] = useState<LocationPermissionUiState>("idle");
  const [locationPermissionMessage, setLocationPermissionMessage] = useState("");
  const [showLocationSettingsGuide, setShowLocationSettingsGuide] = useState(false);

  const trpcUtils = trpc.useUtils();
  const consentStatusQuery = trpc.consent.getStatus.useQuery(undefined, { enabled: isAuthenticated });
  const hasActiveStoredConsent = consentStatusQuery.data?.active ?? false;

  const grantConsentMutation = trpc.consent.grant.useMutation({
    onSuccess: async () => {
      await Promise.all([trpcUtils.consent.getStatus.invalidate(), trpcUtils.family.myMemberships.invalidate()]);
    },
  });
  const updateLocationMutation = trpc.location.updateCurrent.useMutation({
    onSuccess: async () => {
      await trpcUtils.location.getFamilyLocations.invalidate();
    },
  });

  const loginProviderLabel =
    user?.loginMethod === "google" ? "구글" : user?.loginMethod === "kakao" ? "카카오톡" : "소셜";
  const locationPanelCopy = getLocationPermissionPanelCopy(locationPermission);
  const isLocationBusy = locationPermission === "checking" || locationPermission === "requesting";
  const apiFamilyRole = familyRole === "자녀" ? "child" : "guardian";

  const currentStep = onboardingSteps[onboardingStep];
  const CurrentStepIcon = currentStep.icon;
  const progressWidth = `${((onboardingStep + 1) / onboardingSteps.length) * 100}%`;

  useEffect(() => {
    if (user?.name) {
      setGuardianName(`${user.name} 보호자`);
    }
  }, [user?.name]);

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

  const goNextStep = () => {
    setOnboardingStep(Math.min(onboardingStep + 1, onboardingSteps.length - 1));
  };

  const startSocialLogin = (provider: SocialLoginProvider) => {
    try {
      window.localStorage.setItem("child-location-preferred-login-provider", provider);
    } catch {
      // ignore
    }
    window.location.href = buildSocialLoginUrl(getLoginUrl(), provider);
  };

  const saveGrantedLocation = async (position: GeolocationPosition) => {
    if (!isAuthenticated) {
      toast("로그인이 먼저 필요합니다.", {
        description: "위치 동의 기록과 가족 위치 저장은 로그인한 사용자에게만 연결됩니다.",
      });
      setOnboardingStep(0);
      return;
    }
    const consentResult = await grantConsentMutation.mutateAsync({
      displayName: guardianName || user?.name || "보호자",
      familyRole: apiFamilyRole,
      permissionState: "granted",
      consentText:
        "PinKids에서 가족 구성원이 최신 위치를 확인할 수 있도록 브라우저 위치 정보 제공에 동의합니다.",
    });
    await updateLocationMutation.mutateAsync({
      familyId: consentResult.family?.id,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
      recordedAt: position.timestamp || Date.now(),
    });
  };

  const checkLocationPermissionAgain = async () => {
    if (!navigator.geolocation) {
      setLocationPermission("unsupported");
      setLocationPermissionMessage("이 브라우저에서는 위치 권한 요청을 사용할 수 없습니다. 위치 없이 데모를 계속할 수 있습니다.");
      return;
    }
    try {
      setLocationPermission("checking");
      setLocationPermissionMessage("브라우저 권한 상태를 확인하고 있습니다...");
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
    } catch {
      setLocationPermission("denied");
      setLocationPermissionMessage("권한 상태를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.");
    }
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
    try {
      setLocationPermission("requesting");
      setLocationPermissionMessage("브라우저 권한 상태를 확인하고 있습니다...");
      setShowLocationSettingsGuide(false);
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
      setLocationPermissionMessage("브라우저 권한 창이 열리면 '허용'을 선택해주세요.");
      return new Promise<void>(resolve => {
        const timeout = setTimeout(() => {
          setLocationPermission("denied");
          setLocationPermissionMessage("권한 요청 시간이 초과되었습니다. 다시 시도해주세요.");
          toast("권한 요청 시간 초과", {
            description: "브라우저 권한 창이 나타나지 않았습니다. 다시 시도해주세요.",
          });
          resolve();
        }, 30000);
        navigator.geolocation.getCurrentPosition(
          position => {
            clearTimeout(timeout);
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
              resolve();
            })();
          },
          () => {
            clearTimeout(timeout);
            setLocationPermission("denied");
            setLocationPermissionMessage("권한을 허용하지 않아도 데모 탐색은 계속할 수 있습니다. 아래 버튼으로 다시 시도할 수 있습니다.");
            toast("위치 권한이 허용되지 않았습니다.", {
              description: "실시간 위치 알림은 나중에 권한을 허용한 뒤 사용할 수 있습니다.",
            });
            resolve();
          },
          LOCATION_PERMISSION_REQUEST_OPTIONS,
        );
      });
    } catch {
      setLocationPermission("denied");
      setLocationPermissionMessage("위치 권한 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
      toast("오류 발생", {
        description: "위치 권한 요청 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    }
  };

  const completeOnboarding = () => {
    try {
      window.localStorage.setItem("child-location-onboarding-complete", "true");
    } catch {
      // ignore
    }
    closeOnboarding();
    toast("온보딩이 완료되었습니다.", {
      description: `${guardianName || "보호자"}님, 이제 위치 보기 섹션에서 가족 상태를 확인할 수 있습니다.`,
    });
  };

  if (!showOnboarding) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17324d]/72 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative grid max-h-[92vh] w-full max-w-5xl overflow-y-auto border-[4px] border-[#17324d] bg-[#fff7e7] shadow-[14px_14px_0_#f2a37b] lg:grid-cols-[0.92fr_1.08fr]">
        {/* Close button */}
        <button
          type="button"
          onClick={closeOnboarding}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center border-[3px] border-[#17324d] bg-[#fffdf5] shadow-[4px_4px_0_#17324d] transition-transform hover:translate-x-0.5 hover:translate-y-0.5"
          aria-label="온보딩 닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Aside */}
        <aside className="relative min-h-[340px] overflow-hidden border-b-[4px] border-[#17324d] bg-[#17324d] p-8 text-[#fff7e7] lg:border-b-0 lg:border-r-[4px]">
          <div className="absolute -left-16 top-12 h-52 w-52 rounded-full bg-[#8fd3b6]/35 blur-2xl" />
          <div className="absolute -right-10 bottom-12 h-52 w-52 rounded-full bg-[#f2a37b]/35 blur-2xl" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div>
              <div className="mb-8 inline-flex items-center gap-2 border-[3px] border-[#fff7e7] bg-[#8fd3b6] px-4 py-2 text-sm font-black text-[#17324d] shadow-[4px_4px_0_#fff7e7]">
                <LockKeyhole className="h-4 w-4" /> 처음 시작 설정
              </div>
              <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                로그인과 위치 동의를 한 번에 안내합니다.
              </h2>
              <p className="mt-5 text-sm font-medium leading-7 text-[#d9e5df]">
                위치 공유 서비스는 신뢰가 먼저입니다. 그래서 첫 화면에서 보호자 확인, 가족 역할, 위치 제공 동의 이유를 순서대로 설명합니다.
              </p>
            </div>
            <div className="space-y-3">
              {onboardingSteps.map((step, index) => (
                <button
                  type="button"
                  key={step.eyebrow}
                  onClick={() => setOnboardingStep(index)}
                  className={`flex w-full items-center gap-3 border-[3px] p-3 text-left text-sm font-black transition-all ${
                    index === onboardingStep
                      ? "border-[#fff7e7] bg-[#f2a37b] text-[#17324d] shadow-[4px_4px_0_#fff7e7]"
                      : "border-[#fff7e7]/40 bg-[#fff7e7]/5 text-[#fff7e7] hover:bg-[#fff7e7]/12"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2px] border-current">
                    {index + 1}
                  </span>
                  <span>{step.eyebrow}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main section */}
        <section className="p-6 sm:p-8 lg:p-10">
          {/* Progress bar */}
          <div className="mb-8 h-4 border-[3px] border-[#17324d] bg-[#fffdf5]">
            <div className="h-full bg-[#8fd3b6] transition-all duration-500" style={{ width: progressWidth }} />
          </div>

          <div className="mb-6 flex h-16 w-16 rotate-[-3deg] items-center justify-center border-[3px] border-[#17324d] bg-[#f8d9a8] shadow-[5px_5px_0_#17324d]">
            <CurrentStepIcon className="h-8 w-8" />
          </div>
          <p className="mb-3 inline-block border-[3px] border-[#17324d] bg-[#8fd3b6] px-3 py-1 text-xs font-black shadow-[3px_3px_0_#17324d]">
            {currentStep.eyebrow}
          </p>
          <h3 id="onboarding-title" className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
            {currentStep.title}
          </h3>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#51677a]">{currentStep.description}</p>

          <div className="mt-8">
            {/* Step 0: Login */}
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
                    <Button
                      onClick={goNextStep}
                      className="mt-5 h-14 w-full border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]"
                    >
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
                  <label className="text-sm font-black" htmlFor="guardian-name">
                    표시할 보호자 이름
                  </label>
                  <div className="flex flex-1 items-center gap-3 border-[3px] border-[#17324d] bg-[#fffdf5] px-4 py-3 shadow-[4px_4px_0_#17324d]">
                    <UserRound className="h-5 w-5 text-[#1d8664]" />
                    <input
                      id="guardian-name"
                      value={guardianName}
                      onChange={e => setGuardianName(e.target.value)}
                      className="w-full bg-transparent text-base font-black outline-none placeholder:text-[#8ba0ad]"
                      placeholder="예: 민지 보호자"
                    />
                  </div>
                </div>
                <p className="border-[3px] border-[#17324d] bg-[#fffdf5] p-4 text-sm font-bold leading-6 shadow-[4px_4px_0_#8fd3b6]">
                  실제 계정 세션은 서버 기반 인증으로 관리됩니다. 카카오톡·구글 버튼은 인증 포털로 이동하며, 로그인 후 이 화면으로 돌아와 가족 역할과 위치 동의 흐름을 이어갑니다.
                </p>
              </div>
            )}

            {/* Step 1: Family role */}
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
                    <p className="mt-2 text-sm font-bold leading-6 text-[#51677a]">
                      {role === "자녀" ? "내 위치를 가족에게 공유합니다." : "아이 위치와 알림을 확인합니다."}
                    </p>
                  </button>
                ))}
                <div className="sm:col-span-3">
                  <Button
                    onClick={goNextStep}
                    className="mt-2 h-14 w-full border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]"
                  >
                    {familyRole} 역할로 계속 <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Location consent */}
            {onboardingStep === 2 && (
              <div className="grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#17324d]">
                    <ShieldCheck className="mb-4 h-8 w-8 text-[#1d8664]" />
                    <p className="font-black">동의 전에는 위치를 표시하지 않음</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#51677a]">
                      PinKids는 사용자가 직접 버튼을 누른 뒤에만 브라우저 위치 권한 창을 띄웁니다.
                    </p>
                  </div>
                  <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#f2a37b]">
                    <LockKeyhole className="mb-4 h-8 w-8 text-[#d96d45]" />
                    <p className="font-black">거절해도 계속 이용 가능</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#51677a]">
                      권한을 거절해도 가족 그룹 생성과 데모 지도 확인은 계속할 수 있습니다.
                    </p>
                  </div>
                </div>
                <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-5 shadow-[6px_6px_0_#17324d]">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-[#17324d] ${
                          locationPermission === "granted"
                            ? "bg-[#8fd3b6]"
                            : locationPermission === "blocked" || locationPermission === "unsupported"
                              ? "bg-[#f2a37b]"
                              : "bg-[#f8d9a8]"
                        }`}
                      >
                        {locationPermission === "granted" ? (
                          <CheckCircle2 className="h-7 w-7" />
                        ) : (
                          <AlertTriangle className="h-7 w-7" />
                        )}
                      </span>
                      <div>
                        <p className="text-xs font-black text-[#1d8664]">
                          현재 상태 · {getLocationPermissionStatusLabel(locationPermission)}
                        </p>
                        <p className="mt-1 text-lg font-black">{locationPanelCopy.title}</p>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#51677a]">
                          {locationPermissionMessage || locationPanelCopy.description}
                        </p>
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
                        <p className="text-sm font-bold text-[#716052]">설정을 바꾼 뒤 이 화면의 '권한 다시 확인'을 눌러주세요.</p>
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
                    disabled={
                      isLocationBusy ||
                      locationPermission === "blocked" ||
                      locationPermission === "unsupported"
                    }
                  >
                    {locationPermission === "denied" ? "위치 권한 다시 요청" : "위치 권한 요청하기"}
                  </Button>
                  <Button
                    onClick={goNextStep}
                    className="h-14 flex-1 border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]"
                  >
                    {locationPermission === "granted" ? "권한 확인 후 계속" : "나중에 설정하고 계속"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Complete */}
            {onboardingStep === 3 && (
              <div className="grid gap-4">
                <div className="border-[3px] border-[#17324d] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#17324d]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#17324d] bg-[#8fd3b6]">
                      <CheckCircle2 className="h-7 w-7" />
                    </span>
                    <div>
                      <p className="font-black">{guardianName || "보호자"}님 설정 완료</p>
                      <p className="text-sm font-bold text-[#51677a]">
                        역할: {familyRole} · 위치 권한: {getLocationPermissionStatusLabel(locationPermission)} · 저장 상태:{" "}
                        {hasActiveStoredConsent ? "동의 저장됨" : "동의 미저장"}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={completeOnboarding}
                  disabled={grantConsentMutation.isPending || updateLocationMutation.isPending}
                  className="h-14 border-[3px] border-[#17324d] bg-[#17324d] px-6 font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462] disabled:opacity-70"
                >
                  가족 위치 화면으로 이동
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
