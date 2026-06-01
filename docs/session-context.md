# JUMPET — 작업 컨텍스트 메모리

> 이 문서는 지금까지의 작업 맥락과 데스크탑 앱 기능을 한눈에 복기하기 위한 메모다.
> *변하지 않는 명세*는 `docs/`의 각 기능 문서가 SSOT이고, 이 파일은 **현재까지 합의·구현된 상태의 스냅샷**이다.

## 1. 앱 정체성

OS 데스크탑 위에 상시 떠 있는 **캐릭터(픽셀 펫)** + 우클릭으로 열리는 **탭형 통합 메뉴 창**으로 구성된 Electron 데스크탑 펫 게임.
펫 인터랙션 + 일상 도우미(할일·일정·타이머) + 가벼운 수집/가챠 루프의 결합. 영감: Tumblbug "에그덕 키우기".

- 스택: Electron + electron-vite, React + TypeScript, Zustand, emotion(비즈 UI) / className 기반 pixel-theme.css(메뉴 창).
- 아키텍처: FSD-lite + Electron 3-tier(main / preload / renderer).
- 윈도우 2종: **캐릭터 윈도우**(300×300, transparent·frameless, 일반 z-order) + **통합 메뉴 창**(frameless 싱글톤, 모든 기능이 탭).

## 2. SSOT 도메인 패턴

모든 사용자 영속 데이터는 **main 프로세스가 SSOT** (electron-store 영속화 + IPC broadcast). renderer는 Zustand로 read-only 미러.

각 도메인 구성:
- `shared/contracts/{domain}Events.ts` — 타입 + INITIAL 시드
- `main/{domain}/{domain}State.ts` — 순수 reducer
- `main/{domain}/store.ts` — electron-store wrapper
- `main/{domain}/ipc.ts` — get/apply/changed broadcast
- `main/{domain}/index.ts` — barrel
- renderer `entities/{domain}/model/use{Domain}Store.ts` — Zustand 미러 + `initialize{Domain}Sync()` (각 윈도우 entrypoint에서 1회 명시 호출, HMR은 `import.meta.hot.dispose` 방어)

**구현된 도메인**: player(점수/재화), todo, fortune, item(소모 아이템+뽑기), schedule(일정), characterSelection(선택 캐릭터), profile(캐릭터이름/내이름/생일), petSelection(동반 펫 장착).

## 3. 메뉴 창 탭 (10개)

`pages/menu/MenuPage.tsx`의 `TABS`/`renderTab()`에 등록. 순서:
홈(care) · 일정(schedule) · 할일(todo) · 타이머(timer) · 운세(fortune) · 가챠(gacha) · 펫(pet) · 아이템(item) · 유튜브(youtube) · 설정(settings).

- **동작 구현됨**: 홈, 일정, 할일, 타이머, 운세, 가챠, 펫
- **placeholder**: 아이템, 유튜브, 설정

### 탭별 핵심
- **홈(CareTab)**: 하늘/구름/반짝이 씬 + 캐릭터(좌우 화살표로 전환) + 인사 말풍선 + ⭐포인트 칩 + 프로필 행(캐릭터 이름 / 내 이름 / 생일 / 생일까지 D-day) + 돌봄 액션 그리드(밥/놀이/쓰다듬기/눕기).
- **일정(ScheduleTab)**: 캘린더 + 년/월 드롭다운(버튼형) + 일정 추가(시작/종료 날짜·시간 4필드) + 날짜순 정렬. todo와 양방향 삭제 연동(`ScheduleItem.todoId`).
- **할일(TodoTab)**: '일정'/'할일' heading. 프로젝트(칩) 단위, 상단 드롭다운 선택(기본 전체) + 하단 프로젝트 추가. 칩 수정 버튼→x 삭제 버튼. 칩 삭제 시 안에 할일 있으면 함께 삭제 물어봄(없으면 그냥 삭제). 완료 체크 양방향 토글, 완료 취소 시 보상 마이너스(음수 점수 허용).
- **타이머(TimerTab)**: 포모도로 + 픽셀 스톱워치. 완료 시 캐릭터가 상단 배너로 떠서 멘트(휴식도 동일). tick 엔진은 MenuPage에 상주(`backgroundThrottling:false`로 가려져도 동작).
- **운세(FortuneTab)**: 수정구슬(사인파 그라데이션 + 애니메이션), 점수 구슬 안 표시, 등급 별.
- **가챠(GachaTab)**: 가챠 머신(반짝이 연출), 내 포인트 표시, 마이너스 점수면 뽑기 불가.
- **펫(PetTab)**: 동반 펫 장착(삐약이/몰랑이/반짝이). 캐릭터와 별개.

## 4. 캐릭터 / 에셋

