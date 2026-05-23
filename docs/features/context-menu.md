# 우클릭 컨텍스트 메뉴

## 한 줄 정체성

캐릭터에 우클릭하면 뜨는 OS 네이티브 메뉴. 8개(향후 9개) 패널 진입점.

## 명세

### 메뉴 구성 (v2.0 → 신 다이어그램)

| 항목 | v2.0 명세 | 신 다이어그램 | 동작 |
|---|---|---|---|
| 🍖 먹이주기 | ✓ | ✓ | 먹이 패널 열기 |
| 🎮 놀아주기 | ✓ | ✓ | 놀이 패널 열기 |
| ✅ To-Do | ✓ | ✓ | TODO 패널 열기 |
| 🎰 가챠 | ✓ | ✓ | 가챠 패널 열기 |
| 🎒 아이템 | ✓ | ✓ | 아이템 패널 열기 |
| 🔮 **운세** | ✗ | **✓ (신규)** | 운세 팝업 열기 |
| 📊 정보 | ✓ | ✓ | 정보 패널 열기 |
| 🔗 링크 관리 | ✓ | ✓ | 링크 추가/삭제 패널 열기 |
| ❌ 종료 | ✓ | ✓ | 앱 quit |

→ **신 다이어그램 반영 시 메뉴 항목 8개 → 9개** (운세 추가).

### 표시 위치

- 마우스 커서 위치에 OS 네이티브 컨텍스트 메뉴.
- 메뉴 외부 클릭 / 항목 선택 / ESC → 닫힘.

### 자율 행동과의 상호작용

- 메뉴 열림 → 캐릭터의 자율 walking 정지.
- 메뉴 닫힘 → 자율 행동 재개.
- 이유: 메뉴가 뜬 동안 캐릭터가 움직이면 메뉴와 캐릭터가 따로 노는 어색함이 생김.

## 아키텍처 / 데이터 흐름

### 사용자 우클릭 → 메뉴 → 패널 열기

```
[사용자가 캐릭터 우클릭]
       ↓ React onContextMenu
[useContextMenu — features/context-menu]
       ↓ window.api.showContextMenu()
       ↓ ipcRenderer.send('window:showContextMenu')
[main: ipcMain.on('window:showContextMenu')]
       ↓ webContents.send('menu:state', 'opened')  ← 자율 행동 정지 신호 broadcast
       ↓ showCharacterContextMenu(win, onClose)
       ↓ Menu.buildFromTemplate([...]).popup({ window, callback: onClose })

[사용자 메뉴 항목 클릭]
       ↓ menu item의 click handler
[openPanel(panelId)]
       ↓ src/main/panels/index.ts의 switch
       ↓ 해당 패널의 open 함수 호출
       ↓ BrowserWindow.show() 또는 새로 생성

[메뉴 닫힘]
       ↓ Menu.popup의 callback
       ↓ webContents.send('menu:state', 'closed')  ← 자율 행동 재개 신호
```

### 자율 행동 정지 신호

`isInteractingRef`(renderer)가 드래그·메뉴 둘 다의 신호를 토글:

```ts
// useContextMenu (features/context-menu)
useEffect(() => {
    return window.api.onMenuStateChange((state) => {
        isInteractingRef.current = state === 'opened'
    })
}, [])
```

자세한 흐름은 [character.md](./character.md) 참고.

### 패널 디스패처 (`src/main/panels/`)

```
src/main/panels/
├── index.ts                  # openPanel(panelId) — switch로 분기
├── openTodoPanel.ts          # TODO 별창 (싱글톤 BrowserWindow)
└── (예정) open{Name}Panel.ts # 패널마다 추가
```

`openPanel(panelId)`는 switch:
```ts
switch (panelId) {
    case 'todo': openTodoPanel(); return
    case 'feed': /* TODO */; return
    // ...
    default: console.log(`[panel:open] ${panelId} (not implemented)`)
}
```

### 새 패널 추가 흐름

1. **`PanelId` union 확장** — `src/main/menu/characterContextMenu.ts`의 `PanelId`에 항목 추가 (예: `'fortune'`)
2. **메뉴 항목 추가** — `PANEL_MENU_ITEMS` 배열에 한 줄 (`{ label: '🔮  운세', panelId: 'fortune' }`)
3. **`src/main/panels/open{Name}Panel.ts`** — BrowserWindow 싱글톤 인스턴스 생성/포커스
4. **`src/main/panels/index.ts`의 switch** — 새 case 등록
5. **`src/renderer/{name}.html` + `pages/{name}/`** — 별창의 entry + React tree
6. **`electron.vite.config.ts`의 rollup input** — entry 등록

### 관련 코드

| 영역 | 파일 |
|---|---|
| 메뉴 정의 (label + click) | `src/main/menu/characterContextMenu.ts` |
| 메뉴 IPC 등록 | `src/main/menu/ipc.ts` |
| 메뉴 모듈 barrel | `src/main/menu/index.ts` |
| 패널 디스패처 | `src/main/panels/index.ts` |
| TODO 패널 열기 (참고) | `src/main/panels/openTodoPanel.ts` |
| renderer 우클릭 hook | `src/renderer/src/features/context-menu/` |
| 메뉴 상태 구독 (자율 행동 정지) | `src/renderer/src/features/context-menu/useContextMenu.ts` |

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | 각 패널 모듈의 open 함수 (todo, gacha, fortune, ...) |
| **호출됨** | 캐릭터 윈도우의 우클릭 이벤트 |
| **신호 broadcast** | `menu:state` (opened/closed) → 자율 행동 정지/재개 |

## Open Questions

- **운세 메뉴 위치** — 현재 8개 메뉴 중 어디에? 다이어그램에선 to-do와 정보 사이에 있는 듯. 의미상 'TODO 다음, 정보 앞'이 자연스러움
- **운세 패널은 별창인가 캐릭터 위 팝업인가** — 명세에는 "팝업"이라고 적혀 있어 별창보단 캐릭터 위 모달 가능성. [fortune.md](./fortune.md) 참고
- **메뉴 항목 활성/비활성 상태** — 가챠는 점수 < 50일 때 비활성? 먹이는 인벤토리 없을 때 비활성?
