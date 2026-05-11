export type LocationPermissionUiState =
  | "idle"
  | "checking"
  | "prompt"
  | "requesting"
  | "granted"
  | "denied"
  | "blocked"
  | "unsupported";

export type BrowserSettingGuide = {
  environment: string;
  steps: string;
};

type PermissionQueryResult = Pick<PermissionStatus, "state">;

type PermissionQuery = (descriptor: { name: PermissionName }) => Promise<PermissionQueryResult>;

export type GeolocationPermissionNavigator = {
  permissions?: {
    query?: PermissionQuery;
  };
  geolocation?: Geolocation;
};

export const LOCATION_PERMISSION_REQUEST_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 7000,
  maximumAge: 60000,
};

export const LOCATION_PERMISSION_EXPLANATIONS = [
  "위치는 가족 지도에서 현재 위치와 안전 반경 진입 여부를 보여주는 데 사용됩니다.",
  "권한을 거절해도 가족 그룹 생성과 데모 지도 둘러보기는 계속할 수 있습니다.",
  "브라우저 또는 서비스 설정에서 언제든 위치 공유를 다시 끄거나 나중에 켤 수 있습니다.",
];

export const BROWSER_SETTING_GUIDES: BrowserSettingGuide[] = [
  {
    environment: "Chrome 데스크톱",
    steps: "주소창 왼쪽 사이트 정보 아이콘을 누른 뒤 위치 권한을 ‘허용’으로 변경하고 페이지를 새로고침하세요.",
  },
  {
    environment: "Chrome Android",
    steps: "주소창 왼쪽 사이트 정보 아이콘을 누르고 권한 메뉴에서 위치를 ‘허용’으로 바꾼 뒤 권한 다시 확인을 눌러주세요.",
  },
  {
    environment: "Safari iPhone",
    steps: "설정 앱에서 Safari 또는 사용 중인 브라우저의 위치 접근을 허용한 뒤 PinKids 페이지를 다시 열어주세요.",
  },
];

export function mapBrowserPermissionState(state: PermissionState | "unsupported"): LocationPermissionUiState {
  if (state === "granted") return "granted";
  if (state === "prompt") return "prompt";
  if (state === "denied") return "blocked";

  return "idle";
}

export function getLocationPermissionStatusLabel(status: LocationPermissionUiState): string {
  const labels: Record<LocationPermissionUiState, string> = {
    idle: "아직 선택 전",
    checking: "권한 상태 확인 중",
    prompt: "권한 요청 가능",
    requesting: "브라우저 권한 요청 중",
    granted: "동의됨",
    denied: "나중에 설정",
    blocked: "브라우저에서 차단됨",
    unsupported: "지원되지 않음",
  };

  return labels[status];
}

export function getLocationPermissionPanelCopy(status: LocationPermissionUiState) {
  if (status === "granted") {
    return {
      title: "위치 권한이 켜졌어요.",
      description: "이제 가족 지도에서 현재 위치와 안전 반경 상태를 확인할 수 있습니다.",
    };
  }

  if (status === "denied") {
    return {
      title: "괜찮아요. 위치 없이도 계속할 수 있어요.",
      description: "실시간 위치 알림은 나중에 권한을 허용한 뒤 사용할 수 있습니다.",
    };
  }

  if (status === "blocked") {
    return {
      title: "브라우저 설정에서 위치 권한을 다시 켜야 합니다.",
      description: "이미 차단된 권한은 브라우저 설정을 바꾼 뒤 다시 확인해야 합니다.",
    };
  }

  if (status === "unsupported") {
    return {
      title: "이 브라우저에서는 위치 권한 요청을 사용할 수 없습니다.",
      description: "위치 없이 가족 그룹 생성과 데모 탐색을 계속할 수 있습니다.",
    };
  }

  if (status === "requesting") {
    return {
      title: "브라우저 상단의 위치 권한 요청을 확인해주세요.",
      description: "권한 창에서 허용을 누르면 PinKids가 현재 위치를 확인할 수 있습니다.",
    };
  }

  return {
    title: "위치 권한을 요청하기 전에 먼저 안내드려요.",
    description: "PinKids는 위치가 왜 필요한지 설명한 뒤 사용자가 직접 요청 버튼을 누를 때만 브라우저 권한 창을 띄웁니다.",
  };
}

export async function queryGeolocationPermission(
  permissionNavigator: GeolocationPermissionNavigator = navigator,
): Promise<PermissionState | "unsupported"> {
  if (!permissionNavigator.permissions?.query) return "unsupported";

  try {
    const status = await permissionNavigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state;
  } catch {
    return "unsupported";
  }
}
