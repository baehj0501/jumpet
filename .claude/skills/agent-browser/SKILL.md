---
name: agent-browser
description: "agent-browser CLI로 브라우저 자동화 (스크린샷, 네비게이션, 클릭, 입력). Use when: 화면 확인, 스크린샷, UI 테스트, 브라우저 디버깅이 필요할 때"
---

# agent-browser CLI

`agent-browser` (vercel-labs/agent-browser)를 사용하여 브라우저를 제어합니다. Playwright 기반의 빠른 브라우저 자동화 CLI 도구입니다.

## Ports Reference

각 앱의 포트 번호는 프로젝트 루트의 `.envrc` 파일을 참고하세요. 아래 문서에서 `{port}`로 표기된 부분은 대상 앱에 맞는 포트로 치환하여 사용합니다.

## 사전 준비

별도 서버 시작이 필요 없습니다. 명령어를 바로 실행할 수 있습니다.

```bash
# 설치 확인
which agent-browser

# 설치가 안 되어 있다면
npm install -g @anthropic-ai/agent-browser
```

## 프로필 (로그인 세션 유지)

**항상 `--profile` 옵션을 사용하세요.** 로그인 세션이 프로필에 저장되어 재로그인이 불필요합니다.

```bash
# 퀸잇 고객 웹 프로필 (필수 사용)
agent-browser --profile ~/.agent-browser/queenit-customer open "http://localhost:{port}/..."

# headed 모드 + 프로필
agent-browser --headed --profile ~/.agent-browser/queenit-customer open "http://localhost:{port}/..."
```

- 프로필 경로: `~/.agent-browser/queenit-customer`
- 최초 1회 로그인 후 세션이 프로필에 저장됨
- 이후 브라우저를 닫고 다시 열어도 로그인 유지

## Commands

### Navigate (페이지 이동)

```bash
agent-browser open "http://localhost:{port}/"
```

이동 후 스크린샷:
```bash
agent-browser open "http://localhost:{port}/" && sleep 2 && agent-browser screenshot /tmp/page.png
```

### Screenshot (화면 캡처)

**스크린샷 저장 규칙**: `{프로젝트루트}/tmp/{구분자}/` 경로에 저장합니다.
- 프로젝트 루트: `/Users/kangho/rapportlabs/damoa-customer-web`
- 구분자: `{작업목적}-{MMDD-HHmm}` 형식 (예: `sort-bottomsheet-0305-1712`)
  - 실행마다 타임스탬프가 달라지므로 이전 결과와 충돌하지 않음
- 디렉토리가 없으면 `mkdir -p`로 생성

```bash
# 구분자 생성 예시
SCREENSHOT_DIR="/Users/kangho/rapportlabs/damoa-customer-web/tmp/sort-bottomsheet-$(date +%m%d-%H%M)"
mkdir -p "$SCREENSHOT_DIR"

# 스크린샷 저장
agent-browser screenshot "$SCREENSHOT_DIR/before-open.png"

# 전체 페이지 캡처
agent-browser screenshot --full "$SCREENSHOT_DIR/full-page.png"
```

스크린샷 파일을 확인하려면 Read tool 사용:
```
Read: {SCREENSHOT_DIR}/before-open.png
```

### Snapshot (요소 목록 = 접근성 트리)

```bash
# 전체 요소
agent-browser snapshot

# 인터랙티브 요소만 (버튼, 입력, 링크 등)
agent-browser snapshot -i

# 간결하게 (빈 구조 요소 제거)
agent-browser snapshot -i -c

# 특정 CSS 셀렉터 범위로 제한
agent-browser snapshot -s ".product-detail"
```

특정 요소만 필터링:
```bash
agent-browser snapshot -i 2>&1 | grep -E "장바구니|구매|버튼"
```

**출력 예시**:
```
- button "장바구니 담기" [ref=e49]
- button "바로 구매" [ref=e53]
- link "상품 상세" [ref=e90]
```

### Click (요소 클릭)

```bash
# ref로 클릭 (@ref 형식)
agent-browser click @e49

# CSS 셀렉터로 클릭
agent-browser click "button:has-text('장바구니 담기')"
```

클릭 후 스크린샷:
```bash
agent-browser click @e49 && sleep 1 && agent-browser screenshot /tmp/after-click.png
```

### Fill (텍스트 입력)

