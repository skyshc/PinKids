#!/bin/bash

# 자동 커밋 및 푸시 스크립트
# 사용법: ./scripts/commit-and-push.sh "커밋 메시지"

set -e  # 에러 발생 시 즉시 종료

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수: 메시지 출력
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 커밋 메시지 확인
if [ -z "$1" ]; then
    print_error "커밋 메시지를 입력해주세요"
    echo "사용법: ./scripts/commit-and-push.sh \"커밋 메시지\""
    exit 1
fi

COMMIT_MESSAGE="$1"

# 프로젝트 디렉토리 확인
if [ ! -d ".git" ]; then
    print_error "깃 저장소를 찾을 수 없습니다. 프로젝트 루트 디렉토리에서 실행하세요."
    exit 1
fi

print_header "자동 커밋 및 푸시 시작"

# 1단계: 변경사항 확인
print_info "1단계: 변경사항 확인 중..."
if git status --porcelain | grep -q .; then
    print_success "변경사항 감지됨"
    git status --short
else
    print_error "변경사항이 없습니다"
    exit 0
fi

# 2단계: 모든 변경사항 스테이징
print_info "2단계: 모든 변경사항 스테이징 중..."
git add -A
print_success "스테이징 완료"

# 3단계: 커밋
print_info "3단계: 커밋 생성 중..."
git commit -m "$COMMIT_MESSAGE"
print_success "커밋 생성 완료: $COMMIT_MESSAGE"

# 4단계: GitHub 푸시
print_info "4단계: GitHub에 푸시 중..."
if git push github main; then
    print_success "GitHub 푸시 완료"
else
    print_error "GitHub 푸시 실패"
    exit 1
fi

# 5단계: 최종 확인
print_info "5단계: 최종 확인 중..."
echo ""
echo "최근 커밋:"
git log --oneline -1
echo ""
echo "원격 상태:"
git remote -v | grep github
echo ""

print_header "✨ 커밋 및 푸시 완료!"
print_success "모든 변경사항이 GitHub에 업로드되었습니다"
echo ""
echo "저장소: https://github.com/skyshc/PinKids"
