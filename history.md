# 자녀 위치 찾기 서비스 앱 - 개발 이력

## 프로젝트 개요
- **프로젝트명**: 자녀 위치 찾기 서비스 (PinKids)
- **기술 스택**: React 19 + Tailwind 4 + Express 4 + tRPC 11 + MySQL
- **인증**: Manus OAuth (카카오, 구글 소셜 로그인)
- **배포**: Manus WebDev (childlocate-fuw72oke.manus.space)

---

## Phase 1: 기초 기능 완성 ✅

### 1-1. 인증 및 사용자 관리
- [x] Manus OAuth 기반 사용자 인증 구현
- [x] 카카오톡, 구글 소셜 로그인 버튼 추가
- [x] 기존 이름 입력 방식과 소셜 로그인 혼용 UX
- [x] OAuth callback state 파싱 및 redirect 흐름 구현
- [x] 구글 로그인 403 Forbidden 오류 진단 및 수정

### 1-2. 위치 공유 동의 프로세스
- [x] 브라우저 Geolocation API 위치 권한 요청
- [x] 권한 상태별 UX (허용/거부/미지원 브라우저)
- [x] 보호자·자녀 역할별 위치 공유 승인 흐름
- [x] 위치 정보 철회, 일시 중지, 보관 기간 안내
- [x] 위치 기록 삭제 기능

### 1-3. 실시간 위치 추적
- [x] 클라이언트: 5분마다 현재 위치 감지 및 업로드
- [x] 서버: 위치 좌표 저장 및 최신 위치 조회 API
- [x] 지도에 실시간 마커 표시 및 자동 갱신
- [x] 위치 변경 감지 (Haversine 공식, 10m 임계값)
- [x] Timestamp 컬럼 추가 (locationPoints, locationConsents, familyMembers)

### 1-4. 데이터베이스 스키마
- [x] users, families, familyMembers 테이블
- [x] locationConsents, locationPoints 테이블
- [x] 역할별(guardian/child) 및 accepted 상태 기반 권한 검증

### 1-5. 테스트 및 검증
- [x] Geolocation 테스트 9개 추가 (성공/거부/미지원 브라우저)
- [x] 위치 변경 감지 테스트 추가
- [x] 민감 API 권한 검증 테스트 (role/accepted 상태)
- [x] 전체 테스트 31개 통과

---

## Phase 2: 새로운 기능

### 2-1. 가족 초대 기능 ✅ 완료
- [x] 초대 링크 생성 및 공유 기능
- [x] 초대 링크 토큰 생성 및 검증 (Crypto API)
- [x] 초대 수락 시 가족 구성원 자동 추가
- [x] 초대 링크 만료 시간 설정 (24시간 기본값)
- [x] 초대 링크 취소 기능
- [x] QR 코드 생성 및 표시
- [x] 초대 수락/거절 UI 컴포넌트
- [x] 초대 상태 관리 UI (pending/accepted/declined)
- [x] 초대 링크 단위 테스트 6개 추가
- [x] 트랜잭션 처리 및 중복 가입 방지

**데이터베이스 마이그레이션**: inviteLinks 테이블 추가
**테스트**: 6개 테스트 케이스 (생성, 조회, 만료, 수락, 중복 방지, 취소)

---

### 2-2. 위치 이탈 알림 ✅ 우선 4가지 완료

#### 우선 4가지 핵심 기능
1. **안전 구역 설정 기능**
   - [x] 지도 중심을 기준으로 반경 설정
   - [x] 구역 이름, 반경(m) 입력 UI
   - [x] 안전 구역 저장, 조회, 삭제 API
   - [x] 지도에 원형 표시 (Google Maps Circle)

2. **구역 벗어나면 푸시 알림 발송**
   - [x] Haversine 공식으로 거리 계산
   - [x] 진입/이탈 이벤트 판정 (previousDistance vs currentDistance)
   - [x] 이탈 이벤트 중복 기록 방지
   - [x] notifyOwner를 통한 보호자 알림 발송

3. **이탈 히스토리 기록 및 조회**
   - [x] locationAlerts 테이블에 이탈 이벤트 기록
   - [x] 이탈 좌표, 거리, 타임스탬프 저장
   - [x] 최근 이탈 기록 조회 API (limit 8)
   - [x] 홈 화면에 최근 이탈 기록 카드 표시

