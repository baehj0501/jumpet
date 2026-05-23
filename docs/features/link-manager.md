# 링크 관리

## 한 줄 정체성

자주 쓰는 웹사이트를 미니 버튼으로 등록 — 캐릭터와 독립된 별도 플로팅 창에 항상 표시.

## 명세 (v2.0 §9 + 신 다이어그램)

### 컨셉

- 사용자가 자주 쓰는 웹사이트를 **미니 버튼**으로 등록.
- 바탕화면 한쪽 구석에 **세로로 정렬된 별도 플로팅 창**.
- 캐릭터 본체와 **독립된 윈도우** (다른 위치, 다른 BrowserWindow).
- 항상 최상위 표시.
- **최대 5개까지** (신 다이어그램).

### 동작

- 미니 버튼 클릭 → `shell.openExternal(url)` 로 기본 브라우저에서 URL 열림.
- 우클릭 메뉴의 '🔗 링크 관리'에서 추가/삭제.
- 등록한 링크는 로컬 (electron-store)에 저장 — 재시작 후 유지.

### 링크 항목 구성 (v2.0 §9.3)

| 속성 | 설명 |
|---|---|
| 이모지 | 12종 중 선택 (🔗 🌐 💼 📚 🎮 🎵 📺 🛒 ✉️ 📝 ⭐ 🏠) |
| 이름 | 최대 20자 |
| URL | `http://` 또는 `https://` (자동 보완) |

### URL 자동 보완

사용자가 `example.com` 입력 → 저장 시 `https://example.com` 으로 자동 prefix.

### 미니 버튼 외형

- 이모지만? 이모지 + 이름? — 미정 (v2.0 §13 미정 사항)
- 호버 시 툴팁으로 이름 표시?

### 플로팅 창 위치

- 화면 어느 구석? 오른쪽 위/아래 / 왼쪽 위/아래 중 — 미정 (v2.0 §13 미정 사항).
- 사용자가 드래그로 옮길 수 있게? 고정?
- 캐릭터처럼 alwaysOnTop?

## 아키텍처 / 데이터 흐름

### 도메인 모델

`src/shared/contracts/linkEvents.ts` (신규):

```ts
export const LINK_EMOJIS = ['🔗', '🌐', '💼', '📚', '🎮', '🎵', '📺', '🛒', '✉️', '📝', '⭐', '🏠'] as const
export type LinkEmoji = typeof LINK_EMOJIS[number]

export type Link = {
    id: string
    emoji: LinkEmoji
    name: string         // 최대 20자
    url: string          // 'https://...' 정규화된 형태
}

export type LinkState = {
    links: Link[]        // 최대 5개
}

export const MAX_LINKS = 5

export type LinkEvent =
    | { type: 'add'; emoji: LinkEmoji; name: string; url: string }
    | { type: 'remove'; id: string }
    | { type: 'update'; id: string; emoji?: LinkEmoji; name?: string; url?: string }
    | { type: 'reorder'; ids: string[] }   // 드래그 정렬 (옵션)
```

### URL 정규화 (reducer 안)

```ts
const normalizeUrl = (url: string): string => {
    const trimmed = url.trim()
    if (trimmed === '') return ''
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
}
```

### 데이터 흐름

```
[링크 관리 패널 — 사용자가 추가]
   ↓ useLinkStore.add({ emoji, name, url })
   ↓ window.api.link.apply({ type: 'add', ... })
[main reducer]
   1. 최대 5개 검증 (이미 5개면 no-op)
   2. URL 정규화
   3. randomUUID로 id 생성
   4. links에 push
   ↓ writeLinkState + broadcast 'link:changed'
   ↓
모든 윈도우 (관리 패널 + 플로팅 창)가 동기화
   ↓
플로팅 창의 미니 버튼 그리드가 자동 갱신
```

### 두 종류의 윈도우

링크 시스템은 **두 개의 별창**이 필요:

