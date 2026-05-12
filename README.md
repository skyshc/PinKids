# 자녀 위치 찾기 서비스 (Child Location Share)

**프로젝트명:** 자녀 위치 찾기 서비스  
**저장소:** https://github.com/skyshc/PinKids.git  
**플랫폼:** Manus 웹개발 플랫폼  
**스택:** React 19 + Tailwind 4 + Express 4 + tRPC 11 + MySQL/TiDB

---

## 📋 프로젝트 개요

부모가 자녀의 실시간 위치를 안전하게 확인할 수 있는 웹 서비스입니다. 
- 5분마다 자동으로 위치 감지 및 업로드
- 구글 지도에 실시간 위치 표시
- 온보딩을 통한 쉬운 초기 설정
- 네오-브루탈리즘 디자인

---

## 🚀 개발 워크플로우 (Development Workflow)

### 1️⃣ 매일 시작할 때

```bash
# 프로젝트 디렉토리로 이동
cd /home/ubuntu/child-location-share

# 최신 상태 확인
git log --oneline -3
git status
```

### 2️⃣ 개발 중 (코드 수정)

**모든 변경사항을 기록하세요:**

1. **todo.md에 작업 항목 추가**
   ```markdown
   - [ ] 새로운 기능 설명
   ```

2. **코드 수정 및 테스트**
   ```bash
   pnpm dev        # 개발 서버 실행
   pnpm test       # 테스트 실행
   pnpm build      # 빌드 확인
   ```

3. **HISTORY.md에 변경사항 기록**
   - 어떤 기능을 구현했는지
   - 어떤 버그를 수정했는지
   - 테스트 결과

4. **todo.md에서 완료 항목 체크**
   ```markdown
   - [x] 새로운 기능 설명
   ```

### 3️⃣ 커밋 및 푸시 (매번 수정 후)

**자동 커밋/푸시 스크립트 사용:**

```bash
# 스크립트 실행
./scripts/commit-and-push.sh "기능 설명"

# 또는 수동으로
git add -A
git commit -m "feat: 기능 설명"
git push github main
```

### 4️⃣ 주요 마일스톤 (기능 완성 후)

**Manus 체크포인트 생성:**
```bash
# Management UI에서 "Publish" 버튼 클릭
# 또는 webdev_save_checkpoint 사용
```

---

## 📁 파일 구조 및 역할

### 핵심 문서

| 파일 | 역할 | 업데이트 주기 |
|------|------|------------|
| `README.md` | 프로젝트 개요 및 개발 가이드 | 필요시 |
| `HISTORY.md` | 모든 개발 이력 및 변경사항 | **매일** |
| `todo.md` | 진행 상황 및 체크리스트 | **매일** |

### 개발 파일

```
client/
  ├── src/
  │   ├── pages/Home.tsx          # 온보딩, 지도, 위치 추적
  │   ├── components/Map.tsx      # 구글 지도 통합
  │   └── App.tsx                 # 라우팅
  └── public/

server/
  ├── routers.ts                  # tRPC 프로시저
  ├── db.ts                       # 데이터베이스 헬퍼
  └── storage.ts                  # 파일 저장소

drizzle/
  ├── schema.ts                   # 데이터베이스 스키마
  └── migrations/                 # 마이그레이션 파일

tests/
  └── *.test.ts                   # Vitest 테스트
```

---

## 🔄 커밋 및 푸시 자동화

### 스크립트 사용 (권장)

**`scripts/commit-and-push.sh` 실행:**

```bash
./scripts/commit-and-push.sh "기능 설명"
```

**스크립트가 자동으로 수행하는 작업:**
1. 모든 변경사항 스테이징 (`git add -A`)
2. 커밋 생성 (`git commit -m "..."`)
3. GitHub 푸시 (`git push github main`)
4. 상태 확인 (`git log -1`)

### 수동 커밋 (스크립트 없을 때)