4. **알림 설정 (ON/OFF) 토글**
   - [x] familyAlertSettings 테이블에 geofenceAlertsEnabled 필드
   - [x] 알림 ON/OFF 토글 버튼 UI
   - [x] 알림 비활성화 시 이탈 이벤트 무시

**데이터베이스 마이그레이션**: 
- safeZones 테이블 (id, familyId, name, centerLatitude, centerLongitude, radiusMeters, isActive, alertsEnabled)
- locationAlerts 테이블 (id, familyId, safeZoneId, memberUserId, locationPointId, eventType, latitude, longitude, distanceMeters, message, createdAt, acknowledgedAt)
- familyAlertSettings 테이블 (id, familyId, geofenceAlertsEnabled)

**테스트**: 
- geofence.test.ts: 거리 계산, 진입/이탈 판정, 중복 기록 방지 (6개 테스트)
- location.tracking.test.ts: 위치 업데이트 시 이탈 판정 연동 (13개 테스트)
- Home.geofence-ui.test.ts: UI 연동 계약 테스트 (3개 테스트)

#### 알림 수신 방식 선택 (진행 중)
- [x] 데이터 모델 확장 (alertChannels 필드 추가)
- [x] 데이터베이스 마이그레이션 적용
- [x] tRPC alertSettings.setChannels API 구현
- [x] Home.tsx 알림 채널 다중 선택 UI 추가 (푸시/이메일/SMS)
- [x] Mutation 성공 시 쿼리 invalidate 추가
- [ ] 알림 발송 로직에 선택 채널 반영 (이메일/SMS 백엔드 연동 필요)
- [ ] UI 및 서버 로직 테스트 추가

**UI 구현**:
- 안전 구역 설정 패널: 구역 이름, 반경 입력, 지도 중심 좌표 사용 버튼
- 알림 설정 패널: ON/OFF 토글, 채널 선택 버튼 (푸시/이메일/SMS)
- 등록된 안전 구역 목록: 활성/비활성 상태, 삭제 버튼
- 최근 이탈 기록: 구역명, 시간, 거리 표시

**서버 API**:
- `safeZones.create` - 안전 구역 생성
- `safeZones.list` - 가족의 안전 구역 조회
- `safeZones.delete` - 안전 구역 삭제
- `alertSettings.get` - 알림 설정 조회
- `alertSettings.toggle` - 알림 ON/OFF 토글
- `alertSettings.setChannels` - 알림 채널 선택
- `locationAlerts.list` - 최근 이탈 기록 조회
- `locationAlerts.acknowledge` - 이탈 알림 확인 처리

---

### 2-3. 위치 히스토리 (미구현)
- [ ] 시간대별 이동 경로 조회
- [ ] 경로 재생 기능 (시간 배속 조절)
- [ ] 특정 시간대 위치 검색
- [ ] 날짜 범위 필터링
- [ ] 히스토리 내보내기 (CSV/PDF)

---

## 주요 기술 결정사항

### 1. 거리 계산
- **Haversine 공식** 사용: 지구 표면의 두 점 사이 거리 계산
- 임계값: 10m (위치 변경 감지), 반경 설정 (30m ~ 5000m)

### 2. 이탈 판정 로직
```
previousDistance > radiusMeters && currentDistance <= radiusMeters → "enter"
previousDistance <= radiusMeters && currentDistance > radiusMeters → "exit"
```

### 3. 중복 기록 방지
- 같은 구역, 같은 사용자, 같은 이벤트 타입에 대해 1시간 내 중복 기록 무시
- `lastAlertTime` 필드로 마지막 알림 시간 추적

### 4. 권한 검증
- guardian 역할: 모든 위치 조회, 초대 생성, 알림 설정 변경 가능
- child 역할: 자신의 위치만 공유, 초대 수락만 가능
- accepted 상태 필수: 거부/미승인 상태는 위치 조회 불가

