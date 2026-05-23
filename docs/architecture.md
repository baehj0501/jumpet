# 기술 아키텍처

이 문서는 코드가 그렇게 생긴 *이유*를 설명한다. 무엇이 어디 있는지는 코드를 봐야 하지만, *왜 거기 있나*는 여기에 있다.

## 0. 큰 그림

```
┌─ Electron App ──────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─ main process (Node.js, SSOT) ─────────────────────────────────────┐ │
│  │   - 모든 영속 데이터(점수·TODO 등)의 단일 진실의 원천              │ │
│  │   - electron-store로 디스크 영속화 (userData/config.json)          │ │
│  │   - IPC handler + broadcast로 renderer들과 동기화                  │ │
│  │   - 메뉴/패널/윈도우 라이프사이클 통제                              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                            ↕ IPC (contextBridge)                         │
│  ┌─ preload (각 BrowserWindow마다) ──────────────────────────────────┐ │
│  │   - window.api로 IPC를 안전하게 노출                                │ │
│  │   - 타입은 @shared/contracts에서 공유                              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                            ↕                                             │
│  ┌─ renderer (BrowserWindow별 별개 프로세스) ─────────────────────────┐ │
│  │   캐릭터 윈도우 | TODO 별창 | (가챠 별창) | (운세 별창) | ...      │ │
│  │   - 각자 React tree + Zustand store                                │ │
│  │   - main 데이터의 read-only 미러                                   │ │
│  │   - 사용자 액션 → IPC → main으로 dispatch                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## 1. 멀티 윈도우 모델

### 왜 단일 윈도우가 아닌가

펫이 떠있는 동안 사용자가 To-Do · 가챠 · 운세 · 정보 등 별개 화면을 띄워 본다. 이걸 한 윈도우 안에 패널로 쌓으면:
- 캐릭터가 항상 떠있어야 해서 transparent + alwaysOnTop인데, 패널이 그 위에 띄워지면 시각적으로 어색
- 풀스크린 transparent overlay는 다른 앱 클릭이 통과 안 됨 (`setIgnoreMouseEvents`로 토글하기 복잡)

→ **캐릭터 윈도우(작고 transparent + alwaysOnTop) + 각 패널마다 별 BrowserWindow** 로 분리. 각 윈도우는 OS가 알아서 관리.

### 캐릭터 윈도우의 특수 옵션

```ts
new BrowserWindow({
    width: 300, height: 300,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    focusable: false,         // 펫 클릭이 뒷창 포커스를 안 빼앗음
    fullscreenable: false,    // 사용자가 실수로 풀스크린 X
    skipTaskbar: true,        // 작업표시줄 숨김
})
mainWindow.setAlwaysOnTop(true, 'screen-saver')   // 풀스크린 앱 위에도 표시
mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
```

자세한 이유는 [`features/character.md`](./features/character.md) 참고.

### 패널 별창 패턴

각 패널이 자기만의 entry를 가짐:

```
src/renderer/
├── index.html              # 캐릭터 윈도우 entry
├── todo.html               # TODO 패널 별창 entry
├── gacha.html              # (계획) 가챠 패널 별창 entry
└── ...
```

`electron.vite.config.ts`의 `rollupOptions.input`에 entry를 등록해야 빌드된다.

### 새 패널 추가 흐름

1. **`PanelId` union 확장** — `src/main/menu/characterContextMenu.ts`의 `PanelId`에 새 항목 추가
2. **`src/main/panels/open{Name}Panel.ts` 작성** — BrowserWindow 싱글톤 인스턴스 생성/포커스 로직
3. **`src/main/panels/index.ts`의 `openPanel` switch 등록** — 새 panelId → open 함수 매핑
4. **`src/renderer/{name}.html` + `pages/{name}/` entry 추가** — 해당 별창의 React tree
5. **`electron.vite.config.ts`의 rollup input에 entry 등록**

## 2. SSOT (Single Source of Truth)

### 데이터 소유자 규칙

```
영속 데이터(앱 재시작 후에도 유지) → main이 SSOT
   ↓
electron-store에 저장
   ↓