```bash
# ref로 입력 필드에 값 입력 (기존 값 지우고 입력)
agent-browser fill @e123 "test-value"

# CSS 셀렉터로 입력
agent-browser fill "input[placeholder='검색어를 입력해주세요']" "원피스"
```

### Type (타이핑)

```bash
# fill과 달리 기존 값을 유지하고 추가 입력
agent-browser type @e123 "추가 텍스트"
```

### Press (키 입력)

```bash
agent-browser press Enter
agent-browser press Tab
agent-browser press Control+a
```

### Select (드롭다운 선택)

```bash
agent-browser select @e90 "인기순"
```

### Check / Uncheck (체크박스)

```bash
agent-browser check @e56
agent-browser uncheck @e56
```

### Scroll (스크롤)

```bash
# 아래로 스크롤
agent-browser scroll down 500

# 위로 스크롤
agent-browser scroll up 300

# 특정 요소가 보이도록 스크롤
agent-browser scrollintoview @e200
```

### Viewport (뷰포트 크기)

```bash
# 모바일 웹 권장 크기 (iPhone SE 기준)
agent-browser set viewport 375 667

# 모바일 웹 권장 크기 (iPhone 14 기준)
agent-browser set viewport 390 844

# 데스크톱 확인이 필요한 경우
agent-browser set viewport 1920 1080
```

> **참고**: damoa-mobile-web과 damoa-webview는 모바일 환경이 주 타겟이므로, 뷰포트를 모바일 크기로 설정하는 것을 권장합니다.

### Get (요소 정보 가져오기)

```bash
# 요소의 텍스트 가져오기
agent-browser get text @e123

# 요소의 값 가져오기
agent-browser get value @e123

# 페이지 제목
agent-browser get title

# 현재 URL
agent-browser get url
```

### Is (상태 확인)

```bash
# 요소 표시 여부
agent-browser is visible @e123

# 활성화 여부
agent-browser is enabled @e123

# 체크 여부
agent-browser is checked @e56
```

### Eval (JavaScript 실행)

```bash
agent-browser eval "document.title"
agent-browser eval "navigator.clipboard.readText()"
```

### Console (콘솔 로그)

```bash
agent-browser console
agent-browser console --clear
```

### Tab (탭 관리)

```bash
agent-browser tab list
agent-browser tab new
agent-browser tab close
agent-browser tab 2   # 2번 탭으로 전환
```

## 서브에이전트 위임 패턴

### 프롬프트 작성 원칙

0. **팀원 생성 전 개발 서버 확인 (메인에서 실행)**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:{port}/` 로 200 응답 확인. 서버가 꺼져 있으면 팀원에게 시키지 말고 먼저 `pnpm start` 실행
1. **`agent-browser --help` 먼저 실행 지시**: Chrome MCP와 혼동 방지 (팀원이 Chrome MCP를 사용하려는 문제 방지)
2. **접근 URL을 명확히 지정**: `http://localhost:{port}/[정확한경로]` 형태로 제공 (팀원이 URL을 추측하지 않도록)
3. **API 서버 전환 포함**: 테스트 환경(STG/PROD 등)에 맞는 서버 전환 명령어를 사전 준비에 포함
4. **코드 변경 반영 시 리로드 포함**: HMR이 즉시 반영되지 않을 수 있으므로 `location.reload()` 명시
5. **뷰포트를 모바일 크기로 지정** (375x667 또는 390x844)
6. **검증 포인트를 구체적으로 명시**: 기대하는 UI 상태를 표로 정리
7. **초기 프롬프트를 충분히 상세하게**: 재요청을 최소화하도록 한 번에 모든 정보를 제공
8. **스크린샷은 절대 경로로 저장**

### 프롬프트 템플릿

```
agent-browser CLI를 사용하여 [화면명]에서 [기능]이 제대로 동작하는지 테스트해주세요.

## 사전 준비
1. 먼저 `agent-browser --help`를 실행하여 사용법을 파악하세요.
2. 반드시 `--profile ~/.agent-browser/queenit-customer` 옵션을 사용하세요.
3. 뷰포트를 모바일 크기(390x844)로 설정하세요.
4. API 서버를 [환경]으로 전환하세요:
   ```bash
   agent-browser --profile ~/.agent-browser/queenit-customer open "[접근 URL]"
   sleep 3
   agent-browser --profile ~/.agent-browser/queenit-customer eval "[서버 전환 명령어]"
   agent-browser --profile ~/.agent-browser/queenit-customer eval "location.reload()"
   sleep 3
   ```

## 접근 URL
`http://localhost:{port}/[정확한 경로와 쿼리 파라미터]`

