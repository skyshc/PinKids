import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// 페이지 분리 후: 안전 구역/알림 기능은 MapViewPage.tsx로 이동
const mapViewSource = readFileSync(resolve(process.cwd(), "client/src/pages/MapViewPage.tsx"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

describe("MapViewPage geofence UI and tRPC wiring", () => {
  it("안전 구역 조회·생성·수정·삭제 API 절차가 라우터에 노출되어야 함", () => {
    expect(routerSource).toContain("safeZones: router");
    expect(routerSource).toContain("list: protectedProcedure");
    expect(routerSource).toContain("create: protectedProcedure");
    expect(routerSource).toContain("update: protectedProcedure");
    expect(routerSource).toContain("delete: protectedProcedure");
  });

  it("위치보기 화면은 안전 구역 목록, 생성, 비활성화, 알림 설정, 최근 이탈 기록을 tRPC로 연결해야 함", () => {
    expect(mapViewSource).toContain("trpc.safeZones.list.useQuery");
    expect(mapViewSource).toContain("trpc.safeZones.create.useMutation");
    expect(mapViewSource).toContain("trpc.safeZones.delete.useMutation");
    expect(mapViewSource).toContain("trpc.alertSettings.get.useQuery");
    expect(mapViewSource).toContain("trpc.alertSettings.set.useMutation");
    expect(mapViewSource).toContain("trpc.locationAlerts.list.useQuery");
    expect(mapViewSource).toContain("trpc.locationAlerts.acknowledge.useMutation");
  });

  it("위치보기 화면은 지도 원형 표시와 사용자 알림 토글 안내 문구를 포함해야 함", () => {
    expect(mapViewSource).toContain("new window.google.maps.Circle");
    expect(mapViewSource).toContain("안전 구역 저장");
    expect(mapViewSource).toContain("알림 ON");
    expect(mapViewSource).toContain("최근 이탈·진입 기록");
  });
});