IPC로 renderer들에 broadcast → 자동 동기화
```

**예외 없음.** 어떤 패널이 자기만 쓸 것 같아도 main에 둔다 — 이유:
- 다른 패널/캐릭터 윈도우에서 데이터를 봐야 할 가능성 항상 있음
- `localStorage`는 BrowserWindow 간 동기화 메커니즘 없음
- 통일된 백업/마이그레이션 경로

### 도메인별 main 모듈 구조 (정형 패턴)

`src/main/{domain}/` 안에 4개 파일:

```
src/main/{domain}/
├── {domain}State.ts    # 타입(State, Event) + 순수 reducer
├── store.ts            # electron-store wrapper (read/write)
├── ipc.ts              # ipcMain.handle('domain:get'/'domain:apply') + broadcast
└── index.ts            # barrel
```

현재 살아있는 사례:
- `src/main/playerState/` — 점수
- `src/main/todo/` — 할 일

새 도메인(가챠·운세·아이템 등) 추가 시 이 패턴 그대로 복제.

### Renderer 미러 패턴

`src/renderer/src/entities/{domain}/` 안:

```
entities/{domain}/
├── model/
│   ├── {Domain}.ts             # 타입 (@shared/contracts 재export)
│   └── use{Domain}Store.ts     # Zustand store + main 동기화
└── index.ts                    # barrel (use{Domain}Store + 타입 export)
```

`use{Domain}Store`의 표준 모양:

```ts
// 1. Zustand store
const useStore = create<Store>((set) => ({
    state: INITIAL,
    apply: async (event) => {
        const next = await window.api.{domain}.apply(event)
        set({ state: next })
    },
}))

// 2. 모듈 단위 가드 + HMR dispose
let isInitialized = false
let unsubscribe: (() => void) | null = null

export const initialize{Domain}Sync = (): void => {
    if (isInitialized) return
    isInitialized = true
    void window.api.{domain}.get().then((state) => useStore.setState({ state }))
    unsubscribe = window.api.{domain}.onChange((state) => useStore.setState({ state }))
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        unsubscribe?.()
        unsubscribe = null
        isInitialized = false
    })
}
```

**주의**: 모듈 import만으로 IPC 호출하는 사이드이펙트는 제거. 진입점(`app/main.tsx`)에서 `initialize{Domain}Sync()` 1회 호출.

## 3. 폴더 아키텍처 (FSD-lite + Electron 3-tier)

```
src/
├── main/                       # Node.js (main process)
│   ├── index.ts                # 캐릭터 윈도우 생성 + IPC 등록 + 부수효과 조립
│   ├── window/                 # 윈도우 위치·크기 IPC (드래그, 자율 이동)
│   ├── menu/                   # 우클릭 메뉴 정의
│   ├── panels/                 # 패널 별창 디스패처
│   ├── playerState/            # 점수 도메인
│   └── todo/                   # TODO 도메인
│
├── preload/                    # 각 BrowserWindow의 IPC 브릿지
│   ├── index.ts                # window.api 노출
│   └── index.d.ts              # Window 타입 선언
│
├── renderer/
│   ├── index.html              # 캐릭터 윈도우 entry
│   ├── todo.html               # TODO 별창 entry (패널마다 늘어남)
│   └── src/
│       ├── app/                # 진입점·글로벌 스타일
│       ├── pages/              # 각 별창의 페이지 컴포넌트
│       ├── entities/           # 도메인 모델 + 핵심 UI (character, todo, player)
│       └── features/           # 사용자 인터랙션 (drag, context-menu)
│
└── shared/
    └── contracts/              # main↔preload↔renderer가 공유하는 타입
        ├── playerEvents.ts
        └── todoEvents.ts
```

### 의존 방향 규칙

```
shared/contracts          ← 누구나 import 가능 (가장 아래)
    ↑
entities/{domain}         ← shared만 import. features는 안 봄
    ↑
features/{interaction}    ← entities + shared. 다른 features는 안 봄
    ↑
widgets/ (선택)            ← features + entities + shared
    ↑
app/, pages/              ← 모든 layer import 가능 (가장 위)
```

**역방향 import 금지.** ESLint로 강제하지는 않고 합의 + PR 리뷰로 지킴.

### Slice의 public API — Barrel 패턴

각 slice는 `index.ts` barrel을 두고 외부에 노출할 것만 export. 외부는 barrel만 import:

```ts
// 좋음
import { useTodos, useTodoActions } from '@renderer/entities/todo'

// 나쁨 — slice 내부 구조에 외부가 의존하면 안 됨
import { useTodoStore } from '@renderer/entities/todo/model/useTodoStore'
```

## 4. 공유 타입 — `@shared/contracts`

### 왜 필요한가

main과 renderer는 별개 빌드 단위라 cross-import 불가능. preload는 그 중간이지만 tsconfig 분리:
- `tsconfig.node.json` — main + preload + shared
- `tsconfig.web.json` — renderer + preload/index.d.ts + shared

해결책: **`src/shared/contracts/`에 타입만 두고, 양쪽 tsconfig의 `paths`/`include`에 등록** — 동일 정의를 한 곳에서 관리.

### 무엇이 contracts에 들어가나

- 각 도메인의 `State`, `Event` 타입 (예: `PlayerState`, `PlayerEvent`)
- IPC payload의 타입
- `INITIAL_*_STATE` 같은 시드 상수

**들어가지 않는 것**: reducer 같은 구현, electron-store 의존 코드, React 의존 코드 — main이나 renderer 중 한쪽 build에만 들어가야 하는 것.

## 5. IPC 패턴

### 도메인 데이터의 표준 채널 (정형)

각 도메인은 3개 채널을 갖는다:

| 채널 | 방향 | 용도 |
|---|---|---|
| `{domain}:get` | renderer → main → renderer | 현재 state 조회 |
| `{domain}:apply` | renderer → main → renderer | 의미 단위 이벤트 dispatch + 변경된 state 반환 |
| `{domain}:changed` | main → renderer (broadcast) | state 변경 알림 (모든 윈도우) |

코드: `src/main/{domain}/ipc.ts`.

### apply는 의미 단위 액션만 받는다

```ts
// 좋음 — 의미 단위
window.api.todo.apply({ type: 'add', text: '운동하기' })
window.api.player.apply({ type: 'todoComplete' })

