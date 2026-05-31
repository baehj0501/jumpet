# 우클릭 컨텍스트 메뉴

## 한 줄 정체성

캐릭터에 우클릭하면 뜨는 OS 네이티브 메뉴. 모든 패널·기능의 단일 진입점.

## 명세

### 메뉴 구성

> 이 구성은 참조 앱(JUMPET_4)의 메뉴 기능 세트를 현재 레포에 이식하며 확정됐다.
> 기존 항목 중 겹치는 것은 대체·통합하고, 새 기능은 추가하고, jumpet 고유였던 링크 기능은 폐기했다.

| 순서 | 항목 | panelId | 동작 | 비고 |
|---|---|---|---|---|
| 1 | 🐾 돌봄 | `care` | 돌봄 패널 열기 (밥/놀이/쓰다듬기/눕기) | 구 '먹이주기'+'놀아주기' 통합 |
| 2 | ✅ To-Do | `todo` | TODO 패널 열기 | 유지 (구현됨) |
| 3 | 🌸 운세 | `fortune` | 오늘의 운세 팝업 | 신규 메뉴 연결 ([fortune.md](./fortune.md)) |
| 4 | 📅 일정 | `schedule` | 일정(캘린더) 패널 열기 | 신규 ([schedule.md](./schedule.md)) |
| — | (구분선) | | | |
| 5 | 🎰 가챠 | `gacha` | 뽑기 패널 열기 | 유지 (뽑기 실행) |
| 6 | 🎒 아이템 | `item` | 아이템 패널 열기 (꾸미기/펫수집 탭) | 인벤토리 보유 현황 |
| — | (구분선) | | | |
| 7 | 🎵 유튜브 | `youtube` | 유튜브 창 열기 | 구 '링크 관리' 대체 ([youtube.md](./youtube.md)) |
| 8 | ⚙️ 설정 | `settings` | 설정 패널 열기 (점수·레벨 + 환경설정) | 구 '정보' 확장 통합 ([settings.md](./settings.md)) |
| — | (구분선) | | | |
| 9 | ❌ 종료 | — | 앱 quit | 유지 |

→ **패널 항목 8개 + 종료.** 구분선은 의미 그룹(상시 인터랙션 / 수집 / 외부·환경설정)을 나눈다. 정확한 그룹 경계는 Open Question.

### 폐기된 항목 (이식 결정에 따라 제거)

- **🔗 링크 관리** — jumpet 고유 기능, 참조 앱엔 없음 → 유튜브로 대체.
- **🔗 즐겨찾기 바 표시 (체크박스 토글)** — 링크 미니 바(`linkBar`) 플로팅 창과 함께 폐기.
- 관련 코드(`src/main/link/`, `src/main/linkBar/`, `renderer`의 link slice·link-bar·link-manager 페이지)도 제거 대상. 자세한 영향 범위는 [youtube.md](./youtube.md) 참고.

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
       ↓ showCharacterContextMenu(win, onClose, deps)
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
    case 'care': /* TODO */; return
    case 'gacha': /* TODO */; return
    // ...
    default: console.log(`[panel:open] ${panelId} (not implemented)`)
}
```

### 메뉴 항목별 진입점 매핑

| panelId | 진입 형태 | 명세 문서 |
|---|---|---|
| `care` | 별창 패널 | [care.md](./care.md) |
| `todo` | 별창 패널 (구현됨) | [todo.md](./todo.md) |
| `fortune` | 캐릭터 위 팝업 또는 별창 (미정) | [fortune.md](./fortune.md) |
| `schedule` | 별창 패널 | [schedule.md](./schedule.md) |
| `gacha` | 별창 패널 (뽑기 실행) | [gacha-and-inventory.md](./gacha-and-inventory.md) |
| `item` | 별창 패널 (꾸미기/펫수집 탭) | [gacha-and-inventory.md](./gacha-and-inventory.md) |
| `youtube` | 별창 (webview, alwaysOnTop) | [youtube.md](./youtube.md) |
| `settings` | 별창 패널 | [settings.md](./settings.md) |

### 외부 의존성 주입 (`CharacterContextMenuDeps`)

메뉴 모듈은 다른 도메인을 직접 import하지 않고 콜백으로 받는다 (결합도 하향, 조립은 `src/main/index.ts`).

- 링크/즐겨찾기 바 토글 제거 후, 현재 메뉴는 외부 상태 의존이 없다(모든 항목이 단순 `openPanel`/`app.quit`).
- 향후 "항목 활성/비활성"(예: 점수 부족 시 가챠 비활성) 같은 동적 상태가 생기면 그때 deps로 주입한다.

### 새 패널 추가 흐름

1. **`PanelId` union 확장** — `src/main/menu/characterContextMenu.ts`의 `PanelId`에 항목 추가
2. **메뉴 항목 추가** — `PANEL_MENU_ITEMS` 배열에 한 줄 (`{ label: '🌸  운세', panelId: 'fortune' }`)
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
| **호출함** | 각 패널 모듈의 open 함수 (care, todo, fortune, schedule, gacha, item, youtube, settings) |
| **호출됨** | 캐릭터 윈도우의 우클릭 이벤트 |
| **신호 broadcast** | `menu:state` (opened/closed) → 자율 행동 정지/재개 |

## Open Questions

- **구분선 그룹 경계** — 위 표는 (상시 인터랙션: 돌봄/투두/운세/일정) · (수집: 가챠/아이템) · (외부·환경: 유튜브/설정) 3그룹으로 가정. 실제 그룹핑은 사용자 결정.
- **운세 패널 형태** — 캐릭터 위 모달 vs 별창. [fortune.md](./fortune.md) Open Question.
- **메뉴 항목 활성/비활성 상태** — 가챠는 점수 부족 시 비활성? 돌봄 액션은 쿨타임 중 비활성 표시? (쿨타임은 패널 내부에서 처리할 가능성이 큼.)
- **트레이 메뉴 도입 여부** — 참조 앱은 시스템 트레이 메뉴(펫 보이기/대화창/유튜브/종료)도 있었다. 현재 jumpet은 우클릭 메뉴만 명세. 트레이 도입은 별도 결정.
