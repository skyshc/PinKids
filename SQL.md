# SQL 데이터베이스 스키마

자녀 위치 찾기 서비스의 모든 데이터베이스 테이블 정의 및 SQL 생성문입니다.

---

## 📋 테이블 목록

1. [users](#users) - 사용자 정보
2. [families](#families) - 가족 그룹
3. [familyMembers](#familymembers) - 가족 구성원
4. [locationConsents](#locationconsents) - 위치 공유 동의
5. [locationPoints](#locationpoints) - 위치 기록
6. [inviteLinks](#invitelinks) - 초대 링크
7. [safeZones](#safezones) - 안전 구역
8. [familyAlertSettings](#familyalertsettings) - 가족 알림 설정
9. [locationAlerts](#locationalerts) - 위치 이탈 알림 기록

---

## 테이블 상세 정의

### users

사용자 정보 및 인증 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '사용자 ID',
  openId VARCHAR(64) UNIQUE NOT NULL COMMENT 'Manus OAuth 식별자',
  name TEXT COMMENT '사용자 이름',
  email VARCHAR(320) COMMENT '이메일 주소',
  loginMethod VARCHAR(64) COMMENT '로그인 방식 (kakao, google 등)',
  role ENUM('user', 'admin') DEFAULT 'user' NOT NULL COMMENT '사용자 역할',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '생성 시간',
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '수정 시간',
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '마지막 로그인 시간'
);
```

**컬럼 설명:**
- `id`: 자동 증가 기본키
- `openId`: Manus OAuth에서 반환하는 고유 식별자 (유니크)
- `name`: 사용자 이름
- `email`: 이메일 주소
- `loginMethod`: 로그인 방식 (kakao, google 등)
- `role`: 사용자 역할 (user 또는 admin)
- `createdAt`: 사용자 생성 시간
- `updatedAt`: 사용자 정보 수정 시간
- `lastSignedIn`: 마지막 로그인 시간

---

### families

가족 그룹 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE families (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '가족 ID',
  name VARCHAR(120) NOT NULL COMMENT '가족 이름',
  createdByUserId INT NOT NULL COMMENT '가족 생성자 사용자 ID',
  createdAt BIGINT NOT NULL COMMENT '생성 시간 (Unix 타임스탬프 ms)',
  updatedAt BIGINT NOT NULL COMMENT '수정 시간 (Unix 타임스탬프 ms)'
);
```

**컬럼 설명:**
- `id`: 자동 증가 기본키
- `name`: 가족 이름 (예: "김가족", "이가족")
- `createdByUserId`: 가족을 생성한 사용자의 ID
- `createdAt`: 가족 생성 시간 (밀리초 단위 Unix 타임스탬프)
- `updatedAt`: 가족 정보 수정 시간 (밀리초 단위 Unix 타임스탬프)

---

### familyMembers

가족 구성원 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE familyMembers (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '가족 구성원 ID',
  familyId INT NOT NULL COMMENT '가족 ID (families.id)',
  userId INT COMMENT '사용자 ID (users.id, NULL이면 초대 대기 중)',
  displayName VARCHAR(120) NOT NULL COMMENT '표시 이름',
  role ENUM('guardian', 'child') NOT NULL COMMENT '역할 (보호자/자녀)',
  inviteStatus ENUM('pending', 'accepted', 'declined', 'revoked') DEFAULT 'pending' NOT NULL COMMENT '초대 상태',
  canViewLocation BOOLEAN DEFAULT FALSE NOT NULL COMMENT '위치 조회 권한',
  canShareLocation BOOLEAN DEFAULT FALSE NOT NULL COMMENT '위치 공유 권한',
  invitedAt BIGINT NOT NULL COMMENT '초대 시간 (Unix 타임스탬프 ms)',
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '레코드 생성 시간',
  acceptedAt BIGINT COMMENT '초대 수락 시간 (Unix 타임스탬프 ms)',
  revokedAt BIGINT COMMENT '초대 취소 시간 (Unix 타임스탬프 ms)'
);
```

**컬럼 설명:**
- `id`: 자동 증가 기본키
- `familyId`: 가족 ID (families.id 참조)
- `userId`: 사용자 ID (users.id 참조, NULL이면 아직 초대 대기 중)
- `displayName`: 가족 내에서 표시할 이름
- `role`: 역할 (guardian: 보호자, child: 자녀)
- `inviteStatus`: 초대 상태 (pending: 대기, accepted: 수락, declined: 거절, revoked: 취소)
- `canViewLocation`: 위치 조회 권한 여부
- `canShareLocation`: 위치 공유 권한 여부
- `invitedAt`: 초대 시간 (밀리초 단위)
- `date`: 레코드 생성 시간 (타임스탬프)
- `acceptedAt`: 초대 수락 시간 (밀리초 단위, NULL이면 미수락)
- `revokedAt`: 초대 취소 시간 (밀리초 단위, NULL이면 미취소)

---

### locationConsents

위치 공유 동의 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE locationConsents (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '동의 ID',
  userId INT NOT NULL COMMENT '사용자 ID (users.id)',
  familyId INT COMMENT '가족 ID (families.id)',
  consentVersion VARCHAR(32) NOT NULL COMMENT '동의 버전',
  status ENUM('granted', 'revoked') DEFAULT 'granted' NOT NULL COMMENT '동의 상태',
  grantedAt BIGINT NOT NULL COMMENT '동의 시간 (Unix 타임스탬프 ms)',
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '레코드 생성 시간',
  revokedAt BIGINT COMMENT '동의 철회 시간 (Unix 타임스탬프 ms)',
  permissionState VARCHAR(32) NOT NULL COMMENT '브라우저 위치 권한 상태',
  ipAddress VARCHAR(96) COMMENT '동의 시 IP 주소',
  userAgent TEXT COMMENT '동의 시 User-Agent',
  consentText TEXT COMMENT '동의 문구'
);
```

**컬럼 설명:**
- `id`: 자동 증가 기본키
- `userId`: 사용자 ID (users.id 참조)
- `familyId`: 가족 ID (families.id 참조)
- `consentVersion`: 동의 버전 (법적 변경 추적용)
- `status`: 동의 상태 (granted: 동의, revoked: 철회)
- `grantedAt`: 동의 시간 (밀리초 단위)
- `date`: 레코드 생성 시간 (타임스탬프)
- `revokedAt`: 동의 철회 시간 (밀리초 단위, NULL이면 미철회)
- `permissionState`: 브라우저 Geolocation API 권한 상태
- `ipAddress`: 동의 시 클라이언트 IP 주소
- `userAgent`: 동의 시 브라우저 User-Agent
- `consentText`: 사용자가 동의한 문구

---

### locationPoints

사용자의 위치 기록을 저장하는 테이블입니다.

```sql
CREATE TABLE locationPoints (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '위치 기록 ID',
  userId INT NOT NULL COMMENT '사용자 ID (users.id)',
  familyId INT COMMENT '가족 ID (families.id)',
  latitude DOUBLE NOT NULL COMMENT '위도',
  longitude DOUBLE NOT NULL COMMENT '경도',
  accuracy DOUBLE COMMENT '정확도 (미터)',
  recordedAt BIGINT NOT NULL COMMENT '위치 기록 시간 (Unix 타임스탬프 ms)',
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '레코드 생성 시간',
  isActive BOOLEAN DEFAULT TRUE NOT NULL COMMENT '활성 상태 (같은 좌표 업데이트 시 이전 레코드 비활성화)',
  source VARCHAR(32) DEFAULT 'browser' NOT NULL COMMENT '위치 출처 (browser, gps 등)'
);
```

**컬럼 설명:**
- `id`: 자동 증가 기본키
- `userId`: 사용자 ID (users.id 참조)
- `familyId`: 가족 ID (families.id 참조)
- `latitude`: 위도 좌표
- `longitude`: 경도 좌표
- `accuracy`: GPS 정확도 (미터 단위)
- `recordedAt`: 위치 기록 시간 (밀리초 단위)
- `date`: 레코드 생성 시간 (타임스탬프)
- `isActive`: 활성 상태 (같은 좌표 업데이트 시 이전 레코드는 false로 설정)
- `source`: 위치 출처 (browser: 브라우저 Geolocation API, gps: GPS 등)

---

### inviteLinks

가족 초대 링크 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE inviteLinks (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '초대 링크 ID',
  familyId INT NOT NULL COMMENT '가족 ID (families.id)',
  createdByUserId INT NOT NULL COMMENT '초대 링크 생성자 ID (users.id)',
  token VARCHAR(128) UNIQUE NOT NULL COMMENT '초대 토큰 (Crypto.randomUUID)',
  role ENUM('guardian', 'child') NOT NULL COMMENT '초대 대상 역할',
  canViewLocation BOOLEAN DEFAULT FALSE NOT NULL COMMENT '위치 조회 권한',
  canShareLocation BOOLEAN DEFAULT FALSE NOT NULL COMMENT '위치 공유 권한',
  expiresAt BIGINT NOT NULL COMMENT '만료 시간 (Unix 타임스탬프 ms)',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '생성 시간',
  usedAt BIGINT COMMENT '사용 시간 (Unix 타임스탬프 ms)',
  usedByUserId INT COMMENT '초대 수락한 사용자 ID (users.id)',
  revokedAt TIMESTAMP COMMENT '취소 시간'
);
```

**컬럼 설명:**
- `id`: 자동 증가 기본키
- `familyId`: 가족 ID (families.id 참조)
- `createdByUserId`: 초대 링크를 생성한 사용자 ID (users.id 참조)
- `token`: 초대 토큰 (Crypto.randomUUID로 생성, 유니크)
- `role`: 초대 대상의 역할 (guardian 또는 child)
- `canViewLocation`: 초대 대상에게 부여할 위치 조회 권한
- `canShareLocation`: 초대 대상에게 부여할 위치 공유 권한
- `expiresAt`: 초대 링크 만료 시간 (밀리초 단위, 기본값: 24시간 후)
- `createdAt`: 초대 링크 생성 시간 (타임스탬프)
- `usedAt`: 초대 링크 사용 시간 (밀리초 단위, NULL이면 미사용)
- `usedByUserId`: 초대를 수락한 사용자 ID (users.id 참조)
- `revokedAt`: 초대 링크 취소 시간 (타임스탬프)

---

### safeZones

안전 구역 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE safeZones (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '안전 구역 ID',
  familyId INT NOT NULL COMMENT '가족 ID (families.id)',
  createdByUserId INT NOT NULL COMMENT '생성자 ID (users.id)',
  name VARCHAR(120) NOT NULL COMMENT '안전 구역 이름 (예: 학교, 집)',
  centerLatitude DOUBLE NOT NULL COMMENT '중심 위도',
  centerLongitude DOUBLE NOT NULL COMMENT '중심 경도',
  radiusMeters INT NOT NULL COMMENT '반경 (미터)',
  isActive BOOLEAN DEFAULT TRUE NOT NULL COMMENT '활성 상태',
  alertsEnabled BOOLEAN DEFAULT TRUE NOT NULL COMMENT '알림 활성화 여부',
  createdAt BIGINT NOT NULL COMMENT '생성 시간 (Unix 타임스탬프 ms)',
  updatedAt BIGINT NOT NULL COMMENT '수정 시간 (Unix 타임스탬프 ms)'
);
```

**컬럼 설명:**
- `id`: 자동 증가 기본키
- `familyId`: 가족 ID (families.id 참조)
- `createdByUserId`: 안전 구역을 생성한 사용자 ID (users.id 참조)
- `name`: 안전 구역 이름 (예: "학교", "집", "학원")
- `centerLatitude`: 안전 구역 중심 위도
- `centerLongitude`: 안전 구역 중심 경도
- `radiusMeters`: 안전 구역 반경 (미터 단위, 예: 500m)
- `isActive`: 안전 구역 활성 상태
- `alertsEnabled`: 이탈 알림 활성화 여부
- `createdAt`: 생성 시간 (밀리초 단위)
- `updatedAt`: 수정 시간 (밀리초 단위)

---

### familyAlertSettings

가족 알림 설정을 저장하는 테이블입니다.

```sql
CREATE TABLE familyAlertSettings (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '알림 설정 ID',
  familyId INT NOT NULL COMMENT '가족 ID (families.id)',
  userId INT NOT NULL COMMENT '사용자 ID (users.id)',
  geofenceAlertsEnabled BOOLEAN DEFAULT TRUE NOT NULL COMMENT '지오펜싱 알림 활성화',
  alertChannels VARCHAR(255) DEFAULT 'push' NOT NULL COMMENT '알림 채널 (JSON 배열: ["push", "email", "sms"])',
  updatedAt BIGINT NOT NULL COMMENT '수정 시간 (Unix 타임스탬프 ms)'
);
```

**컬럼 설명:**
- `id`: 자동 증가 기본키
- `familyId`: 가족 ID (families.id 참조)
- `userId`: 사용자 ID (users.id 참조)
- `geofenceAlertsEnabled`: 지오펜싱 알림 활성화 여부
- `alertChannels`: 알림 채널 (JSON 배열 형식: ["push", "email", "sms"])
- `updatedAt`: 설정 수정 시간 (밀리초 단위)

**alertChannels 예시:**
```json
["push"]                    // 푸시 알림만
["push", "email"]           // 푸시 + 이메일
["push", "email", "sms"]    // 모든 채널
```

---

### locationAlerts

위치 이탈 알림 기록을 저장하는 테이블입니다.

```sql
CREATE TABLE locationAlerts (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '이탈 알림 ID',
  familyId INT NOT NULL COMMENT '가족 ID (families.id)',
  safeZoneId INT NOT NULL COMMENT '안전 구역 ID (safeZones.id)',
  memberUserId INT NOT NULL COMMENT '가족 구성원 ID (familyMembers.id)',
  locationPointId INT COMMENT '위치 기록 ID (locationPoints.id)',
  eventType ENUM('exit', 'enter') NOT NULL COMMENT '이벤트 타입 (exit: 이탈, enter: 진입)',
  latitude DOUBLE NOT NULL COMMENT '이탈/진입 시 위도',
  longitude DOUBLE NOT NULL COMMENT '이탈/진입 시 경도',
  distanceMeters DOUBLE NOT NULL COMMENT '안전 구역 중심으로부터의 거리 (미터)',
  message VARCHAR(255) NOT NULL COMMENT '알림 메시지',
  createdAt BIGINT NOT NULL COMMENT '이탈 이벤트 발생 시간 (Unix 타임스탬프 ms)',
  acknowledgedAt BIGINT COMMENT '알림 확인 시간 (Unix 타임스탬프 ms)'
);
```

**컬럼 설명:**
- `id`: 자동 증가 기본키
- `familyId`: 가족 ID (families.id 참조)
- `safeZoneId`: 안전 구역 ID (safeZones.id 참조)
- `memberUserId`: 이탈한 가족 구성원 ID (familyMembers.id 참조)
- `locationPointId`: 이탈 시 기록된 위치 ID (locationPoints.id 참조)
- `eventType`: 이벤트 타입 (exit: 안전 구역 이탈, enter: 안전 구역 진입)
- `latitude`: 이탈/진입 시 위도
- `longitude`: 이탈/진입 시 경도
- `distanceMeters`: 안전 구역 중심으로부터의 거리 (미터 단위)
- `message`: 알림 메시지 (예: "학교 안전 구역을 벗어났습니다")
- `createdAt`: 이탈 이벤트 발생 시간 (밀리초 단위)
- `acknowledgedAt`: 알림을 사용자가 확인한 시간 (밀리초 단위, NULL이면 미확인)

---

## 📊 테이블 관계도

```
users (1)
  ├─ families (N) [createdByUserId]
  │   ├─ familyMembers (N) [familyId]
  │   │   └─ locationConsents (N) [userId, familyId]
  │   ├─ locationPoints (N) [userId, familyId]
  │   ├─ inviteLinks (N) [familyId, createdByUserId]
  │   ├─ safeZones (N) [familyId, createdByUserId]
  │   ├─ familyAlertSettings (N) [familyId, userId]
  │   └─ locationAlerts (N) [familyId, safeZoneId, memberUserId]
```

---

## 🔍 주요 쿼리 예시

### 1. 사용자의 가족 조회

```sql
SELECT f.* FROM families f
INNER JOIN familyMembers fm ON f.id = fm.familyId
WHERE fm.userId = ? AND fm.inviteStatus = 'accepted';
```

### 2. 가족의 최신 위치 조회

```sql
SELECT DISTINCT ON (lp.userId) lp.* FROM locationPoints lp
INNER JOIN familyMembers fm ON lp.userId = fm.userId
WHERE lp.familyId = ? AND lp.isActive = TRUE
ORDER BY lp.userId, lp.recordedAt DESC;
```

### 3. 안전 구역 이탈 이벤트 조회

```sql
SELECT la.* FROM locationAlerts la
WHERE la.familyId = ? AND la.eventType = 'exit'
ORDER BY la.createdAt DESC
LIMIT 10;
```

### 4. 유효한 초대 링크 조회

```sql
SELECT * FROM inviteLinks
WHERE token = ? AND expiresAt > ? AND usedAt IS NULL AND revokedAt IS NULL;
```

### 5. 위치 동의 상태 확인

```sql
SELECT * FROM locationConsents
WHERE userId = ? AND familyId = ?
ORDER BY grantedAt DESC
LIMIT 1;
```

---

## 🔐 인덱스 추천

성능 최적화를 위해 다음 인덱스 생성을 권장합니다:

```sql
-- users 테이블
CREATE UNIQUE INDEX idx_users_openId ON users(openId);

-- families 테이블
CREATE INDEX idx_families_createdByUserId ON families(createdByUserId);

-- familyMembers 테이블
CREATE INDEX idx_familyMembers_familyId ON familyMembers(familyId);
CREATE INDEX idx_familyMembers_userId ON familyMembers(userId);
CREATE INDEX idx_familyMembers_inviteStatus ON familyMembers(inviteStatus);

-- locationConsents 테이블
CREATE INDEX idx_locationConsents_userId_familyId ON locationConsents(userId, familyId);
CREATE INDEX idx_locationConsents_status ON locationConsents(status);

-- locationPoints 테이블
CREATE INDEX idx_locationPoints_userId_familyId ON locationPoints(userId, familyId);
CREATE INDEX idx_locationPoints_isActive ON locationPoints(isActive);
CREATE INDEX idx_locationPoints_recordedAt ON locationPoints(recordedAt);

-- inviteLinks 테이블
CREATE UNIQUE INDEX idx_inviteLinks_token ON inviteLinks(token);
CREATE INDEX idx_inviteLinks_familyId ON inviteLinks(familyId);
CREATE INDEX idx_inviteLinks_expiresAt ON inviteLinks(expiresAt);

-- safeZones 테이블
CREATE INDEX idx_safeZones_familyId ON safeZones(familyId);
CREATE INDEX idx_safeZones_isActive ON safeZones(isActive);

-- familyAlertSettings 테이블
CREATE UNIQUE INDEX idx_familyAlertSettings_familyId_userId ON familyAlertSettings(familyId, userId);

-- locationAlerts 테이블
CREATE INDEX idx_locationAlerts_familyId ON locationAlerts(familyId);
CREATE INDEX idx_locationAlerts_safeZoneId ON locationAlerts(safeZoneId);
CREATE INDEX idx_locationAlerts_eventType ON locationAlerts(eventType);
CREATE INDEX idx_locationAlerts_createdAt ON locationAlerts(createdAt);
```

---

## 📝 마이그레이션 명령어

Drizzle ORM을 사용하여 마이그레이션을 실행합니다:

```bash
# 마이그레이션 생성
pnpm drizzle-kit generate

# 마이그레이션 적용
pnpm drizzle-kit migrate

# 또는 한 번에 실행
pnpm db:push
```

---

**마지막 업데이트:** 2026-05-14  
**데이터베이스:** MySQL/TiDB  
**ORM:** Drizzle ORM