1. **플로팅 미니 버튼 창** (`src/renderer/link-bar.html`)
   - 항상 떠있는 작은 창. 캐릭터처럼 alwaysOnTop, frameless, transparent.
   - 등록된 미니 버튼만 렌더링. 클릭 시 `shell.openExternal`.
   - 사용자가 위치 옮길 수 있게 드래그 가능?

2. **링크 관리 패널** (`src/renderer/link-manager.html`)
   - 우클릭 메뉴에서 열리는 일반 패널 별창.
   - 추가/수정/삭제 폼 + 현재 등록된 5개 목록.
   - 변경 시 플로팅 창에 자동 반영 (broadcast 동기화).

### main의 외부 URL 열기

```ts
// src/main/link/ipc.ts
ipcMain.on('link:open', (_event, url: string) => {
    // 외부 입력이라 prefix 검증
    if (!/^https?:\/\//i.test(url)) return
    shell.openExternal(url)
})
```

또는 renderer에서 직접 `shell.openExternal` 호출 — preload에서 `shell` 노출은 비추, **main에 위임**이 안전.

### 새 패널 / 창 추가 흐름

플로팅 창과 관리 패널 각각 entry 등록:

```
src/renderer/
├── link-bar.html              # 플로팅 미니 버튼 창
└── link-manager.html          # 관리 패널 별창

src/renderer/src/pages/
├── link-bar/
└── link-manager/

src/main/panels/
├── openLinkManagerPanel.ts    # 관리 패널 별창
└── (플로팅 창은 panels와 별개로 main/index.ts의 createWindow처럼 앱 시작 시 생성)
```

### 앱 시작 시 플로팅 창 자동 생성

캐릭터 윈도우처럼 앱 시작 시 항상 생성:

```ts
// src/main/index.ts
app.whenReady().then(() => {
    createCharacterWindow()
    createLinkBarWindow()   // 미니 버튼 플로팅 창
    // ...
})
```

### 관련 코드 (계획)

| 영역 | 파일 |
|---|---|
| 타입 (공유) | `src/shared/contracts/linkEvents.ts` |
| reducer + 정규화 + 5개 제한 | `src/main/link/linkState.ts` |
| 영속화 | `src/main/link/store.ts` |
| IPC (apply + link:open) | `src/main/link/ipc.ts` |
| 플로팅 창 생성 | `src/main/linkBar/createLinkBarWindow.ts` |
| 관리 패널 | `src/main/panels/openLinkManagerPanel.ts` |
| renderer slice | `src/renderer/src/entities/link/` |
| 플로팅 창 UI | `src/renderer/src/pages/link-bar/` |
| 관리 패널 UI | `src/renderer/src/pages/link-manager/` |

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | electron-store, shell.openExternal |
| **호출됨** | 우클릭 메뉴의 '🔗 링크 관리' / 앱 시작 (플로팅 창 자동 생성) |

→ **다른 도메인에 의존하지 않음**. 가장 독립적인 기능 → 다른 시스템 진척과 무관하게 구현 가능.

## Open Questions

- **플로팅 창 위치** — 오른쪽 위/아래, 왼쪽 위/아래 중? 사용자가 드래그로 옮기게? 자동 snap?
- **미니 버튼 표시 방식** — 이모지만 / 이모지+이름 / 호버 시 툴팁
- **5개 초과 시 사용자 안내** — 추가 버튼 비활성? 토스트? 가장 오래된 거 삭제 권유?
- **링크 정렬** — 추가 순서대로? 사용자 정의 드래그?
- **URL 유효성 검증** — 정말 호출 가능한 URL인지? 입력 시 정규식 외에 도메인 형식 검증?
- **이모지 picker UI** — 12개를 어떻게 보여줄지 (grid? dropdown?)
- **링크에 단축키 할당** — 미래 기능?
- **링크 클릭 시 시각 피드백** — 캐릭터가 손 흔드는 모션?
