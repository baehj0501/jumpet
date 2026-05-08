---
name: code-review
description: |
  코드 변경사항을 병렬로 검증하는 스킬입니다:
  - Claude Code 서브에이전트: 코드 변경의 의도/로직 검증
  - Codex exec review: 코드 품질/패턴 리뷰
  실행 전 사용자의 의도가 완전히 명확해질 때까지 반복적으로 확인합니다.
  트리거 키워드: 코드 리뷰, code review, 검증, verify, 리뷰
---

# Code Review - 병렬 코드 검증 스킬

코드 변경사항을 **Claude Code 서브에이전트**와 **Codex exec review**로 병렬 검증합니다.

## 핵심 원칙

> **에이전트 실행은 사용자의 의도가 100% 명확해진 후에만 수행합니다.**
> 애매한 부분이 조금이라도 남아 있으면 절대 에이전트를 실행하지 않습니다.

## 실행 흐름

### 1단계: 의도 파악 (최대한 한 번에 수집)

**AskUserQuestion 1회 호출(최대 4개 질문)로 필요한 정보를 최대한 수집합니다.**

```
질문 1 (header: "검증 대상"): "어떤 변경사항을 검증하고 싶으신가요?"
  - 현재 브랜치의 모든 변경사항
  - 특정 커밋의 변경사항
  - 스테이징된 변경사항만

질문 2 (header: "변경 목적"): "이 변경의 목적은 무엇인가요?"
  - 새 기능 추가
  - 버그 수정
  - 리팩토링
  - (사용자 직접 입력)

질문 3 (header: "검증 포인트", multiSelect: true): "검증 시 특별히 확인해야 할 포인트가 있나요?"
  - 비즈니스 로직 정합성
  - 타입 안전성 / 컴파일 에러
  - 성능 / 메모리 이슈
  - (사용자 직접 입력)
```

#### 애매한 부분이 있으면 재질문

응답을 분석하여 **불명확한 부분이 하나라도 있으면** AskUserQuestion을 다시 호출합니다.
명확해질 때까지 반복하며, **모든 의도가 확실해진 후에만** 다음 단계로 진행합니다.

재질문이 필요한 경우 예시:
- "특정 커밋"을 선택했지만 SHA를 안 알려준 경우
- "사용자 직접 입력" 내용이 모호한 경우
- 변경 범위가 넓어서 집중할 파일을 확인해야 하는 경우

**응답이 충분히 명확하면 재질문 없이 바로 2단계로 진행합니다.**

### 2단계: 변경사항 파악

사용자 응답에 따라 적절한 git 명령어로 변경 범위를 파악합니다:

```bash
# 브랜치 전체 변경사항
git diff origin/develop...HEAD --stat
git log origin/develop..HEAD --oneline

# 특정 커밋
git show <sha> --stat

# 스테이징된 변경사항
git diff --cached --stat
```

### 3단계: 병렬 실행

**두 에이전트를 반드시 동시에 실행합니다.**

#### 에이전트 A: Claude Code 서브에이전트 (Task tool)

Task tool로 서브에이전트를 실행합니다. 1단계에서 확정된 정보를 모두 프롬프트에 포함합니다:

```
프롬프트 구조:
---
다음 코드 변경사항을 검증해주세요.

## 변경 목적
{사용자가 확인해준 변경 목적}

## 변경된 파일
{변경 파일 목록}

## 검증 포인트
{사용자가 확정한 검증 포인트}

## 검증 항목
1. 변경 의도와 실제 코드가 일치하는지 확인
2. 누락된 엣지 케이스가 있는지 확인
3. 기존 코드와의 호환성/사이드 이펙트 확인
4. 타입 안전성 확인
5. 프로젝트 컨벤션(CLAUDE.md, vesper CLAUDE.md) 준수 여부 확인

각 항목에 대해 PASS/WARN/FAIL로 판정하고 근거를 제시해주세요.
---
```

#### 에이전트 B: Codex exec review (Bash tool, run_in_background: true)

**주의: `--base`/`--commit`/`--uncommitted` 옵션과 커스텀 프롬프트(`[PROMPT]`)는 동시에 사용할 수 없습니다.**
두 가지 실행 방식 중 상황에 맞게 선택합니다:

```bash
# 방식 1: 범위 지정 리뷰 (기본 리뷰 프롬프트 사용)
codex exec review --base develop --full-auto -o /tmp/codex-review.txt
codex exec review --commit <sha> --full-auto -o /tmp/codex-review.txt
codex exec review --uncommitted --full-auto -o /tmp/codex-review.txt

# 방식 2: 커스텀 프롬프트 리뷰 (현재 브랜치 전체 대상)
codex exec review --full-auto -o /tmp/codex-review.txt "{리뷰 지시}"
```

- `--full-auto`: 승인 없이 자동 실행 (sandbox 내)
- `-o /tmp/codex-review.txt`: 결과를 파일로 저장하여 Read tool로 확인 가능
- **권장**: 방식 1을 기본으로 사용 (범위 지정이 더 정확한 리뷰 결과를 제공)

### 4단계: 결과 종합

두 에이전트의 결과를 다음 형식으로 종합하여 사용자에게 제공합니다:

```markdown
## 코드 리뷰 결과

### 검증 요약
- **대상**: {검증 대상}
- **목적**: {변경 목적}
- **포인트**: {검증 포인트}

### Claude Code 서브에이전트 (로직 검증)
| 항목 | 판정 | 근거 |
|------|------|------|
| ... | PASS/WARN/FAIL | ... |

### Codex Review (코드 품질)
{codex review 결과 요약}

### 종합 판단
- **전체 판정**: PASS / NEEDS_ATTENTION / FAIL
- **핵심 발견사항**: ...
- **권장 조치**: ...
```

## 주의사항

- **의도 파악 우선**: 한 번에 최대한 수집하되, 애매한 부분이 있으면 재질문. 명확해진 후에만 에이전트 실행
- **병렬 실행 필수**: Task tool과 Bash tool(codex exec)을 같은 메시지에서 동시 호출
- **codex exec는 background로 실행**: `run_in_background: true`로 설정하여 Task tool과 동시 실행
- **결과 대기**: 두 에이전트 모두 완료된 후 종합 결과 제공
- **codex 기본 설정 사용**: 모델, sandbox 등은 codex config.toml 기본값 사용
