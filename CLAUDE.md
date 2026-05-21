# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 레포지토리에서 작업할 때 참고할 가이드를 제공합니다.

## 프로젝트 개요

### 한 줄 정체성

OS 데스크탑 위에 상시 떠 있는 **캐릭터(강아지)** 와, 우클릭으로 호출되는 **8개 패널** 로 구성된 Electron 기반 데스크탑 펫 게임. 단순한 마스코트가 아니라 펫 인터랙션 + 일상 도우미(메모/링크/수집) 가 결합된 형태를 지향한다.

### 사용자 가치 (왜 만드는가)

- **상시 동반자**: 화면 한 켠에 살아 있는 펫. 자율 walking, 드래그, 클릭 반응 같은 가벼운 인터랙션
- **정서적 케어**: 쓰다듬기 / 먹이 / 놀이로 펫의 감정을 변화시키는 루프 (예정)
- **일상 도우미**: 우클릭 메뉴에서 호출하는 패널이 To-Do · 링크 모음 · 아이템 · 가챠 등 일상/수집 기능을 함께 제공
- 데스크탑 펫 + 라이트 캐주얼 게임의 결합. 영감 — Tumblbug "에그덕 키우기"(방치형 클리커 데스크탑 마스코트), 다만 그 클리커/방치 루프를 그대로 베끼지는 않고 메뉴 패널 위주로 확장한다.

### 도메인 코어 — 무엇을 만드는가

| 서브시스템         | 구성                                                                                          | 비고                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 캐릭터 시스템      | 표시 / 자율 이동 / 상태 / 애니메이션 / 드래그 / 마우스 추적 / 스마트 행동                     | 현재 표시·자율 이동·드래그 구현됨                                      |
| 행동 상태          | `idle`, `walking`, (예정) `sit`, `sleep`, `jump`                                              | 확률 기반 자율 전환                                                    |
| 감정               | `default`, `happy`, `sad`, ...                                                                | 행동과 별개 축. 시각(이미지)만 결정                                    |
| 인터랙션           | 클릭 반응 / 말풍선 / 쓰다듬기 / 먹이 / 놀이                                                   | 대부분 예정                                                            |
| 패널 (우클릭 메뉴) | 🍖 먹이주기 · 🎮 놀아주기 · ✅ To-Do · 🏪 가챠 · 🎒 아이템 · 🔗 링크 관리 · 📊 정보 · ❌ 종료 | TODO만 별창으로 구현됨. 나머지는 dispatcher가 'not implemented' 로그만 |

캐릭터 × 감정은 **2차원 카탈로그** (`entities/character/assets/{characterId}/{mood}.{ext}`) 로 관리. `Record<CharacterId, Record<Mood, string>>` 타입으로 매핑 누락이 컴파일 에러로 잡힌다.

### 멀티 윈도우 아키텍처

이 앱은 단일 윈도우가 아니라 **여러 BrowserWindow 인스턴스**로 구성된다:

- **캐릭터 윈도우** (`createWindow`, `src/main/index.ts`):
    - 300×300, transparent + frameless + `alwaysOnTop('screen-saver')` + `visibleOnAllWorkspaces` — 풀스크린 앱 위에도 표시, 모든 macOS Space 따라옴
    - `focusable: false` — 펫 클릭/드래그가 뒷창 포커스를 빼앗지 않음
    - `skipTaskbar: true` — 작업표시줄/Alt+Tab 숨김
- **패널 윈도우** (`src/main/panels/`):
    - PanelId별로 main이 BrowserWindow를 직접 띄움 (싱글톤 인스턴스, 중복 방지)
    - 각 패널은 자기 HTML entry + 자기 renderer 진입점을 가짐 (예: `src/renderer/todo.html` → `pages/todo/main.tsx`)
    - `electron.vite.config.ts`의 rollup `input`에 신규 패널 추가 시 entry를 등록
    - 새 패널 추가 흐름: PanelId union 확장 → `src/main/panels/open{Name}Panel.ts` 작성 → `panels/index.ts`의 `openPanel` switch 등록 → `renderer/{name}.html` + `pages/{name}/` entry 추가

### 폴더 아키텍처 (FSD-lite + Electron 3-tier)

```
src/
├── main/                       # Electron main process
│   ├── index.ts                # 캐릭터 윈도우 생성 + 공통 IPC 핸들러
│   ├── menu/                   # 우클릭 메뉴 정의
│   └── panels/                 # 패널 디스패처 (PanelId → BrowserWindow)
├── preload/                    # window.api 노출, IPC 브릿지
└── renderer/
    ├── index.html              # 캐릭터 윈도우 entry
    ├── todo.html               # TODO 패널 별창 entry (패널 추가 시 늘어남)
    └── src/
        ├── app/                # 진입점, 글로벌 스타일
        ├── pages/              # 각 패널의 페이지 컴포넌트 (별창 entry용)
        ├── entities/           # 도메인 모델 + 핵심 UI (character/, todo/, ...)
        └── features/           # 사용자 인터랙션 (drag/, context-menu/, ...)
```

- `shared/` 레이어는 **필요해질 때만** 추가 (FSD-lite 원칙: 빈 layer를 미리 만들지 않음).
- 의존 방향: `shared → entities → features → widgets → app/pages`. 역방향 import 금지.
- 각 slice는 `index.ts` barrel로 public API만 노출.

### 핵심 설계 결정 (이미 합의된 것)

