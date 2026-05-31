# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 레포지토리에서 작업할 때 참고할 가이드를 제공합니다.

## 🚨 작업 전에 docs/를 먼저 읽는다 (CRITICAL)

이 레포의 **도메인 컨텍스트·기능 명세·미정 사항**은 [`docs/`](./docs/) 폴더에 정리되어 있다. 코드만 보고 추측하지 말고, 작업 전에 관련 문서를 먼저 확인한다.

| 상황 | 먼저 읽을 문서 |
|---|---|
| 프로젝트 정체성·방향성 헷갈릴 때 | [`docs/project-overview.md`](./docs/project-overview.md) |
| 새 도메인·새 패널·새 IPC 추가 시 | [`docs/architecture.md`](./docs/architecture.md) |
| 특정 기능 구현/변경 (예: 가챠, 운세, TODO 등) | [`docs/features/{기능}.md`](./docs/features/) |
| 기능 목록 / 도메인 간 의존성 / 구현 권장 순서 | [`docs/features/README.md`](./docs/features/README.md) |

**작업 중 명세가 바뀌거나 Open Question이 풀리면 해당 docs를 갱신한다.** docs는 *변하지 않는 명세*만 담는다 — 구현 진행률·진척 상태는 적지 않는다(그건 코드/git가 안다). 코드와 docs가 어긋나면 *코드가 진실*이라고 가정하고 docs를 업데이트한다.

이 CLAUDE.md는 컨벤션·작업 우선순위·금지 사항을 다루고, **상세 기능 명세는 docs/에 산다**.

## 프로젝트 개요

### 한 줄 정체성

OS 데스크탑 위에 상시 떠 있는 **캐릭터(강아지)** 와, 우클릭하면 열리는 **탭형 통합 메뉴 창**(돌봄·할일·운세·가챠 동작 + 일정·아이템·유튜브·설정 placeholder)으로 구성된 Electron 기반 데스크탑 펫 게임. 단순한 마스코트가 아니라 펫 인터랙션 + 일상 도우미 + 가벼운 수집/가챠 루프 가 결합된 형태를 지향한다. **우클릭은 네이티브 드롭다운이 아니라 픽셀아트 테마의 탭 창 하나를 연다**(별창 패턴·링크 기능은 폐기됨). 메뉴 구조 상세는 [`docs/features/context-menu.md`](./docs/features/context-menu.md).

### 사용자 가치 (왜 만드는가)

- **상시 동반자**: 화면 한 켠에 살아 있는 펫. 자율 walking, 드래그, 클릭 반응 같은 가벼운 인터랙션
- **정서적 케어**: 쓰다듬기 / 먹이 / 놀이로 펫의 감정을 변화시키는 루프 (예정)
- **일상 도우미**: 우클릭 메뉴에서 호출하는 패널이 To-Do · 링크 모음 · 아이템 · 가챠 등 일상/수집 기능을 함께 제공
- 데스크탑 펫 + 라이트 캐주얼 게임의 결합. 영감 — Tumblbug "에그덕 키우기"(방치형 클리커 데스크탑 마스코트), 다만 그 클리커/방치 루프를 그대로 베끼지는 않고 메뉴 패널 위주로 확장한다.

### 도메인 코어 — 무엇을 만드는가

| 서브시스템         | 구성                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| 캐릭터 시스템      | 표시 / 자율 이동 / 상태 / 애니메이션 / 드래그 / 마우스 추적 / 스마트 행동                                  |
| 행동 상태          | 현재 `idle`, `walking` 2종 — 확률 기반 자율 전환 (`sit`·`sleep`·`jump`는 향후 확장 예정)                   |
| 감정               | `default`, `happy`, `sad`, ... — 행동과 별개 축, 시각(이미지)만 결정                                       |
| 인터랙션           | 클릭 반응 / 말풍선 / 쓰다듬기 / 먹이 / 놀이                                                                |
| 패널 (우클릭 메뉴) | 🍖 먹이주기 · 🎮 놀아주기 · ✅ To-Do · 🏪 가챠 · 🎒 아이템 · 🔗 링크 관리 · 📊 정보 ⎯ 구분선 ⎯ 🔗 즐겨찾기 바 표시(체크박스 토글) ⎯ 구분선 ⎯ ❌ 종료 (코드 기준 메뉴 구성. 운세는 미연결) |

