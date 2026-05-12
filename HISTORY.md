# 자녀 위치 찾기 서비스 - 개발 이력 (Development History)

**프로젝트명:** 자녀 위치 찾기 서비스 (Child Location Share)  
**시작 날짜:** 2026-05-12  
**최종 업데이트:** 2026-05-12

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
  - 1단계: 보호자 로그인 (이름 입력)
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

### 3단계: 구글 지도 통합

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

### 4단계: 위치 공유 API 구현

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

### 5단계: 위치 공유 실시간 추적 기능 구현

**작업 내용:**
- 로그인 후 자동 위치 감지 및 5분마다 업로드
- Geolocation API를 통한 현재 위치 감지
- 신규 사용자 로그인 시 기본 가족 자동 생성
- 위치 업로드 실패 시 에러 핸들링

**구현 상세:**

#### 5-1. 클라이언트 측 위치 추적 (Home.tsx)
```typescript
// 로그인 후 즉시 위치 감지
useEffect(() => {
  if (!isAuthenticated || !user) return;
  
  const trackLocation = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        updateCurrentLocationMutation.mutate({
          latitude,
          longitude,
          accuracy,
        });
      },
      (error) => {
        console.warn("Geolocation error:", error);
      }
    );
  };
  
  // 즉시 한 번 실행
  trackLocation();
  
  // 5분마다 반복
  const interval = setInterval(trackLocation, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, [isAuthenticated, user]);
```

#### 5-2. 서버 측 기본 가족 자동 생성 (auth.me)
```typescript
// 신규 사용자 로그인 시 기본 가족 자동 생성
me: publicProcedure.query(async (opts) => {
  const user = opts.ctx.user;
  if (!user) return null;
  
  const memberships = await db.getAcceptedFamilyMemberships(user.id);
  if (memberships.length === 0) {
    try {
      await db.ensurePrimaryFamily({
        name: `${user.name || "사용자"}의 가족`,
        createdByUserId: user.id,
        displayName: user.name || "사용자",
        role: "guardian",
      });
    } catch (error) {
      console.warn("Failed to create primary family:", error);
    }
  }
  
  return user;
})
```

#### 5-3. 위치 업데이트 API (location.updateCurrent)
```typescript
location: router({
  updateCurrent: protectedProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const memberships = await db.getAcceptedFamilyMemberships(ctx.user.id);
      if (memberships.length === 0) {
        return { success: false, message: "No family membership" };
      }
      
      const familyId = memberships[0].familyId;
      
      await db.upsertLocationPoint({
        userId: ctx.user.id,
        familyId,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy || 0,
        recordedAt: Date.now(),
      });
      
      // 위치 데이터 재조회
      await opts.ctx.queryUtils.location.getFamilyLocations.invalidate();
      
      return { success: true };
    })
})
```

**구현 파일:**
- `client/src/pages/Home.tsx` - 위치 추적 useEffect 추가
- `server/routers.ts` - auth.me 및 location.updateCurrent 수정
- `server/db.ts` - ensurePrimaryFamily 함수

**테스트 파일:**
- `server/location.tracking.test.ts` - 위치 추적 기능 단위 테스트 (4개 테스트)

---

### 6단계: 지도에 실시간 위치 표시

**작업 내용:**
- 업로드된 위치 데이터를 지도에 실시간 마커로 표시
- 5분마다 위치 업데이트 시 지도 마커 자동 갱신
- 가족 구성원의 위치를 모두 표시

**구현 상세:**

#### 6-1. 위치 데이터 조회 (useQuery)
```typescript
const { data: storedFamilyLocations = [] } = trpc.location.getFamilyLocations.useQuery();
```

#### 6-2. 지도 마커 업데이트 (useEffect)
```typescript
useEffect(() => {
  if (!mapInstanceRef.current || !window.google) return;
  
  // 기존 마커 제거
  familyMarkerRefs.current.forEach(marker => {
    marker.map = null;
  });
  familyMarkerRefs.current = [];
  
  // 새로운 마커 추가
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
  });
}, [storedFamilyLocations]);
```

**구현 파일:**
- `client/src/pages/Home.tsx` - 지도 마커 업데이트 로직

---

### 7단계: 버그 수정 및 최적화

#### 7-1. 403 Forbidden 오류 해결 (2026-05-12)

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

#### 7-2. 스키마 변경 시도 및 롤백 (2026-05-12)

**시도:**
- 모든 테이블에 `createdAt` timestamp 컬럼 추가 (사용자 요청)
- 기존 `Date.now()` (밀리초 단위 숫자)에서 `timestamp` 타입으로 변경

**문제:**
- 기존 데이터와 새 스키마의 타입 불일치
- 마이그레이션 실패
- familyMembers 테이블에서 createdAt 컬럼 조회 에러

**해결:**
- 스키마를 원래 상태로 롤백
- 기존 `Date.now()` 방식 유지
- 모든 테스트 통과 (22개)

**롤백 파일:**
- `drizzle/schema.ts` - 스키마 복원
- `server/db.ts` - Date.now() 복원

