# 우클릭 → 통합 메뉴 창

## 한 줄 정체성

캐릭터에 우클릭하면 뜨는 **탭형 통합 메뉴 창**. 예전의 OS 네이티브 드롭다운을 대체한다. 모든 기능이 이 한 창의 **탭**으로 산다(별창 패턴 폐기).

## 명세

### 동작

- 캐릭터 우클릭 → 통합 메뉴 창 1개가 열린다(싱글톤; 다시 우클릭하면 기존 창에 포커스).
- 창은 **frameless** + 자체 픽셀아트 타이틀바(드래그 이동 + 닫기 ✕).
- 비주얼: JUMPET_4 `menu.html`의 픽셀아트 테마 이식 (Galmuri11 폰트, 픽셀 보더). 테마 CSS 변수 6종(skyblue 기본 + green/babypink/brown/light/dark) 포함 — 현재 기본 skyblue 고정, 테마 전환 UI는 설정 탭(후속).

### 탭 구성

| 탭 | 상태 | 내용 |
|---|---|---|
| 🐾 돌봄 | **동작** | 밥/놀이(보유 아이템 소모) + 쓰다듬기/눕기(무료) + 운세 보기 버튼 + 총 포인트 ([care.md](./care.md)) |
| ✅ 할일 | **동작** | To-Do 추가/완료/삭제 ([todo.md](./todo.md)) |
| 🌸 운세 | **동작** | 오늘의 운세(날짜당 1회) ([fortune.md](./fortune.md)) |
| 🎰 가챠 | **동작** | 돌봄 아이템 뽑기(20pt) ([gacha-and-inventory.md](./gacha-and-inventory.md)) |
| 📅 일정 | placeholder | "준비 중" ([schedule.md](./schedule.md)) |
| 🎒 아이템 | placeholder | "준비 중" |
| 🎵 유튜브 | placeholder | "준비 중" ([youtube.md](./youtube.md)) |
| ⚙️ 설정 | placeholder | "준비 중" ([settings.md](./settings.md)) |

> 탭 집합은 우리 기능 taxonomy를 따른다. JUMPET_4 menu.html의 꾸미기·펫 탭(데코/펫 뽑기)은 후속이며, 우리 가챠(돌봄 아이템 뽑기)가 탭으로 들어와 돌봄 루프를 닫는다.

### 자율 행동과의 상호작용

- 메뉴 창은 캐릭터와 **별개 윈도우**라, 열려 있어도 캐릭터 자율 walking을 멈추지 않는다.
- (예전 드롭다운은 캐릭터에 앵커되어 `menu:state` opened/closed로 자율 행동을 멈췄지만, 통합 창에선 불필요 → 신호 제거.)

## 아키텍처 / 데이터 흐름

### 우클릭 → 창 열기

```
[사용자가 캐릭터 우클릭]
       ↓ React onContextMenu → window.api.showContextMenu()
       ↓ ipcRenderer.send('window:showContextMenu')
[main: ipcMain.on('window:showContextMenu')]
       ↓ openMenuPanel()  (싱글톤 BrowserWindow, frameless)
       ↓ menu.html → pages/menu/main.tsx → MenuPage
```

### 탭과 도메인 동기화

- 메뉴 창은 여러 도메인을 한 창에서 본다 → `pages/menu/main.tsx`에서 `initialize{Player,Item,Todo,Fortune}Sync()`를 1회씩 호출.
- 각 탭은 해당 도메인의 Zustand 미러(read-only) + 액션을 그대로 사용 — 도메인 SSOT 패턴은 유지([architecture.md](../architecture.md) §2).
- `MenuPage`가 `activeTab` state로 탭을 전환하고 탭 컴포넌트를 렌더한다.

### 관련 코드

| 영역 | 파일 |
|---|---|
| 우클릭 IPC (창 열기) | `src/main/menu/ipc.ts` |
| 메뉴 창 열기 (싱글톤) | `src/main/panels/openMenuPanel.ts` |
| 메뉴 창 entry | `src/renderer/menu.html` → `src/renderer/src/pages/menu/main.tsx` |
| 셸(타이틀바·탭바) | `src/renderer/src/pages/menu/MenuPage.tsx` |
| 탭 콘텐츠 | `src/renderer/src/pages/menu/tabs/` (CareTab/TodoTab/FortuneTab/GachaTab/PlaceholderTab) |
| 픽셀 테마·폰트 | `src/renderer/src/app/styles/pixel-theme.css` (+ `styles/fonts/Galmuri11*.woff2`) |
| renderer 우클릭 hook | `src/renderer/src/features/context-menu/useContextMenu.ts` |

### 새 탭(기능) 추가 흐름

1. 해당 도메인이 없으면 SSOT 도메인 추가 (`src/main/{domain}/` + `entities/{domain}/`) — [architecture.md](../architecture.md) §2 패턴.
2. `pages/menu/tabs/{Name}Tab.tsx` 작성 (픽셀 테마 className 사용, 도메인 store 연결).
3. `MenuPage.tsx`의 `TABS` 배열 + `renderTab()` switch에 등록.
4. (별창·html entry·vite input 추가 불필요 — 탭은 메뉴 창 안에 산다.)

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | openMenuPanel → 메뉴 창. 탭들이 player/item/todo/fortune 도메인 사용 |
| **호출됨** | 캐릭터 윈도우의 우클릭 이벤트 |

## Open Questions

- **테마 전환 UI** — 6종 픽셀 테마 변수는 있으나 전환은 설정 탭(후속)에서.
- **창 위치** — 현재 OS 기본 위치. 커서 근처/펫 옆 등 배치 정책 미정.
- **placeholder 탭 우선순위** — 일정/아이템/유튜브/설정 중 다음 구현 순서.
- **JUMPET_4 꾸미기·펫 탭** — 데코/펫 뽑기를 별도 탭으로 추가할지(현재 가챠=돌봄 아이템만).
