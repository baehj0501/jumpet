---
allowed-tools: Bash(git:*)
argument-hint: 추가 컨텍스트 (선택)
description: 변경사항 분석 기반 커밋 메시지 생성 및 커밋
---

# Commit 워크플로우

$ARGUMENTS가 있으면 커밋 메시지 작성 시 참고합니다.
예: `/commit 로그인 관련 버그 수정` → 해당 맥락을 메시지에 반영

## 1단계: 상태 확인 및 변경사항 분석

다음 명령어를 실행하여 현재 상태를 파악합니다:

```bash
git branch --show-current
git status --short
git diff HEAD
```

- 변경사항이 없으면 "커밋할 변경사항이 없습니다" 메시지 출력 후 종료
- 변경된 파일 목록과 주요 변경 내용 파악

## 2단계: 현재 브랜치 커밋 메시지 스타일 분석

```bash
git log origin/develop..HEAD --oneline
```

- **Prefix는 항상 변경사항 기반으로 AI가 결정** (기존 커밋과 무관)
- 현재 브랜치에 커밋이 **있으면**: 메시지 스타일(한글/영어, 문체, 길이 등)만 참고하여 일관성 유지
- 현재 브랜치에 커밋이 **없으면**: 스타일 분석 생략, 자유롭게 작성

## 3단계: Prefix 결정 및 메시지 작성

변경사항을 분석하여 아래 prefix 중 적절한 것을 선택합니다:

| Prefix   | 용도                 | 예시                            |
| -------- | -------------------- | ------------------------------- |
| feat     | 새로운 기능 추가     | feat: 사용자 로그인 기능 추가   |
| fix      | 버그 수정            | fix: 로그인 예외 처리 버그 수정 |
| hotfix   | 긴급 버그 수정       | hotfix: 긴급 보안 패치          |
| chore    | 잡무나 유지보수 작업 | chore: 라이브러리 업데이트      |
| docs     | 문서 수정            | docs: README 업데이트           |
| style    | 코드 스타일 수정     | style: 코드 포맷팅 수정         |
| refactor | 코드 구조 개선       | refactor: 쿼리 최적화           |
| test     | 테스트 추가/수정     | test: 유닛 테스트 추가          |

- **Prefix**: 변경사항(신규 기능/버그 수정/문서 등) 분석하여 자동 결정
- **메시지**: 2단계에서 파악한 스타일(있으면)에 맞춰 작성
- **Description**: 필요시 상세 설명 추가

## 4단계: 변경사항 Staging

변경된 파일을 확인하고 관련 파일만 선택적으로 staging합니다:

```bash
# 변경된 파일 목록 확인
git status --short

# 관련 파일만 선택적으로 staging (민감한 파일 제외)
# 예: git add src/components/Login.tsx src/utils/auth.ts
git add [파일1] [파일2] ...
```

> **중요**: `.env`, `credentials.json` 등 민감한 파일은 절대 staging하지 않습니다.

## 5단계: 커밋 실행

```bash
# 커밋 실행 (description이 있는 경우)
git commit -m "prefix: 제목" -m "상세 설명"

# 커밋 실행 (description이 없는 경우)
git commit -m "prefix: 제목"
```

> **Note**: pre-commit hook이 자동 실행되어 lint 검사를 수행합니다.
>
> - Lint 에러 발견 시: 자동 수정 후 `git add`로 재staging 필요
> - Hook 실패 시: 에러 메시지 확인 후 수정

## 6단계: 결과 출력

커밋 완료 후 다음 정보를 출력합니다:

```bash
git log -1 --pretty=format:"%h %s" # 커밋 해시 + 메시지
git diff --stat HEAD~1             # 변경된 파일 통계
```

- 커밋 해시 (short)
- 커밋 메시지
- 변경된 파일 수 및 라인 수