- **윈도우 모델 A 채택**: 캐릭터를 화면에서 옮기는 방식으로 OS 레벨 윈도우 자체를 `setPosition`으로 이동. 풀스크린 transparent overlay는 쓰지 않음 — 이유: 우클릭 메뉴 호출에 필요한 contextmenu 이벤트가 정상 동작하고, 다른 앱 클릭이 자연스럽게 통과됨.
- **자율 행동 일시정지**: `isInteractingRef` 단일 채널. 드래그 + 컨텍스트 메뉴 둘 다 같은 ref를 토글. behaviors hook은 read-only(`{ readonly current: boolean }`)로 받음 — write 권한은 features 계층에만.
- **빌드 타임 에셋**: 런타임에서 사용자가 이미지를 추가하지 않음. 배포 시 번들에 포함. 미래에 GIF/WebP 도입 시에도 동일 카탈로그 구조.
- **상태 머신 캡슐화**: `useStateMachine`이 raw `setState`가 아닌 의미 단위 액션(`interrupt`)만 노출.
- **영속 데이터의 SSOT**: 여러 윈도우가 봐야 하는 영속 데이터(점수, 잠금해제 등)는 **main 프로세스가 SSOT** — `electron-store`로 영속화하고 IPC로 broadcast. renderer는 **Zustand 글로벌 store**로 캐시(`entities/player/`가 첫 예시). 한 별창 안에서만 쓰는 영속 데이터(`entities/todo/`)는 별창 로컬 `useState + localStorage` hook으로 처리 — 도메인 범위에 따라 도구가 갈린다.
- **CSS 정책**: 비즈니스 UI는 emotion `css` prop, 글로벌 기본은 `base.css`. Tailwind/styled-components 미사용.
- **포매팅**: Prettier (`tabWidth: 4`, `semi: false`, `singleQuote: true`, `singleAttributePerLine: true`).

### 작업 시 우선 확인할 파일

| 영역                    | 파일                                                                        |
| ----------------------- | --------------------------------------------------------------------------- |
| 캐릭터 윈도우 생성·옵션 | `src/main/index.ts`                                                         |
| 우클릭 메뉴 정의        | `src/main/menu/characterContextMenu.ts`                                     |
| 패널 디스패처           | `src/main/panels/index.ts`, `src/main/panels/openTodoPanel.ts`              |
| 캐릭터 상태/행동        | `src/renderer/src/entities/character/behaviors/`                            |
| 캐릭터 카탈로그         | `src/renderer/src/entities/character/assets/index.ts`, `model/Character.ts` |
| 플레이어 재화 (main SSOT) | `src/main/playerState/`                                                    |
| 플레이어 재화 (renderer)  | `src/renderer/src/entities/player/`                                        |
| 드래그/메뉴 인터랙션    | `src/renderer/src/features/`                                                |
| App 조립부              | `src/renderer/src/app/App.tsx`                                              |
| 새 패널 entry 등록      | `electron.vite.config.ts` (rollupOptions.input), `src/renderer/{name}.html` |

## 개발 컨벤션

### 코드 수정 원칙

- 무엇이든 수정하기 전에, 호출/참조 경로를 포함하여 관련 파일을 처음부터 끝까지 읽는다.
- 작업, 커밋, PR을 작게 유지한다.
- 가정을 했다면 Issue/PR/ADR에 기록한다.
- 비밀값을 커밋하거나 로그에 남기지 않는다; 모든 입력을 검증하고 출력은 인코딩/정규화한다.
- 섣부른 추상화를 피하고 의도를 드러내는 이름을 사용한다.
- 결정하기 전에 최소 두 가지 대안을 비교한다.

## 네이밍 컨벤션

### 기본 원칙

- **명확하고 읽기 쉬운 네이밍**: 누구나 이해할 수 있는 명확한 이름 사용
- **축약어 금지**: 약어 대신 완전한 단어 사용 (`btn` → `button`, `usr` → `user`)
- **복수/단수 명확히 구분**: 배열/리스트는 복수형, 단일 객체는 단수형

### 상수명 네이밍

- **글로벌 상수**: 대문자 스네이크케이스 (`BANNER_STATUS`, `API_ENDPOINTS`)
- **로컬 상수**: camelCase (`bannerStatus`, `userInfo`)
- **enum 타입**: PascalCase (`BannerStatus`, `UserRole`)
- **enum 값**: 대문자 스네이크케이스 (`PUBLISHED`, `DRAFT`)

### 금지 사항

- 축약어 사용
- 모호한 이름 (`data`, `info`, `temp`)
- 복수/단수 혼용
- 일관성 없는 네이밍

## 컨텍스트 원장 관리

- TodoWrite로 실시간 상태 추적:
    - **발견된 모든 에러/경고 (하나씩 TodoWrite에 등록하고 순차적으로 해결)**
    - 수락/거부된 결정사항
    - 다음 마이크로 태스크
- 해결 즉시 삭제/보관 처리

## 개발 가이드라인

### Frontend 기본 원칙 및 패턴

- **Frontend Fundamentals (코드 품질 4원칙)**: [docs/frontend-fundamentals/README.md](docs/frontend-fundamentals/README.md)

## Skill 사용 가이드

### 🚨 절대 규칙: 직접 명령어 실행 금지

아래 명령어는 **직접 실행 금지**, 반드시 Skill 도구로 호출:

| ❌ 금지 (직접 실행)         | ✅ 대신 사용 (Skill)     |
| --------------------------- | ------------------------ |
| `git commit ...`            | `/commit`                |
| `git push` + `gh pr create` | `/pr-description-simple` |
