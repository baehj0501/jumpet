# JUMPET — 작업 컨텍스트 메모리

> 지금까지의 작업 맥락과 앱 기능 전체 스냅샷. *변하지 않는 명세*는 `docs/features/*.md`가 SSOT, 이 파일은 **현재 구현 상태 + 합의 사항** 요약.
> (코드가 진실 — 어긋나면 코드 기준으로 갱신.)

## 1. 앱 정체성

OS 데스크탑 위 상시 **캐릭터(픽셀 펫)** + 우클릭으로 열리는 **탭형 통합 메뉴 창** 기반 Electron 데스크탑 펫 게임.
스택: Electron + electron-vite, React + TS, Zustand, emotion(비즈 UI) / className 기반 `pixel-theme.css`(메뉴·별창). 아키텍처: FSD-lite + 3-tier(main/preload/renderer).

## 2. 윈도우 구성 (4종)

1. **캐릭터 윈도우** (`main/index.ts` createWindow, 300×300, transparent·frameless, 일반 z-order) — `App.tsx`. 드래그/좌클릭 멘트/우클릭 메뉴. 동반 펫 `.pet-companion` 우하단 렌더 + step 바운스.
2. **통합 메뉴 창** (`panels/openMenuPanel.ts`, frameless 싱글톤) — `pages/menu/MenuPage.tsx` 타이틀바+탭바+탭. 우클릭으로 열림. `setMenuPanelOnTop(flag)`로 꾸미기 중 always-on-top.
3. **데코(꾸미기) 창** (`createWorldWindow`, 전체화면 투명 오버레이) — `pages/world`. 고정 모드=클릭통과(`setIgnoreMouseEvents(true)`), 편집 모드=마우스 받음. 배치 데코 렌더(원본 배율 scale 0.1).
4. **유튜브 별창** (`panels/openYoutubePanel.ts`, 560×407, transparent·frameless·alwaysOnTop, `webviewTag:true`) — `pages/youtube`. webview로 유튜브 로드 + 테마 프레임 오버레이.

## 3. SSOT 도메인 패턴

`shared/contracts/{domain}Events.ts`(타입+INITIAL) → `main/{domain}/{domain}State.ts`(순수 reducer) + `store.ts`(electron-store) + `ipc.ts`(get/apply/changed broadcast) + `index.ts` → renderer `entities/{domain}/model/use{Domain}Store.ts`(Zustand 미러 + `initialize{Domain}Sync()`). 각 윈도우 entrypoint가 sync 1회 호출. `useXxxActions`는 **반드시 `useShallow`** (안 쓰면 무한 리렌더 — world에서 겪음).

**도메인**: player(점수) · todo · fortune · item(소모 아이템+옛 가챠) · schedule · characterSelection · profile(캐릭터이름/내이름/생일) · petSelection · **world(데코 꾸미기)**.

## 4. 메뉴 탭 (10종, `MenuPage.tsx`)

홈(care) · 일정(schedule) · 할일(todo) · 타이머(timer) · 운세(fortune) · 가챠(gacha) · 펫(pet) · 아이템(item) · 유튜브(youtube) · 설정(settings, placeholder).

- **홈(CareTab)**: 하늘/구름/반짝이 씬 + 캐릭터(좌우 화살표 전환) + 인사 말풍선(꼬리) + 프로필 4행(캐릭터 이름/내 이름/생일/⭐포인트). 돌봄 액션 그리드는 제거됨. 캐릭터+바닥 합본 이미지(`HOME_SCENE_ASSETS`).
- **일정(ScheduleTab)**: 캘린더 + 년/월 드롭다운 + 일정 추가, todo 양방향 삭제 연동. 상단 제목 없음(오늘 날짜 줄 제거).
- **할일(TodoTab)**: 프로젝트 칩(전체뿐이면 '+새 프로젝트' 활성) + 상단 드롭다운, 완료 양방향·보상 마이너스(음수 허용).
- **타이머(TimerTab)**: 포모도로 + 픽셀 스톱워치, 완료 시 캐릭터 상단 배너. tick은 MenuPage 상주(`backgroundThrottling:false`).
- **운세(FortuneTab)**: 수정구슬 애니메이션. 제목 `🌸 오늘의 운세`(18px) 유지.
- **가챠(GachaTab)**: 검볼 머신 연출. **데코 121종 추첨**(아래 6번). 20pt(`GACHA_COST`).
- **펫(PetTab)**: 동반 펫 7종(삐약이/몰랑이/반짝이/나비/깡총이/뒤뚱이/곰곰이), 5열 정사각 카드. 멘트→구분선→그리드.
- **아이템(ItemTab)**: 데코 꾸미기(아래 5번).
- **유튜브(YoutubeTab)**: 테마 7종 미리 선택 + 링크 입력 → ▶ 열기(별창).

## 5. Desktop World (아이템 꾸미기) — `docs/features/desktop-world.md`