### 5. 알림 채널
- **푸시**: notifyOwner를 통한 Manus 내장 알림 (구현 완료)
- **이메일**: 백엔드 연동 필요 (SendGrid, AWS SES 등)
- **SMS**: 백엔드 연동 필요 (Twilio, AWS SNS 등)

---

## 빌드 및 테스트 상태

### 최신 테스트 결과
```
Test Files  9 passed (9)
      Tests  49 passed (49)
   Start at  02:58:22
   Duration  46.06s
```

### 테스트 파일 목록
1. client/src/lib/geolocation.test.ts (9개)
2. server/socialLoginUrl.test.ts (3개)
3. server/location.consent.test.ts (7개)
4. server/oauth.callback.test.ts (3개)
5. client/src/pages/Home.geofence-ui.test.ts (3개)
6. server/geofence.test.ts (6개)
7. server/locationPermission.test.ts (4개)
8. server/auth.logout.test.ts (1개)
9. server/location.tracking.test.ts (13개)

### 빌드 상태
```
✓ Vite build: 802.89 kB (gzip: 224.56 kB)
✓ esbuild: 70.1kb
✓ No TypeScript errors
```

---

## GitHub 커밋 이력

| 커밋 | 메시지 | 날짜 |
|------|--------|------|
| 13dd4e8 | Phase 2-2: 안전 구역·이탈 알림·채널 선택 기능 완성 (우선 4가지 + 채널 UI) | 2026-05-12 |
| ... | (이전 커밋들) | ... |

---

## 다음 단계

### 즉시 필요 사항
1. **알림 발송 로직 채널 반영**
   - evaluateGeofenceForLocationPoint에서 alertChannels 조회
   - 선택된 채널에만 알림 발송
   - 이메일/SMS는 향후 백엔드 연동

2. **알림 채널 선택 테스트**
   - UI 연동 테스트 추가
   - 서버 로직 테스트 추가

### 중기 목표 (Phase 2-3)
1. **위치 히스토리 기능**
   - 시간대별 이동 경로 조회
   - 경로 재생 기능 (시간 배속 조절)
   - 날짜 범위 필터링

### 장기 목표 (Phase 3-4)
1. **UX 개선**
   - 가족 구성원 관리 화면
   - 모바일 최적화
   - 성능 최적화

2. **고급 기능**
   - WebSocket 실시간 위치 공유
   - AI 기반 이상 탐지
   - 다국어 지원
   - 다크 모드

---

## 주요 파일 구조

```
child-location-share/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx (메인 페이지, 안전 구역 UI)
│   │   │   ├── InviteAccept.tsx (초대 수락 페이지)
│   │   ├── components/
│   │   │   ├── Map.tsx (Google Maps 통합)
│   │   │   ├── DashboardLayout.tsx
│   │   ├── lib/
│   │   │   ├── geolocation.ts (위치 감지 로직)
│   │   │   ├── trpc.ts (tRPC 클라이언트)
│   ├── index.html
│   ├── package.json
├── server/
│   ├── db.ts (데이터베이스 헬퍼)
│   │   ├── updateLocationPoint (위치 업데이트)
│   │   ├── evaluateGeofenceForLocationPoint (이탈 판정)
│   │   ├── createSafeZone (안전 구역 생성)
│   │   ├── getSafeZones (안전 구역 조회)
│   │   ├── getAlertSettings (알림 설정 조회)
│   ├── routers.ts (tRPC 라우터)
│   │   ├── safeZones.* (안전 구역 API)
│   │   ├── alertSettings.* (알림 설정 API)
│   │   ├── locationAlerts.* (이탈 기록 API)
├── drizzle/
│   ├── schema.ts (데이터베이스 스키마)
│   │   ├── safeZones
│   │   ├── locationAlerts
│   │   ├── familyAlertSettings
├── todo.md (작업 목록)
├── history.md (이 파일)
```

---

## 개발 환경 정보

- **Node.js**: 22.13.0
- **pnpm**: 9.x
- **TypeScript**: 5.9.3
- **React**: 19.x
- **Tailwind CSS**: 4.x
- **tRPC**: 11.x
- **Express**: 4.x
- **MySQL**: TiDB (Manus 제공)
- **Vitest**: 2.1.9

---

**마지막 업데이트**: 2026-05-12 06:59 UTC+9
