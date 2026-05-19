# 자녀 위치 찾기 서비스 - 개발 이력 (Development History)

**프로젝트명:** 자녀 위치 찾기 서비스 (Child Location Share / PinKids)  
**시작 날짜:** 2026-05-12  
**최종 업데이트:** 2026-05-14

---

## 📋 작업 요약

본 문서는 Manus AI 에이전트와의 협업을 통해 진행된 모든 개발 작업, 로직 수정, 버그 수정, 기능 구현 내역을 기록합니다.

---

## 🔧 주요 작업 이력

### 1단계: 프로젝트 초기화 및 기본 설정

**작업 내용:**
- Manus 웹개발 플랫폼에서 React 19 + Tailwind 4 + Express 4 + tRPC 11 스택으로 프로젝트 생성
- 데이터베이스 (MySQL/TiDB) 자동 연결
- Manus OAuth 인증 시스템 통합
- 기본 프로젝트 구조 설정

**생성된 파일:**
- `client/src/App.tsx` - 메인 라우팅 및 레이아웃
- `client/src/pages/Home.tsx` - 홈페이지 (온보딩 UI 포함)
- `server/routers.ts` - tRPC 프로시저 정의
- `server/db.ts` - 데이터베이스 헬퍼 함수
- `drizzle/schema.ts` - 데이터베이스 스키마

**기술 스택:**
- Frontend: React 19, Tailwind CSS 4, shadcn/ui
- Backend: Express 4, tRPC 11, Drizzle ORM
- Database: MySQL/TiDB
- Auth: Manus OAuth

---

### 2단계: 온보딩 UI 구현

**작업 내용:**
- 온보딩 4단계 UI 구현
  - 1단계: 보호자 로그인 (이름 입력 / 소셜 로그인)
  - 2단계: 가족 역할 선택 (부모/보호자/자녀)
  - 3단계: 위치 정보 동의 (Geolocation 권한 요청)
  - 4단계: 준비 완료 안내

