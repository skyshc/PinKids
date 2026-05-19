import { useAuth } from "@/_core/hooks/useAuth";
import { MapView } from "@/components/Map";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useOnboardingModal } from "@/contexts/OnboardingModalContext";
import { trpc } from "@/lib/trpc";
import {
  LOCATION_PERMISSION_REQUEST_OPTIONS,
  getLocationPermissionPanelCopy,
  mapBrowserPermissionState,
  queryGeolocationPermission,
  type LocationPermissionUiState,
} from "@/lib/locationPermission";
import { toast } from "sonner";
import {
  BellRing,
  LockKeyhole,
  MapPin,
  PauseCircle,
  Radar,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const children = [
  { name: "지우", place: "학교 근처", status: "안전 반경 안", time: "방금 전", accent: "mint" },
  { name: "하준", place: "학원 도착", status: "체크인 완료", time: "12분 전", accent: "peach" },
  { name: "서윤", place: "집으로 이동 중", status: "경로 공유 중", time: "24분 전", accent: "navy" },
];

export default function MapViewPage() {
  const { user, isAuthenticated } = useAuth();
  const { openOnboarding } = useOnboardingModal();

  const mapReady = useRef(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const familyMarkerRefs = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const safeZoneCircleRefs = useRef<google.maps.Circle[]>([]);
  const selectedZoneInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [locationPermission, setLocationPermission] = useState<LocationPermissionUiState>("idle");
  const [isSelectingZoneLocation, setIsSelectingZoneLocation] = useState(false);
  const [selectedZoneMarker, setSelectedZoneMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [safeZoneName, setSafeZoneName] = useState("우리 집");
  const [safeZoneRadius, setSafeZoneRadius] = useState(300);
  const [safeZoneCenter, setSafeZoneCenter] = useState({ lat: 37.5668, lng: 126.9786 });

  const trpcUtils = trpc.useUtils();
  const consentStatusQuery = trpc.consent.getStatus.useQuery(undefined, { enabled: isAuthenticated });
  const familyMembershipsQuery = trpc.family.myMemberships.useQuery(undefined, { enabled: isAuthenticated });
  const familyLocationsQuery = trpc.location.getFamilyLocations.useQuery(undefined, {
    enabled: isAuthenticated,
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
    onSuccess: async () => { await trpcUtils.location.getFamilyLocations.invalidate(); },
  });
  const deleteHistoryMutation = trpc.location.deleteHistory.useMutation({
    onSuccess: async () => {
      await Promise.all([trpcUtils.consent.getStatus.invalidate(), trpcUtils.location.getFamilyLocations.invalidate()]);
    },
  });
  const updateLocationMutation = trpc.location.updateCurrent.useMutation({
    onSuccess: async () => { await trpcUtils.location.getFamilyLocations.invalidate(); },
    onError: (error) => {
      const msg =
        error.data?.code === "FORBIDDEN" ? "위치 공유 권한이 없습니다" :
        error.data?.code === "UNAUTHORIZED" ? "다시 로그인해주세요" :
        "위치 업로드에 실패했습니다.";
      toast.error(msg);
    },
  });
  const createSafeZoneMutation = trpc.safeZones.create.useMutation({
    onSuccess: async () => {
      await trpcUtils.safeZones.list.invalidate();
      toast("안전 구역을 저장했습니다.");
    },
    onError: (error) => {
      toast.error("안전 구역 저장에 실패했습니다.", { description: error.message });
    },
  });
  const deleteSafeZoneMutation = trpc.safeZones.delete.useMutation({
    onSuccess: async () => { await trpcUtils.safeZones.list.invalidate(); },
  });
  const setAlertSettingMutation = trpc.alertSettings.set.useMutation({
    onSuccess: async () => { await trpcUtils.alertSettings.get.invalidate(); },
  });
  const acknowledgeAlertMutation = trpc.locationAlerts.acknowledge.useMutation({
    onSuccess: async () => { await trpcUtils.locationAlerts.list.invalidate(); },
  });
  const setAlertChannelsMutation = trpc.alertSettings.setChannels.useMutation({
    onSuccess: () => { void trpcUtils.alertSettings.get.invalidate({ familyId: primaryFamilyId }); },
  });

  const storedFamilyLocations = familyLocationsQuery.data?.locations ?? [];
  const storedLocationsWithCoordinates = storedFamilyLocations.filter(item => item.location);
  const primaryGuardianMembership = familyMembershipsQuery.data?.memberships.find(
    m => m.role === "guardian" && m.inviteStatus === "accepted",
  );
  const primaryFamilyId = primaryGuardianMembership?.familyId ?? 0;

  const safeZonesQuery = trpc.safeZones.list.useQuery(
    { familyId: primaryFamilyId },
    { enabled: Boolean(primaryGuardianMembership), retry: false },
  );
  const locationAlertsQuery = trpc.locationAlerts.list.useQuery(
    { familyId: primaryFamilyId, limit: 8 },
    { enabled: Boolean(primaryGuardianMembership), retry: false },
  );
  const alertSettingQuery = trpc.alertSettings.get.useQuery(
    { familyId: primaryFamilyId },
    { enabled: Boolean(primaryGuardianMembership), retry: false },
  );

  const safeZones = safeZonesQuery.data?.zones ?? [];
  const recentLocationAlerts = locationAlertsQuery.data?.alerts ?? [];
  const geofenceAlertsEnabled = alertSettingQuery.data?.setting.geofenceAlertsEnabled ?? true;
  const alertChannels = (alertSettingQuery.data?.setting.alertChannels ?? ["push"]) as ("push" | "email" | "sms")[];
  const hasActiveStoredConsent = consentStatusQuery.data?.active ?? false;
  const locationRetentionDays = familyLocationsQuery.data?.retentionDays ?? 30;
  const isLocationBusy = locationPermission === "checking" || locationPermission === "requesting";

  const channelLabels = { push: "푸시 알림", email: "이메일", sms: "문자 메시지" } as const;

  // 자동 위치 추적 (5분 간격)
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !hasActiveStoredConsent || !navigator.geolocation) return;
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;
    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return;
          const { latitude, longitude, accuracy } = position.coords;
          if (lastLocationRef.current) {
            const R = 6371000;
            const dLat = ((latitude - lastLocationRef.current.lat) * Math.PI) / 180;
            const dLng = ((longitude - lastLocationRef.current.lng) * Math.PI) / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos((lastLocationRef.current.lat*Math.PI)/180) * Math.cos((latitude*Math.PI)/180) * Math.sin(dLng/2)**2;
            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            if (dist < 10) return;
          }
          lastLocationRef.current = { lat: latitude, lng: longitude };
          updateLocationMutation.mutate({ latitude, longitude, accuracy: accuracy ?? undefined, recordedAt: new Date().getTime() });
        },
        () => {},
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
      );
    };
    updateLocation();
    intervalId = setInterval(updateLocation, 5 * 60 * 1000);
    return () => { isMounted = false; if (intervalId) clearInterval(intervalId); };
  }, [isAuthenticated, user?.id, hasActiveStoredConsent]);

  // 지도 마커 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    familyMarkerRefs.current.forEach(m => { m.map = null; });
    familyMarkerRefs.current = [];
    const bounds = new window.google.maps.LatLngBounds();
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
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding:12px;font-family:sans-serif;color:#17324d;"><div style="font-weight:bold;font-size:14px;margin-bottom:6px;">${item.displayName}</div><div style="font-size:12px;color:#51677a;"><strong>위치:</strong> ${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}</div><div style="font-size:12px;color:#51677a;"><strong>마지막 업데이트:</strong> ${new Date(item.location.recordedAt).toLocaleString("ko-KR")}</div></div>`,
      });
      pin.addEventListener("click", () => infoWindow.open(mapInstanceRef.current, marker));
      familyMarkerRefs.current.push(marker);
      bounds.extend(position);
    });
    if (storedFamilyLocations.length > 0) mapInstanceRef.current.fitBounds(bounds, 72);
  }, [storedFamilyLocations]);

  // 안전 구역 원형 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    safeZoneCircleRefs.current.forEach(c => c.setMap(null));
    safeZoneCircleRefs.current = [];
    safeZones.filter(z => z.isActive).forEach(zone => {
      const circle = new window.google.maps.Circle({
        strokeColor: zone.alertsEnabled ? "#8fd3b6" : "#f2a37b",
        strokeOpacity: 0.95,
        strokeWeight: 3,
        fillColor: zone.alertsEnabled ? "#8fd3b6" : "#f2a37b",
        fillOpacity: 0.18,
        map: mapInstanceRef.current,
        center: { lat: zone.centerLatitude, lng: zone.centerLongitude },
        radius: zone.radiusMeters,
      });
      safeZoneCircleRefs.current.push(circle);
    });
  }, [safeZones]);

  const handleMapReady = (map: google.maps.Map) => {
    mapInstanceRef.current = map;
    if (mapReady.current || !window.google) return;
    mapReady.current = true;
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
    if (storedLocationsWithCoordinates.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      storedLocationsWithCoordinates.forEach(loc => {
        if (loc.location) bounds.extend({ lat: loc.location.latitude, lng: loc.location.longitude });
      });
      storedLocationsWithCoordinates.length === 1
        ? (map.setCenter({ lat: storedLocationsWithCoordinates[0].location!.latitude, lng: storedLocationsWithCoordinates[0].location!.longitude }), map.setZoom(15))
        : map.fitBounds(bounds, 50);
    } else {
      map.setCenter({ lat: 37.5665, lng: 126.9780 });
      map.setZoom(13);
    }
  };

  const handleMapClickForZoneSelection = (event: google.maps.MapMouseEvent) => {
    if (!isSelectingZoneLocation || !event.latLng) return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    if (selectedZoneMarker) selectedZoneMarker.map = null;
    if (selectedZoneInfoWindowRef.current) selectedZoneInfoWindowRef.current.close();
    const pin = document.createElement("div");
    pin.style.cssText = "width:40px;height:40px;background-color:#f2a37b;border:3px solid #17324d;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:20px;box-shadow:0 3px 10px rgba(0,0,0,0.4);";
    pin.innerHTML = "📍";
    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      map: mapInstanceRef.current,
      position: { lat, lng },
      content: pin,
      title: "선택된 안전 구역 위치",
    });
    const infoWindow = new window.google.maps.InfoWindow({
      content: `<div style="padding:10px;font-family:Arial,sans-serif;"><div style="font-weight:bold;color:#17324d;margin-bottom:5px;">${safeZoneName || "안전 구역"}</div><div style="font-size:12px;color:#51677a;">${lat.toFixed(5)}, ${lng.toFixed(5)}</div></div>`,
    });
    infoWindow.open(mapInstanceRef.current, marker);
    setSelectedZoneMarker(marker);
    selectedZoneInfoWindowRef.current = infoWindow;
    setSafeZoneCenter({ lat, lng });
    toast("안전 구역 위치가 선택되었습니다.", { description: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  };

  const useCurrentMapCenterForSafeZone = () => {
    const center = mapInstanceRef.current?.getCenter();
    if (!center) { toast("지도 중심을 아직 확인할 수 없습니다."); return; }
    setSafeZoneCenter({ lat: center.lat(), lng: center.lng() });
    toast("지도 중심 좌표를 안전 구역 중심으로 선택했습니다.", { description: `${center.lat().toFixed(5)}, ${center.lng().toFixed(5)}` });
  };

  const createSafeZone = async () => {
    if (!primaryFamilyId) {
      toast("보호자 가족 그룹이 필요합니다.");
      openOnboarding(1);
      return;
    }
    await createSafeZoneMutation.mutateAsync({
      familyId: primaryFamilyId,
      name: safeZoneName.trim() || "안전 구역",
      centerLatitude: safeZoneCenter.lat,
      centerLongitude: safeZoneCenter.lng,
      radiusMeters: safeZoneRadius,
      alertsEnabled: true,
    });
  };

  const toggleGeofenceAlerts = async () => {
    if (!primaryFamilyId) return;
    const nextEnabled = !geofenceAlertsEnabled;
    await setAlertSettingMutation.mutateAsync({ familyId: primaryFamilyId, geofenceAlertsEnabled: nextEnabled });
    toast(nextEnabled ? "위치 이탈 알림을 켰습니다." : "위치 이탈 알림을 껐습니다.");
  };

  const toggleAlertChannel = async (channel: "push" | "email" | "sms") => {
    if (!primaryFamilyId) return;
    const newChannels = alertChannels.includes(channel)
      ? alertChannels.filter(c => c !== channel)
      : [...alertChannels, channel];
    if (newChannels.length === 0) { toast("최소 하나의 알림 채널을 선택해야 합니다."); return; }
    await setAlertChannelsMutation.mutateAsync({ familyId: primaryFamilyId, alertChannels: newChannels });
  };

  const refreshCurrentLocation = async () => {
    if (!navigator.geolocation) { toast("위치 권한을 사용할 수 없습니다."); return; }
    if (!hasActiveStoredConsent) {
      toast("먼저 위치 정보 제공에 동의해주세요.");
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
            toast("현재 위치가 업데이트되었습니다.");
          } catch {
            setLocationPermission("denied");
            toast("현재 위치 저장에 실패했습니다.");
          }
        })();
      },
      () => { setLocationPermission("denied"); toast("위치 업데이트가 허용되지 않았습니다."); },
      LOCATION_PERMISSION_REQUEST_OPTIONS,
    );
  };

  const revokeStoredConsent = async () => {
    await revokeConsentMutation.mutateAsync();
    setLocationPermission("idle");
    toast("위치 정보 제공 동의가 철회되었습니다.");
  };

  const pauseStoredLocationSharing = async () => {
    await pauseSharingMutation.mutateAsync();
    setLocationPermission("idle");
    toast("위치 공유가 일시 중지되었습니다.");
  };

  const deleteStoredLocationHistory = async () => {
    await deleteHistoryMutation.mutateAsync();
    setLocationPermission("idle");
    toast("저장된 위치 기록이 삭제되었습니다.");
  };

  const acknowledgeLocationAlert = async (alertId: number) => {
    await acknowledgeAlertMutation.mutateAsync({ alertId });
    toast("알림을 확인 처리했습니다.");
  };

  return (
    <AppLayout>
      {/* 로그인 안내 배너 */}
      {!isAuthenticated && (
        <div className="border-b-[3px] border-[#17324d] bg-[#f2a37b] py-4">
          <div className="container flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="font-black text-[#17324d]">
              <LockKeyhole className="mr-2 inline h-5 w-5" />
              실시간 위치 보기는 로그인 후 이용할 수 있습니다.
            </p>
            <Button
              onClick={() => openOnboarding(0)}
              className="border-[3px] border-[#17324d] bg-[#17324d] px-5 font-black text-[#fff7e7] shadow-[4px_4px_0_#fff7e7] hover:bg-[#254462]"
            >
              소셜 로그인으로 시작
            </Button>
          </div>
        </div>
      )}

      {/* Map + 우측 패널 */}
      <section className="border-b-[3px] border-[#17324d] bg-[#17324d] py-12 sm:py-16 text-[#fff7e7]">
        <div className="container grid gap-6 sm:gap-8 lg:gap-10 grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden border-[4px] border-[#fff7e7] bg-[#fff7e7] shadow-[12px_12px_0_#f2a37b] w-full h-[300px] sm:h-[500px] lg:h-[700px]">
            <MapView
              initialCenter={{ lat: 37.5668, lng: 126.9786 }}
              initialZoom={15}
              onMapReady={handleMapReady}
              onClick={handleMapClickForZoneSelection}
              className="w-full h-full"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="mb-4 inline-flex w-fit items-center gap-2 border-[3px] border-[#fff7e7] bg-[#f2a37b] px-4 py-2 text-sm font-black text-[#17324d] shadow-[4px_4px_0_#fff7e7]">
              <Radar className="h-4 w-4" /> 실시간 위치 화면
            </p>
            <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
              지도 위에 안전 구역과 이동 경로를 함께 표시합니다.
            </h2>
            <p className="mt-6 text-base font-medium leading-8 text-[#d9e5df]">
              로그인한 사용자가 위치 정보 제공에 동의하면 서버에 동의 내역과 최신 좌표가 저장되고, 같은 가족 그룹의 구성원 위치가 이 목록에 표시됩니다.
            </p>

            {/* 위치 동의 상태 */}
            <div className="mt-6 border-[3px] border-[#fff7e7] bg-[#fff7e7] p-4 text-[#17324d] shadow-[5px_5px_0_#8fd3b6]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black">저장된 위치 동의 상태</p>
                  <p className="mt-1 text-xs font-bold text-[#51677a]">
                    {isAuthenticated
                      ? hasActiveStoredConsent
                        ? "동의 활성화 · 가족 위치 저장 가능"
                        : "동의 없음 · 위치 저장 전"
                      : "로그인 후 동의 상태를 확인할 수 있습니다."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
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

            {/* 보관 정책 안내 */}
            <div className="mt-6 grid gap-3 border-[3px] border-[#fff7e7] bg-[#fff7e7]/10 p-4 text-sm font-bold leading-6 text-[#d9e5df]">
              <p>위치 기록 보관 정책: 최신 가족 위치 확인을 위해 좌표 기록은 서버 정책 기준 <strong className="text-[#fff7e7]">{locationRetentionDays}일</strong> 동안 보관합니다. 사용자는 언제든지 공유를 일시 중지하거나 동의를 철회할 수 있습니다.</p>
            </div>

            {/* 안전 구역 알림 설정 */}
            <div className="mt-6 grid gap-4 border-[3px] border-[#fff7e7] bg-[#fff7e7] p-4 text-[#17324d] shadow-[5px_5px_0_#f2a37b]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="inline-flex items-center gap-2 text-sm font-black"><BellRing className="h-4 w-4" /> 안전 구역 알림</p>
                  <p className="mt-1 text-xs font-bold text-[#51677a]">지도 중심을 기준으로 반경을 저장하면 이후 위치 업데이트 시 진입·이탈 기록이 남습니다.</p>
                </div>
                <Button
                  onClick={() => void toggleGeofenceAlerts()}
                  disabled={!primaryFamilyId || setAlertSettingMutation.isPending}
                  variant="outline"
                  className={`border-[3px] border-[#17324d] font-black shadow-[4px_4px_0_#17324d] ${geofenceAlertsEnabled ? "bg-[#8fd3b6]" : "bg-[#fff0e8] text-[#9d3c23]"}`}
                >
                  {geofenceAlertsEnabled ? "알림 ON" : "알림 OFF"}
                </Button>
              </div>
              <div className="border-t-[3px] border-[#17324d] pt-4">
                <p className="mb-3 text-xs font-black">알림 수신 방식</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(["push", "email", "sms"] as const).map(channel => (
                    <button
                      key={channel}
                      onClick={() => void toggleAlertChannel(channel)}
                      disabled={!primaryFamilyId || setAlertChannelsMutation.isPending}
                      className={`border-[3px] border-[#17324d] px-3 py-2 text-xs font-black transition-all ${alertChannels.includes(channel) ? "bg-[#8fd3b6] shadow-[3px_3px_0_#17324d]" : "bg-white text-[#51677a] shadow-[2px_2px_0_#17324d]"} disabled:opacity-60`}
                    >
                      {channelLabels[channel]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 안전 구역 추가 */}
              <div className="grid gap-3 lg:grid-cols-[1fr_120px]">
                <label className="text-xs font-black">
                  구역 이름
                  <input
                    value={safeZoneName}
                    onChange={e => setSafeZoneName(e.target.value)}
                    className="mt-2 w-full border-[3px] border-[#17324d] bg-white px-3 py-2 text-sm font-bold outline-none focus:shadow-[3px_3px_0_#8fd3b6]"
                    placeholder="학교, 집, 학원"
                  />
                </label>
                <label className="text-xs font-black">
                  반경(m)
                  <input
                    type="number"
                    min={30}
                    max={5000}
                    value={safeZoneRadius}
                    onChange={e => setSafeZoneRadius(Math.max(30, Math.min(5000, Number(e.target.value) || 300)))}
                    className="mt-2 w-full border-[3px] border-[#17324d] bg-white px-3 py-2 text-sm font-bold outline-none focus:shadow-[3px_3px_0_#8fd3b6]"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={() => {
                    setIsSelectingZoneLocation(!isSelectingZoneLocation);
                    toast(isSelectingZoneLocation ? "지도 클릭 모드 비활성화" : "지도 클릭 모드 활성화", {
                      description: isSelectingZoneLocation ? "안전 구역 선택이 취소되었습니다." : "지도에서 안전 구역으로 설정할 위치를 클릭하세요.",
                    });
                  }}
                  variant={isSelectingZoneLocation ? "default" : "outline"}
                  className={`border-[3px] border-[#17324d] font-black shadow-[4px_4px_0_#17324d] ${isSelectingZoneLocation ? "bg-[#f2a37b] text-[#17324d]" : "bg-[#fff7e7]"} hover:bg-white`}
                >
                  {isSelectingZoneLocation ? "✓ 지도에서 선택 중" : "지도에서 선택"}
                </Button>
                <Button onClick={useCurrentMapCenterForSafeZone} variant="outline" className="border-[3px] border-[#17324d] bg-[#fff7e7] font-black shadow-[4px_4px_0_#17324d] hover:bg-white">
                  지도 중심 좌표 사용
                </Button>
                <Button
                  onClick={() => void createSafeZone()}
                  disabled={!primaryFamilyId || createSafeZoneMutation.isPending}
                  className="border-[3px] border-[#17324d] bg-[#17324d] font-black text-[#fff7e7] shadow-[4px_4px_0_#8fd3b6] hover:bg-[#254462] disabled:opacity-60"
                >
                  안전 구역 저장
                </Button>
              </div>
              <p className="text-xs font-bold text-[#51677a]">선택 좌표: {safeZoneCenter.lat.toFixed(5)}, {safeZoneCenter.lng.toFixed(5)}</p>

              {/* 등록된 안전 구역 목록 */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black">등록된 안전 구역</p>
                  <span className="border-[2px] border-[#17324d] bg-[#8fd3b6] px-2 py-1 text-xs font-black">{safeZones.filter(z => z.isActive).length}개</span>
                </div>
                {safeZonesQuery.isLoading ? (
                  <p className="text-xs font-bold text-[#51677a]">안전 구역을 불러오는 중입니다.</p>
                ) : safeZones.filter(z => z.isActive).length === 0 ? (
                  <p className="border-[2px] border-[#17324d] bg-[#fffdf5] p-3 text-xs font-bold text-[#51677a]">아직 저장된 안전 구역이 없습니다.</p>
                ) : (
                  safeZones.filter(z => z.isActive).slice(0, 4).map(zone => (
                    <div key={zone.id} className="grid gap-2 border-[2px] border-[#17324d] bg-[#fffdf5] p-3 text-xs font-bold sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <p className="font-black">{zone.name} · 반경 {zone.radiusMeters}m</p>
                        <p className="mt-1 text-[#51677a]">좌표 {zone.centerLatitude.toFixed(4)}, {zone.centerLongitude.toFixed(4)} · {zone.alertsEnabled ? "알림 켜짐" : "알림 꺼짐"}</p>
                      </div>
                      <Button
                        onClick={() => {
                          if (confirm(`'${zone.name}' 구역을 삭제하시겠습니까?`)) {
                            void deleteSafeZoneMutation.mutateAsync({ id: zone.id });
                          }
                        }}
                        disabled={deleteSafeZoneMutation.isPending}
                        variant="outline"
                        className="h-9 w-9 border-[2px] border-[#17324d] bg-[#fff7e7] p-0 hover:bg-[#ffe8cd]"
                      >
                        <Trash2 className="h-4 w-4 text-[#d9534f]" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* 최근 이탈·진입 기록 */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black">최근 이탈·진입 기록</p>
                  <span className="border-[2px] border-[#17324d] bg-[#f8d9a8] px-2 py-1 text-xs font-black">{recentLocationAlerts.length}건</span>
                </div>
                {locationAlertsQuery.isLoading ? (
                  <p className="text-xs font-bold text-[#51677a]">최근 알림을 불러오는 중입니다.</p>
                ) : recentLocationAlerts.length === 0 ? (
                  <p className="border-[2px] border-[#17324d] bg-[#fffdf5] p-3 text-xs font-bold text-[#51677a]">아직 위치 이탈 기록이 없습니다.</p>
                ) : (
                  recentLocationAlerts.map(alert => (
                    <div key={alert.id} className="grid gap-2 border-[2px] border-[#17324d] bg-[#fffdf5] p-3 text-xs font-bold sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <p className="font-black">{alert.message}</p>
                        <p className="mt-1 text-[#51677a]">거리 {Math.round(alert.distanceMeters)}m · {new Date(alert.createdAt).toLocaleString()} · {alert.acknowledgedAt ? "확인 완료" : "미확인"}</p>
                      </div>
                      {!alert.acknowledgedAt && (
                        <Button
                          onClick={() => void acknowledgeLocationAlert(alert.id)}
                          disabled={acknowledgeAlertMutation.isPending}
                          variant="outline"
                          className="h-9 border-[2px] border-[#17324d] bg-[#fff7e7] text-xs font-black hover:bg-white"
                        >
                          확인
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 가족 위치 목록 */}
            <div className="mt-8 space-y-4">
              {storedFamilyLocations.length > 0 ? (
                storedFamilyLocations.map((member, index) => (
                  <div key={member.memberId} className="flex items-center justify-between gap-4 border-[3px] border-[#fff7e7] bg-[#fff7e7] p-4 text-[#17324d] shadow-[5px_5px_0_#8fd3b6]">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#17324d] font-black ${index % 3 === 0 ? "bg-[#8fd3b6]" : index % 3 === 1 ? "bg-[#f2a37b]" : "bg-[#f8d9a8]"}`}>
                        {member.displayName.slice(0, 1)}
                      </span>
                      <div>
                        <p className="font-black">{member.displayName} · {member.role === "child" ? "자녀" : "보호자"}</p>
                        <p className="text-xs font-bold text-[#51677a]">
                          {member.location
                            ? `좌표 ${member.location.latitude.toFixed(4)}, ${member.location.longitude.toFixed(4)} · 정확도 ${Math.round(member.location.accuracy ?? 0)}m`
                            : "승인 대기 또는 공유 일시 중지 상태입니다."}
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
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