// 안 좋음 — raw setter는 노출하지 않음
window.api.player.apply({ type: 'setScore', value: 100 })   // 추상화 누수
```

이유: 클라이언트가 임의 값을 보내면 도메인 invariant가 깨짐. **main의 reducer만이 state를 결정**.

### 도메인 간 부수효과는 외부에서 조립

`src/main/todo/ipc.ts`의 `registerTodoIpc`는 todo 완료 시 다른 도메인(player의 점수 가산)을 직접 호출하지 않는다. 대신 **콜백을 받음**:

```ts
registerTodoIpc({
    onTodoCompleted: (id) => {
        applyPlayerEvent({ type: 'todoComplete' })
    },
})
```

조립은 `src/main/index.ts`에서 한 번. todo 도메인이 player를 import하지 않게 해서 도메인 간 결합을 낮춤.

### 윈도우 조작·UI 액션 채널

도메인 데이터가 아닌 윈도우 위치, 메뉴 표시 같은 액션은 `src/main/window/`, `src/main/menu/` 에 따로 모음. 표준 IPC 채널 패턴 안 따르고 자유로움 (fire-and-forget `send` 등).

## 6. CSS / 스타일

### 사용 도구

- **`emotion` `css` prop** — 비즈니스 UI 전반
- **글로벌 base.css** — :root, body 기본
- **emotion `<Global>`** — 페이지 단위 root-level 스타일 (예: TODO 별창의 light theme)

### 캐릭터 윈도우의 transparent 배경

`app/styles/global.css`에서 body의 background를 `transparent`로 설정 + emotion으로 캐릭터 div만 그림. TODO 같은 패널 별창은 자체 base.css + Global로 색을 입힘 → 펫 윈도우와 격리.

## 7. 빌드 / 개발 도구

| 도구 | 역할 |
|---|---|
| `electron-vite` | main / preload / renderer를 각각 다른 entry로 빌드 |
| `Prettier` | tabWidth 4, semi false, singleQuote true, singleAttributePerLine true |
| `TypeScript` | tsconfig.node.json (main+preload) + tsconfig.web.json (renderer) 분리 |

### 명령

```bash
npm run dev          # 개발 서버 (HMR 포함)
npm run build        # 프로덕션 빌드
npm run typecheck    # 양쪽 tsconfig 모두 검증
```

## 8. 작업할 때 자주 보게 되는 파일

| 영역 | 위치 |
|---|---|
| 캐릭터 윈도우 옵션·생성 | `src/main/index.ts` (createWindow) |
| 우클릭 메뉴 정의 | `src/main/menu/characterContextMenu.ts` |
| 패널 디스패처 | `src/main/panels/index.ts` + `src/main/panels/open{Name}Panel.ts` |
| 캐릭터 상태/행동 | `src/renderer/src/entities/character/behaviors/` |
| 도메인 추가 시 main 패턴 | `src/main/playerState/` 또는 `src/main/todo/` 복제 |
| 도메인 추가 시 renderer 패턴 | `src/renderer/src/entities/player/` 또는 `entities/todo/` 복제 |
| 공유 타입 | `src/shared/contracts/` |
| 새 별창 entry | `src/renderer/{name}.html` + `electron.vite.config.ts` rollup input |

## 9. 알려진 트레이드오프

- **혼자 개발 가정 → 과한 validation 지양** — IPC payload는 신뢰. NaN/Infinity 같은 산술 사고만 가드. 외부 사용자에게 배포되면 이 가정 재검토 필요.
- **renderer 캐시가 1초쯤 stale할 수 있음** — main이 broadcast하기 전에 다른 윈도우가 `get()` 호출하면 잠깐 옛 값. 우리 도메인은 시간 민감 아님.
- **HMR에서 listener 누적 위험** — `import.meta.hot.dispose`로 해결. 모듈 import만으로 IPC 부수효과 일으키는 패턴 금지.
- **emotion `css` prop의 런타임 비용** — 우리 규모에선 무시 가능. 정말 성능 이슈 생기면 zero-runtime 대안(linaria 등) 검토.
