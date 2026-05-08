---
name: verify
description: 코드 검증 (compile, test, e2e) 병렬 실행 및 결과 보고. Use when (1) /verify 명령 시, (2) 코드 변경 후 검증 요청 시, (3) "컴파일", "테스트", "e2e", "검증" 언급 시
---

# Verify

코드 변경 후 컴파일, 테스트, e2e를 각각 독립된 백그라운드 에이전트로 병렬 실행하고 결과를 보고합니다.

## Workflow

### Step 1: 3개 검증 작업을 백그라운드 에이전트로 동시 실행

**반드시 Task tool의 `run_in_background=true`로 3개를 한 번에 병렬 실행합니다.**

#### 1-1. 컴파일 에이전트

```
Task tool:
  subagent_type: Bash
  run_in_background: true
  description: 컴파일 검증
  prompt: |
    다음 명령어를 실행하고 결과를 보고하세요:
    pnpm nx run-many --target=compile --projects=damoa-webview,damoa-mobile-web --parallel --outputStyle=static

    성공/실패 여부와 에러가 있으면 에러 내용을 요약해주세요.
```

#### 1-2. 테스트 에이전트

```
Task tool:
  subagent_type: Bash
  run_in_background: true
  description: 테스트 실행
  prompt: |
    다음 명령어를 실행하고 결과를 보고하세요:
    pnpm test:all --outputStyle=static

    성공/실패 여부, 실패한 테스트가 있으면 목록을 보고해주세요.
```

#### 1-3. e2e 에이전트

```
Task tool:
  subagent_type: Bash
  run_in_background: true
  description: e2e 테스트 실행
  prompt: |
    e2e 테스트를 실행합니다. pnpm start(포트 4201)가 실행 중이어야 합니다.

    먼저 포트 4201이 열려있는지 확인하세요:
    lsof -i :4201 -sTCP:LISTEN

    포트가 열려있으면 e2e를 실행하세요:
    pnpm e2e:mobile-web

    포트가 열려있지 않으면 "pnpm start가 실행되지 않아 e2e를 건너뜁니다"라고 보고하세요.

    성공/실패 여부, 실패한 테스트가 있으면 목록을 보고해주세요.
```

### Step 2: 결과 수집 및 보고

3개 에이전트가 모두 완료되면 결과를 아래 형식으로 보고합니다:

```
## 검증 결과

| 항목 | 결과 | 비고 |
|------|------|------|
| 컴파일 | PASS/FAIL | (에러 요약) |
| 테스트 | PASS/FAIL | (실패 테스트 수) |
| e2e | PASS/FAIL/SKIP | (실패 테스트 수 또는 skip 사유) |
```

실패 항목이 있으면 상세 에러 내용을 함께 표시합니다.

## 주의사항

- **e2e 명령어**: 반드시 `pnpm e2e:mobile-web`을 사용. `playwright test --project=chromium` 직접 실행 금지 (webview 테스트 포함되어 대량 실패 발생)
- **e2e 전제조건**: `pnpm start`로 개발 서버(포트 4201)가 실행 중이어야 함
- **컴파일 대상**: damoa-webview, damoa-mobile-web 두 앱 동시 검증