캐릭터 × 감정은 **2차원 카탈로그** (`entities/character/assets/{characterId}/{mood}.{ext}`) 로 관리. `Record<CharacterId, Record<Mood, string>>` 타입으로 매핑 누락이 컴파일 에러로 잡힌다.

### 멀티 윈도우 아키텍처

이 앱은 **딱 두 종류의 BrowserWindow**로 구성된다:

- **캐릭터 윈도우** (`createWindow`, `src/main/index.ts`):
    - 300×300, transparent + frameless. **일반 창 z-order** — always-on-top을 쓰지 않아, 클릭하면 앞으로 나오고 다른 앱/창을 클릭하면 그 아래로 깔린다(다른 앱처럼).
    - (과거 `alwaysOnTop('screen-saver')` + `visibleOnAllWorkspaces` + `focusable:false`는 제거됨 — 사용자 요청으로 일반 창 동작 채택.)
    - `skipTaskbar: true`, `fullscreenable: false`.
- **통합 메뉴 창** (`src/main/panels/openMenuPanel.ts`):
    - 우클릭 시 열리는 **frameless 싱글톤 창**. 네이티브 드롭다운을 대체.
    - 모든 기능이 이 한 창의 **탭**으로 산다 (별창 패턴 폐기). entry: `renderer/menu.html` → `pages/menu/main.tsx` → `MenuPage`(타이틀바 + 탭바 + 탭 전환).
    - 탭: 돌봄/할일/운세/가챠 **동작**, 일정/아이템/유튜브/설정 **placeholder**. 탭 컴포넌트는 `pages/menu/tabs/`.
    - 비주얼: JUMPET_4 `menu.html` 픽셀아트 테마 이식 — `app/styles/pixel-theme.css`(Galmuri11 폰트 + 6종 테마 CSS 변수 + 셸/컴포넌트 클래스). 이 창은 emotion css prop이 아니라 **className 기반 CSS**를 쓴다(예외).
    - 우클릭 IPC: `window:showContextMenu` → `openMenuPanel()` (`src/main/menu/ipc.ts`). 통합 창은 캐릭터와 별개라 자율 행동을 멈추지 않는다(`menu:state` 신호 제거).
    - 새 탭 추가 흐름: 도메인 SSOT(필요 시) → `pages/menu/tabs/{Name}Tab.tsx` → `MenuPage`의 `TABS`/`renderTab()` 등록. (별창·html·vite input 추가 불필요.)

> **폐기됨**: 링크 도메인·링크 미니 바(`linkBar`)·'즐겨찾기 바 표시' 토글, 그리고 기능별 별창(todo/fortune/care/gacha.html + `open{Name}Panel`). 모두 통합 탭 창으로 흡수.

### 폴더 아키텍처 (FSD-lite + Electron 3-tier)

```
src/
├── main/                       # Electron main process
│   ├── index.ts                # 캐릭터 윈도우 생성 + IPC 등록 + 부수효과 조립
│   ├── window/                 # 윈도우 위치·크기 IPC (드래그, 자율 이동)
│   ├── menu/                   # 우클릭 IPC → 통합 메뉴 창 열기
│   ├── panels/                 # openMenuPanel (통합 메뉴 창 싱글톤)
│   ├── playerState/            # 점수 도메인 (SSOT)
│   ├── todo/                   # TODO 도메인 (SSOT)
│   ├── fortune/                # 운세 도메인 (SSOT)
│   └── item/                   # 소모성 아이템 인벤토리 + 뽑기 도메인 (SSOT)
├── preload/                    # window.api 노출, IPC 브릿지
├── shared/
│   └── contracts/              # main↔preload↔renderer가 공유하는 타입·시드
└── renderer/
    ├── index.html              # 캐릭터 윈도우 entry
    ├── menu.html               # 통합 메뉴 창 entry
    └── src/
        ├── app/                # 진입점, 글로벌 스타일, pixel-theme.css(+fonts)
        ├── pages/menu/         # 통합 메뉴 창 (MenuPage + tabs/)
        ├── entities/           # 도메인 모델 + store (character/, todo/, player/, fortune/, item/)
        └── features/           # 사용자 인터랙션 (drag/, context-menu/)
```

- renderer의 FSD `shared/` 레이어(= `renderer/src/shared/`)는 **필요해질 때만** 추가 (FSD-lite 원칙: 빈 layer를 미리 만들지 않음). 위 트리의 `src/shared/contracts/`는 이것과 별개로, main↔renderer가 공유하는 Electron 타입 계약 레이어다.
- 의존 방향: `shared → entities → features → widgets → app/pages`. 역방향 import 금지.
- 각 slice는 `index.ts` barrel로 public API만 노출.