## 테스트 시나리오

### 시나리오 1: [시나리오 제목]
1. `[접근 URL]` 페이지로 이동
2. 스크린샷 촬영
3. [구체적 액션]
4. **검증**: [기대하는 상태]

### 주의사항
- 스크린샷은 절대 경로로 저장 (예: /Users/kangho/rapportlabs/damoa-customer-web/tmp/test.png)
- 각 단계마다 스크린샷으로 확인
- snapshot -i 에서 [disabled] 속성 유무로 비활성화 검증
- 코드 변경이 반영되지 않은 것 같으면 `agent-browser eval "location.reload()" && sleep 3` 실행

### 결과 보고 (필수)
검증 완료 후 반드시 아래 두 가지를 team-lead에게 SendMessage로 보고:

1. **검증 결과**: 각 항목별 PASS/FAIL + 스크린샷 경로
2. **SKILL 개선 피드백**: 작업 중 겪은 문제점을 솔직하게 보고
   - SKILL.md 가이드에서 부족했거나 잘못된 부분
   - 실제 실행 시 예상과 다르게 동작한 부분
   - 추가되면 좋을 가이드/팁
   - 프롬프트에서 개선이 필요한 부분
```

## 검증 테크닉

### 원칙: snapshot 우선, 스크린샷은 증거용

- **검증**: `agent-browser snapshot -i`로 요소 존재 여부, disabled 상태를 프로그래밍적으로 검증
- **증거**: 스크린샷은 시나리오당 1장만 촬영 (레이아웃, 색상 등 시각적 확인용)

### Disabled 상태 확인

```bash
agent-browser snapshot -i 2>&1 | grep -E "disabled"
# 출력: checkbox [disabled] [ref=e90]
```

### 요소 존재 여부 확인

```bash
# 존재해야 하는 경우
agent-browser snapshot -i 2>&1 | grep "장바구니 담기"
# 결과 있으면 PASS

# 존재하면 안 되는 경우 — 결과 없으면 PASS
```

### 요소 상태 확인 (is 커맨드)

```bash
agent-browser is visible @e123   # 표시 여부
agent-browser is enabled @e123   # 활성화 여부
agent-browser is checked @e56    # 체크 여부
```

### 텍스트/값 확인

```bash
agent-browser get text @e123
agent-browser get value @e123
```

### 클립보드 확인 (복사 기능 테스트)

```bash
# 복사 버튼 클릭 후
agent-browser click @e58
# 클립보드 값 확인
agent-browser eval "navigator.clipboard.readText()"
```

## API 응답 확인 (console.log 패턴)

agent-browser는 네트워크 응답 본문을 직접 조회하는 기능이 없습니다. API 응답 데이터를 확인하려면 **임시 console.log를 코드에 추가**한 뒤 `agent-browser console`로 읽는 방식을 사용합니다.

### 절차

```bash
# 1) 확인하려는 훅/함수에 임시 console.log 추가 (고유 태그 필수)
#    예: console.log('[DEBUG_TAG]', JSON.stringify(data?.tagAggregations))

# 2) 콘솔 초기화 → 페이지 리로드 → 대기
agent-browser console --clear && agent-browser reload && sleep 4

# 3) 태그로 필터링하여 확인
agent-browser console 2>&1 | grep "DEBUG_TAG"

# 4) 확인 후 console.log 제거
```

### 주의사항
- `reload`/`open`은 JS 컨텍스트를 초기화하므로, `eval`로 fetch를 가로채는 방식은 동작하지 않습니다
- 고유 태그(예: `[DEBUG_TAG]`)를 반드시 사용하여 다른 로그와 구분합니다
- **확인 후 임시 console.log를 반드시 제거합니다**

---

## Feature Flag (GrowthBook) Override

비프로덕션 환경에서 localStorage `ff_override` 키로 Feature Flag를 override 합니다.

1. 먼저 `libs/feature-flag/src/lib/damoa/DamoaDefinitions.ts`에서 대상 flag key와 타입을 확인합니다.
2. **`{flagKey}`에는 DamoaDefinitions.ts의 property name(snake_case)을 그대로 사용합니다.** (예: `is_combine_plp_test_group`, camelCase 아님)
3. 해당 key를 아래 명령어에 사용합니다.

```bash
# 현재 override 확인
agent-browser eval "JSON.parse(localStorage.getItem('ff_override') || '{}')"