- 캐릭터 4종: **piyoo / qupee / suupee / wingpee** (구 'dog' 제거). JUMPET_4에서 이식.
- 카탈로그: `entities/character/assets/{id}/{mood}.{ext}` → `CHARACTER_ASSETS: Record<CharacterId, Record<Mood,string>>` (매핑 누락이 컴파일 에러).
- 홈 씬용 **합본 이미지**: `entities/character/assets/{id}/home.png` (캐릭터+잔디 바닥 한 장, 1017×708) → `HOME_SCENE_ASSETS: Record<CharacterId,string>`.
- 탭 아이콘: `pages/menu/tabIcons.ts` — 10종 16×16 다색 픽셀 아트(`TAB_ICON_ART`), `PixelArt`로 렌더(`cell={1.5}`).
- 픽셀 렌더러: `PixelArt.tsx`(다색 grid→SVG rects), `PixelIcon`(단색).

## 5. 클릭 멘트 / 호격 규칙

- 캐릭터 좌클릭 시 멘트. 50% 확률 `"(캐릭터 이름)(이/가) ..."`, 10% `"(이름)(아/야)"` 호격.
- **주격 '(캐릭터 이름)가'** = 프로필의 **캐릭터 이름**(예: 웰시코기/큐피), **호격**은 **내 이름**(예: 조조/형님).
- 조사 선택: 받침 유무로 이/가, 아/야 결정 `((code-0xAC00)%28 !== 0)`.
- 멘트는 우측 정렬. 말풍선 컬러는 하늘색 테마.

## 6. UI 리디자인 진행 상태 (현재 작업)

레퍼런스 이미지에 맞춰 메뉴 UI 픽셀아트화 진행 중. 합의: ① 탭 아이콘 = 커스텀 다색 픽셀 일러스트(이모지 X), ② 계단식 픽셀(clip-path) 모서리 유지.

- **탭바**: 라운드 카드 5열 그리드 + 컬러 16×16 아이콘 — 완료.
- **홈 씬**: 하늘 그라데이션 + 구름(`home_cloud2.png`) + 반짝이 + 캐릭터+바닥 합본 이미지(`.home-figure`) + 인사 말풍선 + ⭐포인트 칩 + 프로필 행 — 완료. 미세 조정 반복 중(이미지 크기/위치/말풍선 위치).
- 현재 `.home-figure`: `bottom:20px; width:calc(100% - 80px)`. 말풍선 `top:58px`.
- 레퍼런스와 픽셀 단위로 더 맞추려면 **실행 화면 스크린샷**이 필요(나는 화면을 직접 못 봄). `Claude_Preview`/`Claude_in_Chrome` MCP로 직접 스크린샷 캡처도 가능.

## 7. 개발 / 빌드 운영 메모

- **dev 핫리로드**: renderer는 HMR 됨. **main/preload 수정은 자동 재시작 안 됨** → `pkill -f electron-vite` + `pkill -f "Desktop/jumpet/node_modules/electron"` 후 `npm run dev`.
- 타입체크: `npm run typecheck:web`.
- 배포: 미서명 arm64 dmg 빌드 가능 (`CSC_IDENTITY_AUTO_DISCOVERY=false`) → `dist/game-0.0.1-arm64.dmg`.
- localStorage는 dev에선 메뉴/펫 창 공유(동일 origin)지만 패키징 시 불안정 → profile을 main SSOT로 이전한 이유.
- gh CLI 미설치. PR은 GitHub API + `git credential fill` 토큰 사용(토큰 로그 금지).
- `.claude/launch.json`에 dev/start/static 서버 설정 저장됨.

## 8. 컨벤션

- 커밋/푸시는 직접 git 금지 → `/commit`, `/pr-description-simple` 스킬 사용.
- Prettier: tabWidth 4, semi false, singleQuote, singleAttributePerLine.
- 네이밍: 축약어 금지, 복수/단수 구분, enum PascalCase·값 SNAKE_CASE, 글로벌 상수 SNAKE_CASE.
- 의존 방향: shared → entities → features → widgets → app/pages (역방향 import 금지), slice는 index.ts barrel.
- 픽셀 폰트 Galmuri11(400/700만 존재, 중간 weight는 `-webkit-text-stroke`로 흉내).

## 9. 폐기된 것

링크 도메인·링크 미니 바·'즐겨찾기 바 표시' 토글, 기능별 별창(todo/fortune/care/gacha.html + `open{Name}Panel`) — 전부 통합 탭 창으로 흡수.

## 10. 다음 후보 작업

- 홈 씬을 레퍼런스와 픽셀 단위로 마무리(스크린샷 기반).
- 펫 픽셀 스프라이트를 실제 이미지(`JUMPET_4/app/assets/pets/`)로 교체(사용자 힌트, 미확정).
- 아이템 / 유튜브 / 설정 탭 실제 구현(현재 placeholder).
- 최근 UI 리디자인(탭 아이콘·홈 씬·합본 이미지)은 아직 커밋 안 됨.
