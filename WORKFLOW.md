# 개발 워크플로우 가이드 (Development Workflow Guide)

이 문서는 매일 개발할 때 따라야 할 프로세스를 설명합니다.

---

## 📋 일일 개발 프로세스

### 아침: 시작 전 확인

```bash
# 1. 프로젝트 디렉토리로 이동
cd /home/ubuntu/child-location-share

# 2. 깃 상태 확인
git status
git log --oneline -3

# 3. 개발 서버 실행
pnpm dev

# 4. 브라우저에서 http://localhost:3000 확인
```

---

## 💻 개발 중 (코드 수정)

### 단계별 프로세스

#### 1️⃣ todo.md에 작업 항목 추가

새로운 기능이나 버그를 시작하기 전에 `todo.md`에 추가합니다:

```markdown
## 새로운 기능 (신규)

- [ ] 가족 초대 기능 구현
- [ ] QR 코드 생성 로직
- [ ] 초대 링크 공유 UI
```

#### 2️⃣ 코드 수정

```bash
# 파일 수정
# client/src/pages/Home.tsx
# server/routers.ts
# drizzle/schema.ts
# 등등...
```

#### 3️⃣ 테스트 실행

```bash
# 단위 테스트 실행
pnpm test

# 모든 테스트 통과 확인
# ✅ 22 passed
```

#### 4️⃣ 빌드 확인

```bash
# 프로덕션 빌드 확인
pnpm build

# 에러 없음 확인
```

#### 5️⃣ 개발 서버에서 테스트

```bash
# 브라우저에서 기능 테스트
# http://localhost:3000

# 개발자 도구(F12)에서 콘솔 에러 확인
```

#### 6️⃣ todo.md 업데이트

완료된 항목을 체크합니다:

```markdown
- [x] 가족 초대 기능 구현
- [x] QR 코드 생성 로직
- [x] 초대 링크 공유 UI
```

#### 7️⃣ HISTORY.md 업데이트

변경사항을 기록합니다:

```markdown
### N단계: 가족 초대 기능 구현

**작업 내용:**
- 가족 초대 링크 생성 로직 구현
- QR 코드 생성 및 표시
- 초대 링크 공유 UI 추가

**구현 파일:**
- `client/src/pages/Home.tsx` - 초대 UI
- `server/routers.ts` - 초대 프로시저
- `server/db.ts` - 초대 데이터 저장

**테스트 결과:**
- ✅ 모든 테스트 통과 (25/25)
- ✅ 개발 서버 정상 작동
```

---

## 🚀 커밋 및 푸시 (매번 수정 후)

### 방법 1: 자동 스크립트 사용 (권장)

```bash
# 스크립트 실행
./scripts/commit-and-push.sh "feat: 가족 초대 기능 추가"

# 자동으로 수행되는 작업:
# 1. git add -A
# 2. git commit -m "feat: 가족 초대 기능 추가"
# 3. git push github main
# 4. 최종 확인
```

### 방법 2: 수동 커밋

```bash
# 1. 변경사항 확인
git status

# 2. 모든 변경사항 스테이징
git add -A

# 3. 커밋 메시지와 함께 커밋
git commit -m "feat: 가족 초대 기능 추가"

# 4. GitHub에 푸시
git push github main

# 5. 푸시 확인
git log --oneline -1
```

---

## 📝 커밋 메시지 규칙

### 타입별 커밋 메시지

| 타입 | 설명 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 | `feat: 가족 초대 기능 추가` |
| `fix` | 버그 수정 | `fix: 지도 마커 업데이트 오류 해결` |
| `docs` | 문서 업데이트 | `docs: README.md 업데이트` |
| `test` | 테스트 추가 | `test: 위치 추적 테스트 추가` |
| `refactor` | 코드 리팩토링 | `refactor: 위치 업데이트 로직 개선` |
| `chore` | 기타 변경 | `chore: 의존성 업데이트` |

### 좋은 커밋 메시지 예시

```bash
# ✅ 좋은 예시
git commit -m "feat: 위치 이탈 알림 기능 추가"
git commit -m "fix: 온보딩 모달 닫기 버튼 오류 해결"
git commit -m "docs: HISTORY.md에 위치 추적 기능 기록"
git commit -m "test: 가족 초대 프로시저 테스트 추가"

# ❌ 나쁜 예시
git commit -m "수정"
git commit -m "업데이트"
git commit -m "버그 수정"
```

---

## 🔍 매일 체크리스트

### 아침 (시작 전)

- [ ] `git status` 확인 (변경사항 없음)
- [ ] `git log --oneline -3` 확인 (최근 커밋)
- [ ] `pnpm dev` 실행 (개발 서버 시작)
- [ ] 브라우저에서 http://localhost:3000 확인

