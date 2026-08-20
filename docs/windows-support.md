# 윈도우 지원 작업 노트

맥에서 개발한 Loopf(Electron 데스크탑 펫)를 **윈도우에서 이어 작업**하기 위한 셋업 + 점검 목록.
이 브랜치(`fix/windows-support`)에서 윈도우 전용 수정을 진행한다. (맥 확정본은 `feat/menu-revamp-remove-link` @ `7a38362`)

---

## 1. 윈도우에서 개발 환경 세팅

준비물: [Git for Windows](https://git-scm.com/download/win), [Node.js](https://nodejs.org) (맥과 같은 메이저 버전 권장)

```bash
# 처음이면 클론
git clone https://github.com/baehj0501/jumpet.git
cd jumpet

# 이 작업 브랜치로 전환
git checkout fix/windows-support

# 의존성 설치 후 개발 실행
npm install
npm run dev
```

- `node_modules`는 git에 없으니 `npm install` 필수.
- 저장 데이터는 기기별 로컬(`%APPDATA%\loopf`)이라, 윈도우에선 온보딩부터 시작한다(정상).

## 2. 커밋/푸시 흐름 (양쪽 기기 동기화)

```bash
git add -A
git commit -m "fix(windows): ..."   # (맥에선 /commit 스킬 규칙, 윈도우 CLI에선 직접)
git push -u origin fix/windows-support
```

맥으로 돌아와 이어 받을 때: `git checkout fix/windows-support && git pull`

## 3. 윈도우에서 특히 점검할 곳 (맥 전용 분기 존재)

Electron은 창 z-order/투명/트레이 동작이 OS마다 달라, 아래가 윈도우에서 다르게 보일 수 있다.

- [ ] **투명·프레임리스 창** — 캐릭터 창(`src/main/index.ts` `frame:false, transparent:true`), 메뉴/유튜브/월드 창. 윈도우는 투명 창 모서리 검정·리사이즈·그림자 이슈가 있을 수 있음.
- [ ] **월드(꾸미기) 오버레이 z-order** — `pinWorldToBottom()`(`index.ts:133`)이 macOS만 `setAlwaysOnTop(true, 'normal', -1)`로 "일반 창 아래"에 고정, 그 외 OS는 `setAlwaysOnTop(false)`. 윈도우에서 바탕화면 데코가 의도한 레이어에 깔리는지 확인.
- [ ] **클릭 통과** — `setIgnoreMouseEvents(true, { forward })`(캐릭터/월드 창). 윈도우에서 통과·hover 동작 확인.
- [ ] **작업표시줄/종료 경로** — `skipTaskbar:true`. 윈도우에서 작업표시줄에 안 뜨므로, 우클릭 메뉴(종료)나 트레이로 종료 가능한지 확인.
- [ ] **앱 종료 동작** — `index.ts:378` `process.platform !== 'darwin'` 분기(모든 창 닫으면 종료 등).
- [ ] **로그인 시 자동 실행** — `setLoginItemSettings`(`src/main/settings/ipc.ts`). 윈도우 레지스트리 Run 키 등록 동작 확인.
- [ ] **유튜브 뷰어(webview 별창)** — 프레임 이미지 + webview 위치/줌. 윈도우에서 재검증(과거 메모: 윈도우에선 다시 손봐야 함).
- [ ] **폰트(Galmuri11)** — 번들 폰트라 문제없어야 하나 픽셀 렌더 확인.
- [ ] **창 드래그·자율 보행** — JS `setPosition`/작업영역 경계(`getDisplayWorkArea`) 윈도우 좌표 확인.

## 4. 윈도우 배포 빌드

```bash
npm run package:win
```

- 산출물: `dist/`. NSIS 인스톨러(`.exe`) + 필요 시 포터블.
- **윈도우에서 빌드하면 Wine 불필요**(맥에서 win 빌드하려면 Wine 필요). 그래서 윈도우 빌드는 윈도우 기기에서 하는 게 정석.
- 미서명 빌드는 SmartScreen 경고가 뜰 수 있음("추가 정보 → 실행").

---

## 진행 로그 (여기에 수정 내역 적기)

- (예) [ ] 캐릭터 창 투명 모서리 검정 → 수정
- (예) [ ] 월드 오버레이 z-order → 수정