```bash
# 1. 변경사항 확인
git status

# 2. 모든 변경사항 스테이징
git add -A

# 3. 커밋 메시지와 함께 커밋
git commit -m "feat: 새로운 기능 추가"
# 또는
git commit -m "fix: 버그 수정"
# 또는
git commit -m "docs: 문서 업데이트"

# 4. GitHub에 푸시
git push github main

# 5. 푸시 확인
git log --oneline -1
```

### 커밋 메시지 규칙

```
feat:   새로운 기능 추가
fix:    버그 수정
docs:   문서 업데이트
test:   테스트 추가/수정
refactor: 코드 리팩토링
chore:  빌드, 의존성 등 기타 변경
```

**예시:**
```bash
git commit -m "feat: 위치 이탈 알림 기능 추가"
git commit -m "fix: 지도 마커 업데이트 오류 해결"
git commit -m "docs: HISTORY.md 업데이트"
```

---

## 📊 일일 체크리스트

### 매일 시작 전

- [ ] `git status` 확인 (변경사항 없음 확인)
- [ ] `git log --oneline -3` 확인 (최근 커밋 확인)
- [ ] `pnpm dev` 실행 (개발 서버 정상 작동 확인)

### 개발 중

- [ ] 코드 수정 후 `pnpm test` 실행
- [ ] 테스트 통과 확인
- [ ] `todo.md`에 작업 항목 추가
- [ ] 기능 완성 후 `HISTORY.md` 업데이트

### 커밋 전

- [ ] `git status` 확인
- [ ] 모든 변경사항 검토
- [ ] `pnpm build` 성공 확인
- [ ] `pnpm test` 모두 통과 확인

### 커밋 후

- [ ] `git log --oneline -1` 확인
- [ ] GitHub에서 푸시 확인 (https://github.com/skyshc/PinKids)
- [ ] `todo.md`에서 완료 항목 체크
- [ ] `HISTORY.md` 업데이트

---

## 🔗 GitHub 저장소

**저장소 URL:** https://github.com/skyshc/PinKids.git  
**브랜치:** main  
**원격 이름:** github

**GitHub에서 확인:**
```bash
# 최신 커밋 확인
git log github/main --oneline -5

# 원격 상태 확인
git remote -v
```

---

## 📝 주요 명령어

### 개발

```bash
pnpm dev              # 개발 서버 실행
pnpm build            # 프로덕션 빌드
pnpm test             # 테스트 실행
pnpm format           # 코드 포맷팅
```

### 데이터베이스

```bash
pnpm db:push          # 스키마 마이그레이션
```

### 깃 작업

```bash
git status            # 변경사항 확인
git add -A            # 모든 변경사항 스테이징
git commit -m "msg"   # 커밋
git push github main  # GitHub 푸시
git log --oneline     # 커밋 히스토리
```

---

## 📖 문서 가이드

### HISTORY.md 작성 규칙

**매일 또는 기능 완성 후 업데이트:**

```markdown
### N단계: 기능명

**작업 내용:**
- 구현한 내용 1
- 구현한 내용 2

**구현 파일:**
- `client/src/pages/Home.tsx`
- `server/routers.ts`

**테스트 결과:**
- ✅ 모든 테스트 통과 (22/22)
```

### todo.md 작성 규칙

**진행 상황 체크:**

```markdown
- [ ] 미완료 항목
- [x] 완료된 항목

## 섹션명
- [ ] 세부 항목 1
- [x] 세부 항목 2
```

---

## 🎯 다음 단계 (Next Steps)

현재 구현된 기능:
- ✅ 온보딩 UI (4단계)
- ✅ 구글 지도 통합
- ✅ 실시간 위치 추적 (5분 주기)
- ✅ 위치 데이터 저장

추천 다음 기능:
1. **가족 초대 기능** - QR 코드 또는 초대 링크
2. **위치 이탈 알림** - 안전 구역 벗어나면 푸시 알림
3. **위치 히스토리** - 시간대별 이동 경로 조회

---

## 📞 지원

- **개발 플랫폼:** Manus (https://manus.im)
- **GitHub:** https://github.com/skyshc/PinKids
- **문서:** 이 README.md, HISTORY.md, todo.md 참고

---

**마지막 업데이트:** 2026-05-12  
**상태:** 진행 중 🚀