- **데코 = 가챠 획득**, 바탕화면 **전체** 어디든 배치(전체화면 투명 창).
- 도메인 `world`: `WorldState { owned: Record<id,number>, placed: PlacedItem[], mode: 'fixed'|'edit' }`. mode는 **메모리 비영속**(앱 시작 항상 fixed). 이벤트: acquire/place/move/recall/commitLayout/reset/setMode.
- mode 바뀌면 main `setWorldEditable` → 데코 창 클릭통과 토글 + 메뉴 always-on-top.
- 꾸미기 흐름: 아이템 탭 🎨 꾸미기 → 보관함 데코 클릭(바탕화면 중앙 배치) → 바탕화면 드래그 이동/우클릭 회수 → 저장(고정)/취소(스냅샷 복원). 메뉴에 "배치됨 N" 목록 + ✕ 회수.
- 보관함은 **테마 폴더(썸네일 4장)** → 폴더 진입 → 데코 카드. 데코 121종 PNG `entities/world/assets/{park,shipping,snow,star}/`, `import.meta.glob` 자동 카탈로그(`decorCatalog.ts`), 이름있는 20종 한글 라벨.
- 데코 크기: 원본 배율(`.world-item { transform: scale(0.1) }`), 박스에 안 맞춤.

## 6. 가챠 → 데코

- `world:gacha`(main): 점수 확인+20pt 차감만 원자적 → `{success}`. renderer `rollGacha`가 데코 121종 균등 추첨 → `world.acquire(id)` 적립 + 결과 reveal(데코 PNG).
- 옛 돌봄 아이템(item 도메인)은 유지하되 가챠에선 안 나옴.

## 7. 유튜브 별창 — `docs/features/youtube.md` (JUMPET_4 이식)

- 단일 창: `<webview>`(youtube) + 테마 프레임 PNG 오버레이(`pages/youtube/assets/theme1~7.png`) + 테마별 구멍 좌표 `THEME_HOLES`.
- 메뉴 유튜브 탭에서 테마+링크 선택 → `window.api.youtube.open({theme,url})` → main이 `youtube.html?theme=&video=` 쿼리로 로드.
- 재생: **watch 페이지**(임베드는 오류 153로 일부 막혀 watch 채택). 영상 링크면 추천/댓글/헤더 숨김 CSS(`insertCSS`) + 플레이어 100% + 줌 1 → 꽉 채움. 홈은 헤더만 숨김.
- 창 제어: **하단 슬라이더(50~200%)** 크기조절, **프레임 드래그(`-webkit-app-region: drag`)로 이동**(webview/슬라이더/메뉴는 no-drag), **프레임 우클릭 → 컨텍스트 메뉴**(테마 7종/미니/닫기). 화면 버튼 없음.
- preload `window.api.youtube`: open/move/resize/resizeEdge/close. main `youtube/ipc.ts`.

## 8. 캐릭터 / 인터랙션

- 캐릭터 4종 piyoo/qupee/suupee/wingpee. 좌클릭 멘트: 50% `(캐릭터 이름)이/가`, 10% `(내 이름)아/야` 호격(받침 기준). 하늘색 말풍선.
- 탭 아이콘: `tabIcons.ts` 16×16 다색 픽셀.

## 9. 메뉴 픽셀 테마 규칙 (`pixel-theme.css`)

- **계단 모서리**: `--pixel-clip`(2px 3단=6px 코너) clip-path 전역 토큰.
- **테두리**: 테두리 필요한 요소(탭·버튼·태그)는 **바깥=테두리색 staircase + 안쪽 `::before` 채움(inset 2px)** — mask-ring 폐기. 버튼 채움색은 `--btn-fill` 변수.
- 컬러 베벨(블루 톤 inset), 탭 카드 바탕 `#ebf7ff` + 베벨 4px, 탭 간격 4px.

## 10. 개발/빌드 운영

- **dev**: renderer는 HMR. **main/preload/vite config 수정은 자동 재시작 안 됨** → `pkill -f electron-vite` + `pkill -f "Desktop/jumpet/node_modules/electron"` + `lsof -ti:5173 | xargs kill -9` 후 `npm run dev`. **dev 서버 중복 주의**(두 개 뜨면 5173 충돌로 IPC/HMR 꼬임 — 펫 선택 안 되던 버그 원인).
- 프리뷰(Claude Preview MCP)로 menu.html 검증 시 `window.api` stub + 모듈 수동 렌더(singleton sync 오염 주의).
- 타입체크 `npm run typecheck`(node+web). 빌드 `electron-builder.yml`: mac dmg(arm64+x64) · win nsis(x64) · linux AppImage. 미서명 `CSC_IDENTITY_AUTO_DISCOVERY=false`. `package:mac`/`win` — macOS에서 win도 번들 wine으로 빌드됨. 산출물 `dist/`.
- 커밋/푸시는 직접 git 금지 → `/commit`, `/pr-description-simple` 스킬.

## 11. 현재 브랜치 / 커밋

브랜치 `feat/menu-revamp-remove-link`. 주요 커밋: 홈/탭 정리 → 계단 테두리 통일 → 펫/탭 정리 → `59ad97b feat(world): 데코 꾸미기 + 가챠 데코화 + 폴더 보관함`. **유튜브 별창 + 배치목록 + 유튜브 watch/꽉채움/드래그/슬라이더 작업은 아직 미커밋.**

## 12. 다음 후보

- 미커밋분(유튜브 + 데코 배치목록) 커밋.
- 설정(settings) 탭 실제 구현(현 placeholder).
- 데코 "최하단 레이어"(다른 앱 뒤로) macOS 정밀화 — 현재 미완.
- origin 푸시 / PR.