**UI 디자인:**
- 네오-브루탈리즘 스타일 (굵은 경계, 비대칭 레이아웃)
- 크림색 배경 (#fff7e7), 네이비 텍스트 (#17324d)
- 민트 안전 신호 (#8fd3b6), 살구색 강조 (#f2a37b)
- 모달 기반 온보딩 플로우

**구현 파일:**
- `client/src/pages/Home.tsx` - 온보딩 모달 및 상태 관리
- `client/src/index.css` - 글로벌 스타일 및 디자인 토큰

---

### 3단계: 소셜 로그인 통합

**작업 내용:**
- Manus OAuth 기반 카카오톡, 구글 소셜 로그인 구현
- 소셜 로그인 URL 생성 로직 (provider 힌트 전달)
- OAuth callback state 파싱 및 redirect 흐름
- 구글 로그인 403 Forbidden 오류 진단 및 수정

**구현 상세:**
- `buildSocialLoginUrl()` 함수로 canonical OAuth URL 생성
- provider 쿼리 제거 후 OAuth 포털로 이동
- callback state에 origin 정보 인코딩
- 신규 사용자 로그인 시 기본 가족 자동 생성

**구현 파일:**
- `client/src/const.ts` - getLoginUrl, buildSocialLoginUrl 함수
- `server/_core/oauth.ts` - OAuth 콜백 처리
- `client/src/pages/Home.tsx` - 소셜 로그인 버튼

**테스트:**
- `server/socialLoginUrl.test.ts` (3개 테스트)
- `server/oauth.callback.test.ts` (3개 테스트)

---

### 4단계: 구글 지도 통합

**작업 내용:**
- Google Maps API를 Manus 프록시를 통해 통합
- 지도 마커 표시 (AdvancedMarkerElement)
- 안전 구역 표시 (Circle)
- 이동 경로 표시 (Polyline)
- 데모 데이터 기반 지도 렌더링

**구현 기능:**
- 학교, 학원, 집 위치 마커 표시
- 안전 반경 원형 표시
- 이동 경로 선 표시
- 지도 자동 줌/팬 (fitBounds)

**구현 파일:**
- `client/src/components/Map.tsx` - 지도 컴포넌트
- `client/src/pages/Home.tsx` - 지도 초기화 및 마커 렌더링

---

### 5단계: 위치 공유 API 구현

**작업 내용:**
- tRPC 프로시저 구현
  - `location.updateCurrent` - 현재 위치 업로드
  - `location.getFamilyLocations` - 가족 위치 조회
  - `consent.getStatus` - 위치 동의 상태 조회
  - `consent.grant` - 위치 동의 부여
  - `consent.revoke` - 위치 동의 철회

**데이터베이스 테이블:**
- `users` - 사용자 정보
- `families` - 가족 그룹
- `familyMembers` - 가족 구성원
- `locationConsents` - 위치 공유 동의
- `locationPoints` - 위치 기록

**구현 파일:**
- `server/routers.ts` - tRPC 프로시저 정의
- `server/db.ts` - 데이터베이스 쿼리 헬퍼

---

### 6단계: 위치 공유 실시간 추적 기능 구현

**작업 내용:**
- 로그인 후 자동 위치 감지 및 5분마다 업로드
- Geolocation API를 통한 현재 위치 감지
- 신규 사용자 로그인 시 기본 가족 자동 생성
- 위치 업로드 실패 시 에러 핸들링

**구현 상세:**

#### 6-1. 클라이언트 측 위치 추적 (Home.tsx)
- 로그인 후 즉시 위치 감지
- 5분마다 반복 위치 업로드
- 위치 권한 거부 시 에러 핸들링

#### 6-2. 서버 측 기본 가족 자동 생성 (auth.me)
- 신규 사용자 로그인 시 기본 가족 자동 생성
- 기존 사용자는 기본 가족 유지

#### 6-3. 위치 업데이트 API (location.updateCurrent)
- 위치 데이터 저장
- 위치 변경 감지 (Haversine 공식, 10m 임계값)
- 쿼리 invalidate를 통한 자동 갱신

**구현 파일:**
- `client/src/pages/Home.tsx` - 위치 추적 useEffect
- `server/routers.ts` - auth.me 및 location.updateCurrent
- `server/db.ts` - ensurePrimaryFamily 함수

**테스트 파일:**
- `server/location.tracking.test.ts` - 위치 추적 기능 단위 테스트 (13개 테스트)
- `client/src/lib/geolocation.test.ts` - Geolocation API 테스트 (9개 테스트)

---

### 7단계: 지도에 실시간 위치 표시

**작업 내용:**
- 업로드된 위치 데이터를 지도에 실시간 마커로 표시
- 5분마다 위치 업데이트 시 지도 마커 자동 갱신
- 가족 구성원의 위치를 모두 표시

**구현 상세:**
- 위치 데이터 조회 (useQuery)
- 지도 마커 업데이트 (useEffect)
- 기존 마커 제거 후 새로운 마커 추가
- 파란 깃발 마커 스타일 (CSS 회전 변환)

**구현 파일:**
- `client/src/pages/Home.tsx` - 지도 마커 업데이트 로직

---

### 8단계: 버그 수정 및 최적화

#### 8-1. 403 Forbidden 오류 해결 (2026-05-12)

**문제:**
- 구글 로그인 후 `location.getFamilyLocations` API 호출 시 403 Forbidden 에러 발생
- 신규 사용자가 아직 가족 그룹에 속하지 않아서 권한 오류 발생

**해결:**
- `location.getFamilyLocations` 프로시저 수정
- 가족 미소속 신규 사용자는 빈 배열 반환 (403 대신)
- 가족 내 비권한 사용자는 여전히 403 반환 (보안 유지)

**수정 파일:**
- `server/routers.ts` - getFamilyLocations 에러 핸들링 개선

**테스트:**
- 18개 Vitest 모두 통과

#### 8-2. 위치 변경 감지 (10미터 임계값)

**구현 위치:** `client/src/pages/Home.tsx`

**로직:**
- Haversine 공식으로 두 좌표 사이의 거리 계산
- 이전 위치(`lastLocationRef`)와 현재 위치 비교
- 거리 < 10미터이면 DB 저장 생략, 콘솔 로그 기록
- 거리 >= 10미터이면 `updateLocationMutation` 호출

**테스트:**
- `server/location.tracking.test.ts`에 테스트 케이스 추가 (5개 테스트 모두 통과)
- 같은 좌표 업데이트 시 새 레코드 생성 및 이전 레코드 비활성화 검증

#### 8-3. Timestamp 컬럼 추가

**변경 테이블:**
- `familyMembers`: `date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL`
- `locationConsents`: `date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL`
- `locationPoints`: `date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL`

**구현 방식:**
- 스키마 정의: `drizzle/schema.ts`
- DB 적용: `webdev_execute_sql`로 `ALTER TABLE` 명령 실행
- 기존 데이터 삭제 후 진행 (사용자 승인)

#### 8-4. 지도 높이 조정

**변경 사항:**
- `MapView` 높이: `h-[560px]` → `h-[700px]`
- 파일: `client/src/pages/Home.tsx`

**결과:**
- 지도 표시 영역 25% 증가
- 모바일/태블릿에서 responsive 클래스 미적용 (고정값 사용)

---

### 9단계: 가족 초대 기능 구현

**작업 내용:**
- 초대 링크 생성 및 공유 기능
- 초대 링크 토큰 생성 및 검증 (Crypto API)
- 초대 수락 시 가족 구성원 자동 추가
- 초대 링크 만료 시간 설정 (24시간 기본값)
- 초대 링크 취소 기능
- QR 코드 생성 및 표시
- 초대 수락/거절 UI 컴포넌트

**데이터베이스 마이그레이션:**
- `inviteLinks` 테이블 추가
  - id, familyId, token, createdByUserId, createdAt, expiresAt, usedAt, usedByUserId

**구현 파일:**
- `server/db.ts` - 초대 링크 헬퍼 함수
- `server/routers.ts` - inviteLinks tRPC API
- `client/src/pages/Home.tsx` - 초대 링크 UI
- `client/src/pages/InviteAccept.tsx` - 초대 수락 페이지

**테스트:**
- `server/inviteLinks.test.ts` (6개 테스트)
  - 초대 링크 생성, 조회, 만료, 수락, 중복 방지, 취소

**기술 세부사항:**
- `acceptInviteLink` 트랜잭션 처리
- 중복 가족 구성원 방지
- 경쟁 조건 방어 (동시 수락)

---

### 10단계: 위치 이탈 알림 기능 구현

**작업 내용:**
- 안전 구역 설정 기능 (반경 설정)
- 구역 벗어나면 푸시 알림 발송
- 이탈 히스토리 기록 및 조회
- 알림 설정 (ON/OFF) 토글
- 알림 수신 방식 선택 (푸시/이메일/SMS)

**데이터베이스 마이그레이션:**
- `safeZones` 테이블
  - id, familyId, name, centerLatitude, centerLongitude, radiusMeters, isActive, alertsEnabled
- `locationAlerts` 테이블
  - id, familyId, safeZoneId, memberUserId, locationPointId, eventType, latitude, longitude, distanceMeters, message, createdAt, acknowledgedAt
- `familyAlertSettings` 테이블
  - id, familyId, geofenceAlertsEnabled, alertChannels

**구현 파일:**
- `server/db.ts` - 안전 구역 및 이탈 알림 헬퍼 함수
- `server/routers.ts` - safeZones, alertSettings, locationAlerts tRPC API
- `client/src/pages/Home.tsx` - 안전 구역 설정 UI, 알림 설정 UI

**테스트:**
- `server/geofence.test.ts` (6개 테스트)
  - 거리 계산, 진입/이탈 판정, 중복 기록 방지
- `client/src/pages/Home.geofence-ui.test.ts` (3개 테스트)
  - UI 연동 계약 테스트

**주요 기술:**
- Haversine 공식으로 거리 계산
- 진입/이탈 이벤트 판정 로직
- 중복 기록 방지 (1시간 내 같은 이벤트 무시)
- notifyOwner를 통한 보호자 알림 발송

---

### 11단계: 지도 시각화 개선 (2026-05-14)

**작업 내용:**
- 안전 구역을 구글 지도에 원형으로 표시
- 현재 위치를 파란 깃발 마커로 표시
- 안전 구역 클릭 시 정보 창(InfoWindow) 표시
- 마커 클릭 시 위치 정보 팝업 표시 (진행 중)

**구현 상세:**

#### 11-1. 안전 구역 원형 표시
- google.maps.Circle API 사용
- 반투명 채우기 (fillOpacity: 0.15)
- 활성/비활성 상태에 따라 색상 변경 (활성: 민트, 비활성: 회색)
- 안전 구역 이름 라벨 표시

#### 11-2. 파란 깃발 마커
- AdvancedMarkerElement 사용
- 파란 깃발 모양 CSS (border-radius: 50% 50% 50% 0, rotate: -45deg)
- 사용자 이름 초성 표시
- 마지막 위치 시간 정보 포함

#### 11-3. 안전 구역 InfoWindow
- 원형 클릭 이벤트 리스너 추가
- InfoWindow로 구역 정보 표시
  - 구역 이름 (굵은 글씨, 진한 네이비색)
  - 반경 정보 (예: "반경: 500m")
  - 위치 좌표 (위도/경도, 4자리 소수점)
- 한 번에 하나의 InfoWindow만 열기
- 마우스 오버 시 커서 변경 (pointer)

**구현 파일:**
- `client/src/pages/Home.tsx` - handleMapReady 함수에 안전 구역 렌더링 로직

**테스트:**
- `client/src/pages/Home.geofence-ui.test.ts` (3개 테스트)

**기술 세부사항:**
- google.maps.InfoWindow API 사용
- HTML 스타일 인라인으로 정보 창 콘텐츠 구성
- 구역별 색상(활성/비활성)에 맞춰 InfoWindow 스타일 적용

---

## 🗄️ 데이터베이스 스키마

### users 테이블
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### families 테이블
```sql
CREATE TABLE families (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  createdByUserId INT NOT NULL,
  createdAt BIGINT NOT NULL,
  updatedAt BIGINT NOT NULL
);
```

### familyMembers 테이블
```sql
CREATE TABLE familyMembers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  familyId INT NOT NULL,
  userId INT,
  displayName VARCHAR(120) NOT NULL,
  role ENUM('guardian', 'child') NOT NULL,
  inviteStatus ENUM('pending', 'accepted', 'declined', 'revoked') DEFAULT 'pending',
  canViewLocation BOOLEAN DEFAULT FALSE,
  canShareLocation BOOLEAN DEFAULT FALSE,
  invitedAt BIGINT NOT NULL,
  acceptedAt BIGINT,
  revokedAt BIGINT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### locationConsents 테이블
```sql
CREATE TABLE locationConsents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  familyId INT,
  consentVersion VARCHAR(32) NOT NULL,
  status ENUM('granted', 'revoked') DEFAULT 'granted',
  grantedAt BIGINT NOT NULL,
  revokedAt BIGINT,
  permissionState VARCHAR(32) NOT NULL,
  ipAddress VARCHAR(96),
  userAgent TEXT,
  consentText TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### locationPoints 테이블
```sql
CREATE TABLE locationPoints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  familyId INT,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  accuracy DOUBLE,
  recordedAt BIGINT NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  source VARCHAR(32) DEFAULT 'browser',
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### inviteLinks 테이블
```sql
CREATE TABLE inviteLinks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  familyId INT NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  createdByUserId INT NOT NULL,
  createdAt BIGINT NOT NULL,
  expiresAt BIGINT NOT NULL,
  usedAt BIGINT,
  usedByUserId INT
);
```

### safeZones 테이블
```sql
CREATE TABLE safeZones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  familyId INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  centerLatitude DOUBLE NOT NULL,
  centerLongitude DOUBLE NOT NULL,
  radiusMeters INT NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  alertsEnabled BOOLEAN DEFAULT TRUE
);
```

### locationAlerts 테이블
```sql
CREATE TABLE locationAlerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  familyId INT NOT NULL,
  safeZoneId INT NOT NULL,
  memberUserId INT NOT NULL,
  locationPointId INT,
  eventType VARCHAR(32) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  distanceMeters INT NOT NULL,
  message TEXT,
  createdAt BIGINT NOT NULL,
  acknowledgedAt BIGINT
);
```

### familyAlertSettings 테이블
```sql
CREATE TABLE familyAlertSettings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  familyId INT NOT NULL UNIQUE,
  geofenceAlertsEnabled BOOLEAN DEFAULT TRUE,
  alertChannels VARCHAR(255) DEFAULT 'push'
);
```

---

## 🔌 API 엔드포인트 (tRPC)

### 인증 (auth)
- `auth.me` - 현재 사용자 정보 조회 (신규 사용자 기본 가족 자동 생성)
- `auth.logout` - 로그아웃

### 위치 (location)
- `location.updateCurrent` - 현재 위치 업로드
- `location.getFamilyLocations` - 가족 위치 조회
- `location.pauseSharing` - 위치 공유 일시 중지
- `location.deleteHistory` - 위치 기록 삭제

### 동의 (consent)
- `consent.getStatus` - 위치 동의 상태 조회
- `consent.grant` - 위치 동의 부여
- `consent.revoke` - 위치 동의 철회

### 권한 (permission)
- `permission.requestLocationAccess` - 위치 접근 권한 요청

### 초대 링크 (inviteLinks)
- `inviteLinks.create` - 초대 링크 생성
- `inviteLinks.get` - 초대 링크 조회
- `inviteLinks.accept` - 초대 수락
- `inviteLinks.revoke` - 초대 취소

### 안전 구역 (safeZones)
- `safeZones.create` - 안전 구역 생성
- `safeZones.list` - 가족의 안전 구역 조회
- `safeZones.delete` - 안전 구역 삭제

### 알림 설정 (alertSettings)
- `alertSettings.get` - 알림 설정 조회
- `alertSettings.toggle` - 알림 ON/OFF 토글
- `alertSettings.setChannels` - 알림 채널 선택

### 이탈 기록 (locationAlerts)
- `locationAlerts.list` - 최근 이탈 기록 조회
- `locationAlerts.acknowledge` - 이탈 알림 확인 처리

---

## 📁 주요 파일 구조

```
child-location-share/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx (메인 페이지, 온보딩, 지도, 위치 추적, 안전 구역)
│   │   │   ├── InviteAccept.tsx (초대 수락 페이지)
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── Map.tsx (Google Maps 통합)
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── AIChatBox.tsx
│   │   ├── lib/
│   │   │   ├── geolocation.ts (위치 감지 로직)
│   │   │   ├── trpc.ts (tRPC 클라이언트)
│   │   ├── App.tsx (라우팅)
│   │   ├── main.tsx (프로바이더)
│   │   ├── index.css (글로벌 스타일)
│   │   └── const.ts (상수)
│   ├── index.html
│   └── package.json
├── server/
│   ├── routers.ts (tRPC 프로시저)
│   ├── db.ts (데이터베이스 헬퍼)
│   ├── storage.ts (파일 저장소)
│   ├── location.tracking.test.ts (위치 추적 테스트)
│   ├── geofence.test.ts (지오펜싱 테스트)
│   ├── inviteLinks.test.ts (초대 링크 테스트)
│   └── _core/ (프레임워크 코어)
├── drizzle/
│   ├── schema.ts (데이터베이스 스키마)
│   ├── relations.ts
│   └── migrations/
├── shared/
│   ├── types.ts
│   └── const.ts
├── vitest.config.ts
├── vite.config.ts
├── package.json
├── todo.md (작업 목록)
└── HISTORY.md (본 파일)
```

---

## 🎨 UI/UX 디자인

### 색상 팔레트
- **배경:** 크림색 (#fff7e7)
- **텍스트:** 네이비 (#17324d)
- **안전 신호:** 민트 (#8fd3b6)
- **강조:** 살구색 (#f2a37b)
- **경계:** 네이비 3px 굵은 선

### 디자인 스타일
- **스타일:** 네오-브루탈리즘
- **특징:** 굵은 경계, 비대칭 레이아웃, 종이 질감
- **폰트:** 한글 기본 폰트 + 영문 sans-serif

### 주요 UI 컴포넌트
- 온보딩 모달 (4단계)
- 구글 지도 (마커, 원형, 선, InfoWindow)
- 위치 카드 (가족 구성원)
- 타임라인 (이동 경로)
- 안전 구역 설정 패널
- 알림 설정 패널

---

## 🚀 배포 및 호스팅

**플랫폼:** Manus 웹개발 플랫폼
**자동 배포:** 체크포인트 생성 후 UI에서 "Publish" 버튼 클릭
**커스텀 도메인:** 지원 (Management UI에서 설정)
**배포 도메인:** childlocate-fuw72oke.manus.space

---

## 📊 성능 및 최적화

### 빌드 결과
- Frontend 번들 크기: ~806KB (gzip: ~225KB)
- Backend 번들 크기: ~70KB
- 모든 테스트 통과: 49/49 ✅

### 최적화 사항
- tRPC를 통한 타입 안전 API
- React Query를 통한 자동 캐싱
- Drizzle ORM을 통한 타입 안전 쿼리
- Tailwind CSS를 통한 빠른 스타일링
- Haversine 공식을 통한 효율적인 거리 계산

---

## ✅ 체크포인트 이력

| 버전 | 설명 | 날짜 |
|------|------|------|
| `98744e14` | 안전 구역 클릭 시 InfoWindow 정보 창 기능 추가 | 2026-05-14 |
| `24b0307b` | 지도 시각화 개선: 안전 구역 원형 및 파란 깃발 마커 | 2026-05-14 |
| (이전 버전들) | ... | 2026-05-12 |

---

## 🔄 진행 중인 작업 (TODO)

### 우선순위 높음 (Phase 2-2, 지도 시각화)
- [ ] 마커 클릭 시 위치 정보 팝업 표시
- [ ] 안전 구역 진입/이탈 시 시각적 효과 추가 (원형 색상 변경)
- [ ] 지도 시각화 기능 테스트 추가
- [ ] 알림 발송 로직에 선택 채널 반영 (이메일/SMS 백엔드 연동)
- [ ] 알림 채널 선택 UI 및 서버 로직 테스트 추가

### 우선순위 중간 (Phase 2-3, 위치 히스토리)
- [ ] 시간대별 이동 경로 조회
- [ ] 경로 재생 기능 (시간 배속 조절)
- [ ] 특정 시간대 위치 검색
- [ ] 날짜 범위 필터링
- [ ] 히스토리 내보내기 (CSV/PDF)

### 우선순위 낮음 (Phase 3, UX 개선)
- [ ] 가족 구성원 관리 화면
- [ ] 위치 공유 상태 실시간 표시
- [ ] 권한 설정 UI (뷰어/공유자 역할 관리)
- [ ] 모바일 최적화 (터치 제스처, 반응형 디자인)
- [ ] 성능 최적화 (캐싱, 번들 크기)

---

## 📝 개발 노트

### 주요 학습 사항
1. **Manus 플랫폼:** OAuth, 데이터베이스, 스토리지 자동 통합
2. **tRPC:** 타입 안전 API 구축의 강력함
3. **Drizzle ORM:** 타입 안전 데이터베이스 쿼리
4. **Google Maps API:** Manus 프록시를 통한 안전한 통합
5. **Geofencing:** Haversine 공식을 통한 거리 계산 및 진입/이탈 판정

### 주의사항
1. **타임스탬프 타입:** 기존 `Date.now()` (밀리초)와 새로운 `timestamp` 타입의 호환성 문제 주의
2. **마이그레이션:** 기존 데이터가 있는 경우 스키마 변경 시 신중하게 진행
3. **에러 핸들링:** API 에러 시 사용자 피드백 필수
4. **테스트 타임아웃:** 원격 DB 접근 시 네트워크 지연으로 인한 타임아웃 주의
5. **지오펜싱:** 중복 기록 방지 로직 (1시간 내 같은 이벤트 무시) 필수

---

## 🤝 협업 방식

- **AI 에이전트:** Manus AI (자동화된 개발, 테스트, 배포)
- **사용자:** 요구사항 정의, 디자인 결정, 테스트 검증
- **도구:** GitHub (버전 관리), Manus 플랫폼 (개발/배포)

---

## 📞 문의 및 지원

프로젝트 관련 문의는 Manus 플랫폼의 Management UI를 통해 진행됩니다.

---

**마지막 업데이트:** 2026-05-14 09:30 KST  
**작성자:** Manus AI Agent  
**상태:** Phase 2-2 진행 중 🚀

---

### 12단계: 페이지 분리 및 공통 레이아웃 구성 (2026-05-19)

**작업 내용:**

기존 단일 페이지(`Home.tsx`, 약 1,900줄)를 기능별로 분리하고 공통 레이아웃 시스템을 도입했다. 모든 페이지에서 동일한 헤더/푸터를 공유하고, 비로그인 상태에서도 로그인 팝업을 전역으로 호출할 수 있도록 컨텍스트 기반 구조를 적용했다.

**페이지 분리:**

| 경로 | 파일 | 설명 |
|------|------|------|
| `/` | `Home.tsx` | 랜딩 페이지 전용 (1,900줄 → 332줄) |
| `/features` | `Features.tsx` | 기능 상세 소개 페이지 |
| `/map` | `MapViewPage.tsx` | 위치 보기 페이지 (지도, 안전 구역, 알림 전체 포함) |
| `/how-to` | `HowTo.tsx` | 사용 방법 안내 페이지 |

**공통 컴포넌트 신규 생성:**

- `AppHeader.tsx` — 상단 네비게이션 (로고, 기능/위치보기/사용방법 링크, 로그인/로그아웃 버튼, 모바일 햄버거 메뉴)
- `AppFooter.tsx` — 하단 푸터
- `AppLayout.tsx` — 모든 페이지에 공통 적용되는 레이아웃 래퍼 (Header + Footer + OnboardingModal)
- `OnboardingModal.tsx` — 전역 로그인/온보딩 팝업 (소셜 로그인, 역할 선택, 위치 동의 4단계)
- `OnboardingModalContext.tsx` — 전역 모달 상태 관리 컨텍스트 (`openOnboarding()` 어디서나 호출 가능)

**App.tsx 변경:**

- `OnboardingModalProvider`를 최상위에 추가
- `/features`, `/map`, `/how-to` 라우트 신규 등록

**Google Maps 중복 로드 에러 수정:**

- `Map.tsx`: `loadMapScript`에 싱글턴 Promise 패턴 적용 — `window.google.maps` 이미 로드된 경우 즉시 반환, 로딩 중이면 기존 Promise 재사용하여 `<script>` 중복 삽입 방지
- `MapViewPage.tsx`: `mapId`가 설정된 상태에서 `styles` 속성을 함께 사용하면 발생하는 Google Maps 경고 제거 (Google Maps 정책상 `mapId`와 `styles`는 동시 사용 불가)

**테스트:**

- `Home.geofence-ui.test.ts`를 `MapViewPage.tsx` 참조로 업데이트
- 49/49 테스트 통과 유지

**체크포인트:**

| 버전 | 설명 |
|------|------|
| `333dd428` | 페이지 분리 및 공통 레이아웃 구성 |
| `1c80eecb` | Google Maps 중복 로드 에러 수정 |

---

## ✅ 최신 체크포인트 이력 (전체)

| 버전 | 설명 | 날짜 |
|------|------|------|
| `1c80eecb` | Google Maps 중복 로드 에러 수정 | 2026-05-19 |
| `333dd428` | 페이지 분리 및 공통 레이아웃 구성 | 2026-05-19 |
| `98744e14` | 안전 구역 클릭 시 InfoWindow 정보 창 기능 추가 | 2026-05-14 |
| `24b0307b` | 지도 시각화 개선: 안전 구역 원형 및 파란 깃발 마커 | 2026-05-14 |
| (이전 버전들) | 초기 구현 (인증, 위치 추적, 초대, 지오펜스, 알림) | 2026-05-12 |

---

**마지막 업데이트:** 2026-05-19 KST  
**작성자:** Manus AI Agent  
**상태:** 페이지 분리 완료, 안정적 운영 중 🚀