### 핵심 설계 결정 (이미 합의된 것)

- **윈도우 모델 A 채택**: 캐릭터를 화면에서 옮기는 방식으로 OS 레벨 윈도우 자체를 `setPosition`으로 이동. 풀스크린 transparent overlay는 쓰지 않음 — 이유: 우클릭 메뉴 호출에 필요한 contextmenu 이벤트가 정상 동작하고, 다른 앱 클릭이 자연스럽게 통과됨.
- **자율 행동 일시정지**: `isInteractingRef` 단일 채널. 드래그 + 컨텍스트 메뉴 둘 다 같은 ref를 토글. behaviors hook은 read-only(`{ readonly current: boolean }`)로 받음 — write 권한은 features 계층에만.
- **빌드 타임 에셋**: 런타임에서 사용자가 이미지를 추가하지 않음. 배포 시 번들에 포함. 미래에 GIF/WebP 도입 시에도 동일 카탈로그 구조.
- **상태 머신 캡슐화**: `useStateMachine`이 raw `setState`가 아닌 의미 단위 액션(`interrupt`)만 노출.
- **영속 데이터의 SSOT**: 모든 사용자 영속 데이터(점수, TODO, 운세, 아이템 등)는 **main 프로세스가 SSOT** — `electron-store`로 영속화하고 IPC로 모든 윈도우에 broadcast. renderer는 **Zustand 글로벌 store**로 read-only 캐시. 도메인별 패턴은 동일: 타입·시드는 `@shared/contracts/{domain}Events.ts`에 두고, `src/main/{domain}/{domain}State.ts`(순수 reducer) + `store.ts`(electron-store wrapper) + `ipc.ts`(handle + broadcast) + `index.ts`(barrel). renderer는 `entities/{domain}/model/use{Domain}Store.ts`(Zustand). **동기화는 모듈 import 사이드이펙트로 시작하지 않는다** — 각 윈도우 entrypoint(`pages/menu/main.tsx`, `app/main.tsx`)에서 `initialize{Domain}Sync()`를 1회 명시 호출한다(통합 메뉴 창은 여러 도메인 sync를 한 번에 호출). HMR listener 누적은 `import.meta.hot.dispose`로 방어.
- **CSS 정책**: 비즈니스 UI는 emotion `css` prop, 글로벌 기본은 `base.css`. Tailwind/styled-components 미사용.
- **포매팅**: Prettier (`tabWidth: 4`, `semi: false`, `singleQuote: true`, `singleAttributePerLine: true`).

### 작업 시 우선 확인할 파일

| 영역                    | 파일                                                                        |
| ----------------------- | --------------------------------------------------------------------------- |
| 캐릭터 윈도우 생성·옵션 | `src/main/index.ts`                                                         |
| 우클릭 IPC → 메뉴 창    | `src/main/menu/ipc.ts`, `src/main/panels/openMenuPanel.ts`                  |
| 통합 메뉴 창 (셸·탭)    | `src/renderer/src/pages/menu/` (`MenuPage.tsx`, `tabs/`)                    |
| 픽셀 테마·폰트          | `src/renderer/src/app/styles/pixel-theme.css`, `styles/fonts/`             |
| 캐릭터 상태/행동        | `src/renderer/src/entities/character/behaviors/`                            |
| 캐릭터 카탈로그         | `src/renderer/src/entities/character/assets/index.ts`, `model/Character.ts` |
| 플레이어 재화 (main/renderer) | `src/main/playerState/`, `src/renderer/src/entities/player/`          |
| TODO (main/renderer)    | `src/main/todo/`, `src/renderer/src/entities/todo/`                         |
| 운세 (main/renderer)    | `src/main/fortune/`, `src/renderer/src/entities/fortune/`                   |
| 소모 아이템·뽑기 (main/renderer) | `src/main/item/`, `src/renderer/src/entities/item/`               |
| 윈도우 위치/크기 IPC    | `src/main/window/`                                                          |
| 드래그/메뉴 인터랙션    | `src/renderer/src/features/`                                                |
| App 조립부              | `src/renderer/src/app/App.tsx`                                              |
| 새 탭 추가              | `pages/menu/tabs/{Name}Tab.tsx` + `MenuPage` TABS/renderTab (별창·entry 불필요) |

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