### 개발 중

- [ ] 코드 수정
- [ ] `pnpm test` 실행 (모든 테스트 통과)
- [ ] `pnpm build` 실행 (빌드 성공)
- [ ] 브라우저에서 기능 테스트
- [ ] `todo.md` 업데이트 (완료 항목 체크)
- [ ] `HISTORY.md` 업데이트 (변경사항 기록)

### 저녁 (커밋 전)

- [ ] `git status` 확인 (모든 변경사항 확인)
- [ ] `pnpm test` 다시 실행 (최종 확인)
- [ ] `pnpm build` 다시 실행 (최종 확인)
- [ ] 커밋 메시지 준비

### 커밋 후

- [ ] `./scripts/commit-and-push.sh "메시지"` 실행
- [ ] GitHub에서 푸시 확인 (https://github.com/skyshc/PinKids)
- [ ] `git log --oneline -1` 확인

---

## 📊 파일 업데이트 규칙

### todo.md

**언제 업데이트:**
- 새로운 작업 시작 전 (항목 추가)
- 작업 완료 후 (항목 체크)

**형식:**
```markdown
- [ ] 미완료 항목
- [x] 완료된 항목
```

### HISTORY.md

**언제 업데이트:**
- 기능 구현 완료 후
- 버그 수정 후
- 주요 변경사항 발생 시

**형식:**
```markdown
### N단계: 기능명

**작업 내용:**
- 구현한 내용 1
- 구현한 내용 2

**구현 파일:**
- `파일1.ts`
- `파일2.ts`

**테스트 결과:**
- ✅ 모든 테스트 통과 (N/N)
```

### README.md

**언제 업데이트:**
- 프로젝트 구조 변경 시
- 새로운 명령어 추가 시
- 개발 가이드 변경 시

---

## 🔗 GitHub 저장소 확인

### 커밋 확인

```bash
# 로컬 커밋 확인
git log --oneline -5

# 원격 커밋 확인
git log github/main --oneline -5

# 원격 상태 확인
git remote -v
```

### GitHub 웹에서 확인

1. https://github.com/skyshc/PinKids 방문
2. "main" 브랜치 확인
3. 최근 커밋 확인
4. 파일 변경사항 확인

---

## ⚠️ 주의사항

### 커밋 전 필수 확인

```bash
# 1. 테스트 통과 확인
pnpm test
# ✅ 모든 테스트 통과

# 2. 빌드 성공 확인
pnpm build
# ✅ 빌드 완료

# 3. 개발 서버 정상 확인
pnpm dev
# ✅ 서버 실행 중
```

### 피해야 할 행동

❌ 테스트 실패 상태에서 커밋  
❌ 빌드 에러 상태에서 커밋  
❌ 커밋 메시지 없이 커밋  
❌ 불필요한 파일 커밋 (node_modules, .env 등)  

### .gitignore 확인

```bash
# 커밋되면 안 되는 파일 확인
cat .gitignore

# 일반적으로 제외되는 파일:
# - node_modules/
# - .env
# - .env.local
# - dist/
# - build/
# - *.log
```

---

## 🆘 문제 해결

### 커밋 실패

```bash
# 1. 변경사항 확인
git status

# 2. 스테이징 다시 시도
git add -A

# 3. 커밋 메시지 확인
git commit -m "feat: 설명"

# 4. 푸시 실패 시 풀 먼저 시도
git pull github main
git push github main
```

### 푸시 실패

```bash
# 1. 원격 상태 확인
git remote -v

# 2. 최신 상태 확인
git fetch github

# 3. 로컬과 원격 동기화
git pull github main

# 4. 다시 푸시
git push github main
```

### 테스트 실패

```bash
# 1. 테스트 실행
pnpm test

# 2. 실패한 테스트 확인
# 에러 메시지 읽기

# 3. 코드 수정

# 4. 테스트 다시 실행
pnpm test
```

---

## 📞 도움말

### 자주 사용하는 명령어

```bash
# 개발 서버 실행
pnpm dev

# 테스트 실행
pnpm test

# 빌드
pnpm build

# 포맷팅
pnpm format

# 깃 상태 확인
git status

# 깃 로그 확인
git log --oneline -10

# 커밋 및 푸시
./scripts/commit-and-push.sh "메시지"
```

### 문서 참고

- `README.md` - 프로젝트 개요 및 설정
- `HISTORY.md` - 모든 개발 이력
- `todo.md` - 진행 상황 및 체크리스트
- `WORKFLOW.md` - 이 파일 (개발 워크플로우)

---

**마지막 업데이트:** 2026-05-12  
**상태:** 진행 중 🚀
