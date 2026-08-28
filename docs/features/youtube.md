# 유튜브 (YouTube)

> 구 `link-manager.md`(링크 관리)를 대체한다. 참조 앱(JUMPET_4)의 유튜브 창 비즈니스 로직을 이식했다.
> 링크 관리 기능(jumpet 고유)과 즐겨찾기 미니 바·메뉴 토글은 함께 폐기한다 (아래 "폐기 영향 범위" 참고).

## 한 줄 정체성

캐릭터 옆에 떠 있는 작은 **유튜브 플레이어 창**. 테마 프레임으로 꾸민 webview에서 유튜브를 보고, 미니 모드·드래그로 가볍게 곁에 둔다.

## 명세

### 창 동작

- 우클릭 메뉴 '🎵 유튜브' → 유튜브 창 열기(싱글톤; 이미 열려 있으면 포커스).
- `alwaysOnTop`, `transparent`, frameless 의 작은 플로팅 창.
- 내부에 **webview**로 유튜브(`https://www.youtube.com`) 로드.
- 기본 크기 예: 560×407 (우측 하단). 정확한 기본 위치/크기는 조정 가능.

### 테마 프레임

- 캐릭터 테마(빼꼼/구경/쿠피/슈피/피요/윙피 등)에 맞춘 **프레임 이미지 오버레이**를 webview 위에 씌운다.
- 각 테마마다 webview가 보이는 "구멍" 좌표가 달라, 테마별로 webview 위치/크기를 맞춘다.
- 테마 이미지 에셋은 빌드 타임 번들에 포함 ([architecture.md](../architecture.md) 빌드 타임 에셋 정책).

### 창 제어

- **크기 조정** 슬라이더 (예: 50~200%).
- **미니 모드** 토글 (예: 280×204로 축소).
- 상단 핸들 **드래그**로 화면 내 이동.
- 닫기.

## 아키텍처 / 데이터 흐름

### 윈도우 / IPC

유튜브 창은 도메인 데이터(영속 상태)가 거의 없는 **UI 윈도우**다. 표준 `{domain}:get/apply/changed` 패턴보다 윈도우 조작 IPC(fire-and-forget)에 가깝다 — [architecture.md](../architecture.md) §5 "윈도우 조작·UI 액션 채널" 참고.

```
src/main/panels/openYoutubePanel.ts   # 싱글톤 BrowserWindow 생성/포커스
src/main/youtube/ipc.ts               # youtube:resize / youtube:move / youtube:mini (fire-and-forget)
```

- 현재 테마는 설정([settings.md](./settings.md))의 테마 값을 따라가거나(브로드캐스트 수신), 유튜브 창 자체 선택을 둘지 결정 필요(Open Question).

### 영속화할 만한 것 (선택)

- 마지막 창 위치/크기, 미니 모드 여부 정도. 영속화한다면 작은 `youtube` 도메인 또는 공용 윈도우-레이아웃 저장소에.

### 새 패널 / 창 추가 흐름

1. `PanelId` union에 `'youtube'` 추가 (이미 메뉴에 있음)
2. `src/main/panels/openYoutubePanel.ts` — 싱글톤 창 (webview 허용 webPreferences 주의)
3. `src/main/panels/index.ts` switch 등록
4. `src/renderer/youtube.html` + `src/renderer/src/pages/youtube/`
5. `electron.vite.config.ts` rollup input 등록

### 관련 코드 (계획)

| 영역 | 파일 |
|---|---|
| 창 열기 (싱글톤) | `src/main/panels/openYoutubePanel.ts` (신규) |
| 창 제어 IPC | `src/main/youtube/ipc.ts` (신규, 선택) |
| 별창 entry | `src/renderer/youtube.html` (신규) |
| UI (webview + 프레임) | `src/renderer/src/pages/youtube/` (신규) |
| 테마 프레임 에셋 | `src/renderer/src/entities/character/assets/...` 또는 별도 youtube 에셋 폴더 |

## 폐기 영향 범위 (링크 기능 제거)

유튜브가 링크 관리를 **대체**하므로, 아래 링크 관련 코드/명세는 제거 대상이다:

| 제거 대상 | 위치 |
|---|---|
| 링크 도메인 (SSOT) | `src/main/link/` |
| 링크 미니 바 윈도우 | `src/main/linkBar/` |
| 링크 공유 타입 | `src/shared/contracts/linkEvents.ts`, `linkBarLayout.ts` |
| renderer 링크 slice | `src/renderer/src/entities/link/` |
| 링크 페이지 | `src/renderer/src/pages/link-bar/`, `pages/link-manager/` |
| 별창 entry | `src/renderer/link-bar.html`, `link-manager.html` (및 vite rollup input) |
| 메뉴 '🔗 즐겨찾기 바 표시' 토글 | `src/main/menu/characterContextMenu.ts` (+ `CharacterContextMenuDeps` 정리) |
| main 조립부 | `src/main/index.ts`의 `registerLinkIpc` / `setupLinkBar` / `adjustLinkBarHeight` 호출 |

> docs 단계에서는 명세만 정리한다. 실제 코드 삭제는 구현 단계의 별도 작업.

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | webview (외부 유튜브), (선택) 설정 테마 broadcast 수신 |
| **호출됨** | 우클릭 메뉴의 '🎵 유튜브' |

→ 도메인 데이터 결합이 거의 없는 독립 UI 창.

## Open Questions

- **테마 출처** — 유튜브 프레임 테마를 설정([settings.md](./settings.md))의 전역 테마와 연동? 유튜브 창에서 따로 고를 수 있게?
- **테마 프레임 에셋** — 참조 앱의 7종 프레임 PNG를 그대로 가져올지, jumpet 캐릭터(dog)에 맞춰 새로 만들지.
- **webview 보안** — 외부 웹 로드 시 `webview`/`<iframe>` 정책, `nodeIntegration` 격리.
- **창 위치/크기 영속화** — 저장할지, 매번 기본값으로 열지.
- **유튜브 외 다른 외부 서비스** — 향후 음악/타이머 등으로 확장 여지(참조 앱엔 포모도로 슬롯이 있었으나 미구현이었음).
