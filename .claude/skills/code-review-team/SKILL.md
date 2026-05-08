---
name: code-review-team
description: Agent Teams를 활용한 병렬 코드 리뷰. 3명의 독립 팀원이 각자의 context window에서 코드 품질 원칙, React 성능, 프로젝트 컨벤션을 동시에 검사합니다. Use when (1) "팀 리뷰", "team review" 언급 시, (2) Agent Teams 기반 병렬 코드 리뷰가 필요할 때
---

# Agent Teams 코드 리뷰

3명의 독립 팀원을 Agent Teams로 spawn하여 병렬 코드 리뷰를 수행한다.

## 팀 구성

| 팀원 이름 | Skill | 관점 |
|-----------|-------|------|
| frontend-fundamentals-reviewer | `frontend-fundamentals` | 응집도, 결합도, 가독성, 예측 가능성 |
| vercel-react-best-practices-reviewer | `vercel-react-best-practices` | React/Next.js 성능 최적화 |
| rapportlabs-frontend-guide-reviewer | `rapportlabs-frontend-guide` | 프로젝트 컨벤션 (파일 구조, 네이밍, API 패턴) |

## 실행 절차

### Step 1: 리뷰 대상 파일 결정

우선순위 순서:

1. **$ARGUMENTS**: 인자로 파일/폴더가 전달된 경우 그대로 사용
2. **git diff 기반** (인자 없을 때):
   - `git diff --cached --name-only` (staged)
   - 없으면 `git diff --name-only` (unstaged)
   - 없으면 `git diff $(git merge-base HEAD develop) --name-only` (현재 브랜치 분기점 기준)
3. **AskUserQuestion**: 위 모두 해당 없으면 사용자에게 질문

제외 대상: `*.md`, `*.json`, `*.yaml`, `*.test.*`, `*.spec.*`, 자동 생성 파일.

### Step 2: Team 생성 및 Task 등록

1. **TeamCreate**로 팀 생성: `team_name: "code-review"`
2. **TaskCreate**로 3개 작업 등록:
   - "frontend-fundamentals 관점 코드 리뷰"
   - "vercel-react-best-practices 관점 코드 리뷰"
   - "rapportlabs-frontend-guide 관점 코드 리뷰"

### Step 3: 팀원 3명 동시 Spawn

**반드시 하나의 메시지에서 3개 Task tool을 동시에 호출할 것.**

각 팀원의 Task 설정:
- `subagent_type`: `"general-purpose"`
- `team_name`: `"code-review"`
- `name`: 위 팀 구성 테이블의 팀원 이름

각 팀원에게 전달할 prompt:

```
당신은 "{관점명}" 관점의 코드 리뷰 팀원입니다.

## 수행 단계

1. TaskList를 확인하고 자신의 작업을 claim하세요 (TaskUpdate로 owner를 자신의 이름으로, status를 in_progress로 변경).
2. Skill("{skill-name}")을 호출하여 리뷰 가이드라인을 로드하세요.
3. 아래 파일들을 Read tool로 각각 읽으세요:
   {파일 경로 목록 (절대 경로, 한 줄에 하나씩)}
4. 로드된 가이드라인 기준으로 코드를 리뷰하세요.
5. 리뷰 결과를 아래 출력 포맷에 맞춰 SendMessage(type: "message", recipient: "team-lead")로 팀 리더에게 보고하세요.
6. TaskUpdate로 작업을 completed로 변경하세요.

## 출력 포맷

파일별로 지적 사항을 나열. 심각도:
- [CRITICAL]: 반드시 수정 필요 (버그, 성능 이슈, 보안 문제)
- [WARNING]: 수정 권장 (패턴 위반, 가독성 저하)
- [INFO]: 참고 사항 (개선 제안)

각 지적 사항에 포함:
- 파일명:라인번호
- 현재 코드 (간략히)
- 문제 설명
- 개선 제안 (코드 예시 포함)

지적이 없는 파일은 생략. 전체 지적이 없으면 "지적 사항 없음" 반환.
```

### Step 4: 결과 수집 및 병합

팀원 3명의 메시지를 모두 수신한 뒤:

#### 중복 제거

동일 파일:동일 라인에 대해 같은 문제를 지적한 경우:
- 하나로 통합, 관련 관점 모두 표기 (예: `[frontend-fundamentals, vercel-react-best-practices]`)
- 더 구체적인 개선 제안 채택. 양쪽 모두 유용하면 병합

#### 넘버링

모든 지적 사항에 1부터 순서대로 번호 부여.
사용자가 "3번 수정해줘"처럼 번호로 지정할 수 있게 함.

#### 출력 포맷

```
# 코드 품질 종합 리뷰 (Agent Teams)

리뷰 대상: {파일 목록 또는 범위 요약}

---

## 코드 품질 원칙 (frontend-fundamentals)

1. [CRITICAL] `파일명:라인번호` - 문제 설명 ...
2. [WARNING] `파일명:라인번호` - 문제 설명 ...

## React 성능 (vercel-react-best-practices)

3. [WARNING] `파일명:라인번호` - 문제 설명 ...

## 프로젝트 컨벤션 (rapportlabs-frontend-guide)

4. [INFO] `파일명:라인번호` - 문제 설명 ...
5. [WARNING] `파일명:라인번호` [frontend-fundamentals와 중복 통합] - 문제 설명 ...
```

넘버링은 섹션을 넘어 전체에서 연속. 중복 통합된 항목은 `[{관점}와 중복 통합]` 표기.
결과를 요약하거나 누락하지 말 것. 중복 제거만 수행.

### Step 5: 팀 정리

결과 출력 완료 후:
1. 모든 팀원에게 SendMessage(type: "shutdown_request")를 보낸다.
2. 팀원들이 shutdown을 승인하면 TeamDelete로 팀을 정리한다.