# Boolean flag 설정 (예: DamoaDefinitions의 is_combine_plp_test_group)
agent-browser eval "const c=JSON.parse(localStorage.getItem('ff_override')||'{}');c.{flagKey}=true;localStorage.setItem('ff_override',JSON.stringify(c))"

# A/B 테스트 flag 설정 (예: DamoaDefinitions의 purchase_stamp_experiment)
# 값: original, variantA, variantB, variantC, variantD
agent-browser eval "const c=JSON.parse(localStorage.getItem('ff_override')||'{}');c.{flagKey}='variantA';localStorage.setItem('ff_override',JSON.stringify(c))"

# 특정 flag 제거
agent-browser eval "const c=JSON.parse(localStorage.getItem('ff_override')||'{}');delete c.{flagKey};localStorage.setItem('ff_override',JSON.stringify(c))"

# 전체 초기화
agent-browser eval "localStorage.setItem('ff_override','{}')"

# 변경 후 새로고침 필수
agent-browser eval "location.reload()" && sleep 2
```

---

## API 서버 전환

비프로덕션 환경에서 Cookie `basePath` + localStorage `basePath`를 설정하여 API 서버를 전환합니다.

```bash
# 현재 API 서버 확인
agent-browser eval "document.cookie.split(';').find(c=>c.trim().startsWith('basePath='))"

# DEV 서버로 전환
agent-browser eval "document.cookie='basePath=https://api.dev.queenit.kr;path=/';localStorage.setItem('basePath','https://api.dev.queenit.kr')"
agent-browser eval "location.reload()" && sleep 3

# STG 서버로 전환
agent-browser eval "document.cookie='basePath=https://damoa-app-api.stg.damoa.rapportlabs.dance;path=/';localStorage.setItem('basePath','https://damoa-app-api.stg.damoa.rapportlabs.dance')"
agent-browser eval "location.reload()" && sleep 3

# PROD 서버로 전환
agent-browser eval "document.cookie='basePath=https://api.queenit.kr;path=/';localStorage.setItem('basePath','https://api.queenit.kr')"
agent-browser eval "location.reload()" && sleep 3

# NS (네임스페이스) 서버로 전환 ({namespace} 부분을 실제 이름으로 치환)
agent-browser eval "document.cookie='basePath=https://{namespace}-app-api.dev.damoa.rapportlabs.cloud;path=/';localStorage.setItem('basePath','https://{namespace}-app-api.dev.damoa.rapportlabs.cloud')"
agent-browser eval "location.reload()" && sleep 3
```

---

## Vesper 컴포넌트 팁

damoa-customer-web은 Vesper 디자인 시스템을 사용합니다. 다음 사항에 유의하세요:

- **DamoaBottomSheet**: 나타날 때까지 `sleep 1` 또는 반복 snapshot으로 확인
- **DamoaModal**: 모달이 열리면 snapshot으로 내부 요소 확인
- **DamoaSnackbar**: 일시적으로 표시되므로 빠르게 스크린샷 촬영
- **DamoaButton**: `snapshot -i`로 버튼 목록 확인, ref로 클릭
- **탭/필터**: `snapshot -i`로 현재 선택된 탭 확인 후 원하는 탭 클릭

## 주의사항

- **스크린샷은 절대 경로로 저장**: agent-browser는 자체 세션의 작업 디렉토리를 사용하므로 상대 경로가 예상과 다를 수 있음
- **별도 서버 불필요**: 명령어를 바로 실행 가능
- **Headless 기본**: 브라우저 창을 보려면 `--headed` 옵션 추가
- **개발 서버가 실행 중이어야 합니다**: `pnpm start` (mobile-web) 또는 `pnpm start:webview` (webview)
- `snapshot`으로 얻은 `ref`는 `@ref` 형식으로 사용 (예: `@e49`)
- 동일한 이름의 버튼이 여러 개일 때 `ref`로 구분하여 클릭
- **모바일 뷰포트**: 테스트 시 반드시 모바일 크기 뷰포트를 설정할 것 (375x667 또는 390x844)