---

### 8단계: 테스트 작성 및 검증

**작업 내용:**
- Vitest 기반 단위 테스트 작성
- 모든 주요 기능에 대한 테스트 커버리지 확보

**테스트 파일 및 케이스:**

| 파일 | 테스트 케이스 | 상태 |
|------|-------------|------|
| `server/oauth.callback.test.ts` | OAuth 콜백 처리 | ✅ 3개 통과 |
| `server/socialLoginUrl.test.ts` | 소셜 로그인 URL 생성 | ✅ 3개 통과 |
| `server/locationPermission.test.ts` | 위치 권한 관리 | ✅ 4개 통과 |
| `server/location.consent.test.ts` | 위치 동의 관리 | ✅ 7개 통과 |
| `server/auth.logout.test.ts` | 로그아웃 | ✅ 1개 통과 |
| `server/location.tracking.test.ts` | 위치 추적 기능 | ✅ 4개 통과 |

**총 테스트:** 22개 모두 통과 ✅

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
  revokedAt BIGINT
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
  consentText TEXT
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
  source VARCHAR(32) DEFAULT 'browser'
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

### 동의 (consent)
- `consent.getStatus` - 위치 동의 상태 조회
- `consent.grant` - 위치 동의 부여
- `consent.revoke` - 위치 동의 철회

### 권한 (permission)
- `permission.requestLocationAccess` - 위치 접근 권한 요청

---

## 📁 주요 파일 구조

```
child-location-share/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx (온보딩, 지도, 위치 추적)
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── Map.tsx (구글 지도 통합)
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── AIChatBox.tsx
│   │   ├── App.tsx (라우팅)
│   │   ├── main.tsx (프로바이더)
│   │   ├── index.css (글로벌 스타일)
│   │   └── const.ts (상수)
│   └── public/
├── server/
│   ├── routers.ts (tRPC 프로시저)
│   ├── db.ts (데이터베이스 헬퍼)
│   ├── storage.ts (파일 저장소)
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
- 구글 지도 (마커, 원형, 선)
- 위치 카드 (가족 구성원)
- 타임라인 (이동 경로)

---

## 🚀 배포 및 호스팅

**플랫폼:** Manus 웹개발 플랫폼
**자동 배포:** 체크포인트 생성 후 UI에서 "Publish" 버튼 클릭
**커스텀 도메인:** 지원 (Management UI에서 설정)

---

## 📊 성능 및 최적화

### 빌드 결과
- Frontend 번들 크기: ~721KB (gzip: ~205KB)
- Backend 번들 크기: ~46KB
- 모든 테스트 통과: 22/22 ✅

### 최적화 사항
- tRPC를 통한 타입 안전 API
- React Query를 통한 자동 캐싱
- Drizzle ORM을 통한 타입 안전 쿼리
- Tailwind CSS를 통한 빠른 스타일링

---

## ✅ 체크포인트 이력

| 버전 | 설명 | 날짜 |
|------|------|------|
| `2a6e0ac8` | 위치 공유 실시간 추적 기능 구현 완료 | 2026-05-12 |
| `4607d844` | 스키마 에러 수정 완료 | 2026-05-12 |

---

## 🔄 진행 중인 작업 (TODO)

- [ ] 자동 위치 추적 전에 활성 위치 동의 확인 및 미동의 사용자 처리
- [ ] 위치 업로드 실패 시 사용자 UI 피드백 추가 (토스트 또는 배너)
- [ ] 클라이언트 Geolocation 성공/권한 거부/미지원 브라우저 케이스 테스트 추가
- [ ] 5분 주기 위치 업로드 및 지도 마커 갱신 통합 테스트

---

## 📝 개발 노트

### 주요 학습 사항
1. **Manus 플랫폼:** OAuth, 데이터베이스, 스토리지 자동 통합
2. **tRPC:** 타입 안전 API 구축의 강력함
3. **Drizzle ORM:** 타입 안전 데이터베이스 쿼리
4. **Google Maps API:** Manus 프록시를 통한 안전한 통합

### 주의사항
1. **타임스탬프 타입:** 기존 `Date.now()` (밀리초)와 새로운 `timestamp` 타입의 호환성 문제 주의
2. **마이그레이션:** 기존 데이터가 있는 경우 스키마 변경 시 신중하게 진행
3. **에러 핸들링:** API 에러 시 사용자 피드백 필수

---

## 🤝 협업 방식

- **AI 에이전트:** Manus AI (자동화된 개발, 테스트, 배포)
- **사용자:** 요구사항 정의, 디자인 결정, 테스트 검증
- **도구:** GitHub (버전 관리), Manus 플랫폼 (개발/배포)

---

## 📞 문의 및 지원

프로젝트 관련 문의는 Manus 플랫폼의 Management UI를 통해 진행됩니다.

---

**마지막 업데이트:** 2026-05-12 01:10 KST  
**작성자:** Manus AI Agent  
**상태:** 진행 중 🚀
