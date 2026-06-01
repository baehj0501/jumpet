# 설정 (Settings)

> 구 `info-panel.md`(정보 패널)를 **설정으로 확장 통합**한다. 기존의 점수·레벨 표시(읽기 전용)에 더해, 참조 앱(JUMPET_4)의 설정 기능(캐릭터/테마/크기/호칭/생일)을 한 패널에 담는다.

## 구현 현황 (코드가 진실 — 아래 명세는 원래 계획)

설정은 **별창이 아니라 메뉴 창의 `설정` 탭**(`pages/menu/tabs/SettingsTab.tsx`)으로 산다. 현재 4섹션:

1. **테마** — 6종(`skyblue`/`green`/`babypink`/`brown`/`light`/`dark`) 칩 그리드. 새 `settings` 도메인(SSOT)의 `theme`. `MenuPage`가 `document.documentElement[data-theme]`로 반영. `skyblue`는 `:root` 기본값(별도 블록 없음).
2. **캐릭터 크기** — 슬라이더 50~200%(`PET_SCALE_MIN/MAX`). `settings.petScale`. 캐릭터 창(`App.tsx`)이 구독해 `window:setSize`로 윈도우 자체를 중심 고정 리사이즈(기본 300px×scale). 이미지가 `objectFit:contain`이라 창 크기=캐릭터 크기.
3. **내 정보** — `profile` 도메인(캐릭터 이름/내 이름/생일) 재사용. 홈 탭과 같은 SSOT 편집. `ProfileRow`는 `pages/menu/ProfileRow.tsx`로 추출해 홈/설정이 공유.
4. **앱** — 버전(`app:getVersion`), 데이터 초기화(`app:resetAll` — 전체 store clear 후 relaunch, confirm 가드), 앱 종료(`app:quit`).

새 도메인: `shared/contracts/settingsEvents.ts` + `main/settings/` + `entities/settings/`. **레벨 시스템은 아직 미구현**(아래 명세는 보류).

## 한 줄 정체성

플레이어 상태(점수·레벨)를 보여주고, 캐릭터·테마·크기·내 정보(호칭/생일) 같은 **앱 환경설정**을 한 곳에서 바꾸는 패널.

## 명세

### 1. 내 상태 (읽기 전용 — 구 정보 패널)

- **가진 점수** 표시.
- **레벨** 표시 (+ 다음 레벨까지 진행도 — 선택).
- 출처는 player 도메인 ([player-score.md](./player-score.md)). 이 영역은 read-only 뷰.

### 2. 캐릭터 선택

- 보유 캐릭터 중 현재 캐릭터를 고른다.
- 선택 시 캐릭터 윈도우의 표시 캐릭터(`characterId`)가 즉시 바뀐다.
- 현재 에셋은 `dog` 1종뿐 → 다종 캐릭터는 에셋 작화에 의존(Open Question). 카탈로그 구조(`entities/character/assets/{characterId}/{mood}.{ext}`)는 이미 다종을 전제로 설계됨.

### 3. 테마

- 6종 테마(예: 스카이블루 / 연두 / 핑크 / 브라운 / 라이트 / 다크).
- 선택 시 패널 UI 색 + 다른 윈도우(캐릭터/유튜브 등)에 테마 broadcast.
- 테마는 색상 토큰 묶음(accent/bg/text/border 등)으로 정의.

### 4. 캐릭터 크기

- 슬라이더로 캐릭터 표시 배율 조정 (예: 50~400%).
- 변경 시 캐릭터 윈도우에 `set-pet-scale` 류 신호 전달 → 즉시 반영.

### 5. 내 정보

| 항목 | 설명 | 연동 |
|---|---|---|
| 호칭(nickname) | 사용자를 부르는 이름. 말풍선/멘트에서 사용 가능 | messages |
| 생일(birthday) | 당일 축하 알림 + 축하 모션 | [schedule.md](./schedule.md) 의 생일 체크 |

## 레벨 시스템 (미정)

명세에 '레벨'은 있으나 공식/구간/보상은 미정. 점수와 강결합이라 **PlayerState 확장**이 자연스럽다.

```ts
// src/shared/contracts/playerEvents.ts (확장)
export type PlayerState = {
    score: number                  // 현재 잔액 (뽑기로 변동)
    cumulativeScore: number        // 누적 (감소 X) — 레벨 계산용 (권장: 옵션 A)
    level: number                  // cumulativeScore에서 파생, 캐싱
}
```

```ts
const levelToCumulativeScore = (level: number): number => Math.floor(100 * Math.pow(level, 1.5))
const computeLevel = (cumulative: number): number => {
    let level = 1
    while (levelToCumulativeScore(level + 1) <= cumulative) level += 1
    return level
}
```

- **옵션 A(누적 점수 기반) 권장** — 뽑기로 잔액이 줄어도 레벨은 안 내려감(부정적 경험 방지).
- 레벨업 시 "레벨 업! 🎊" 말풍선 + 축하 모션 + (선택) 보너스. 보상 정책은 Open Question.

## 아키텍처 / 데이터 흐름

### 데이터 소유

설정값은 영속 데이터이므로 main이 SSOT. 점수/레벨은 player 도메인, 환경설정은 새 `settings` 도메인.

```ts
// src/shared/contracts/settingsEvents.ts (신규)
export type ThemeId = 'skyblue' | 'green' | 'babypink' | 'brown' | 'light' | 'dark'

export type SettingsState = {
    characterId: string        // 현재 캐릭터
    theme: ThemeId
    petScale: number           // 0.5 ~ 4.0
    nickname: string
    birthday: string | null    // 'MM-DD' 또는 'YYYY-MM-DD'
}

export type SettingsEvent =
    | { type: 'selectCharacter'; characterId: string }
    | { type: 'setTheme'; theme: ThemeId }
    | { type: 'setScale'; scale: number }
    | { type: 'setNickname'; nickname: string }
    | { type: 'setBirthday'; birthday: string | null }
```

### 변경 → 브로드캐스트 → 즉시 반영

```
[설정 패널 — 테마 변경]
   ↓ useSettingsStore.apply({ type: 'setTheme', theme: 'dark' })
   ↓ window.api.settings.apply
[main: settings reducer]
   1. 값 검증(스케일 범위 등) + 저장
   ↓ writeSettingsState + broadcast 'settings:changed'
   ↓
모든 윈도우(캐릭터/유튜브/설정)가 테마/스케일/캐릭터를 미러링해 즉시 갱신
```

- 캐릭터 윈도우는 `settings:changed`를 구독해 `characterId`/`petScale`/`theme`를 반영.
- 생일은 일정 도메인의 알림 체크가 참조 ([schedule.md](./schedule.md)).

### 별창 UI

```
src/renderer/settings.html
src/renderer/src/pages/settings/
    ├── main.tsx
    └── SettingsPage.tsx   # 내 상태(점수/레벨) + 캐릭터/테마/크기/내정보 섹션
```

### 관련 코드 (계획)

| 영역 | 파일 |
|---|---|
| 설정 타입 (공유) | `src/shared/contracts/settingsEvents.ts` (신규) |
| PlayerState 확장(레벨) | `src/shared/contracts/playerEvents.ts` |
| settings reducer | `src/main/settings/settingsState.ts` (신규) |
| 영속화 | `src/main/settings/store.ts` (신규) |
| IPC | `src/main/settings/ipc.ts` (신규) |
| level 계산 + 레벨업 감지 | `src/main/playerState/playerState.ts` + `ipc.ts` |
| 별창 entry | `src/renderer/settings.html` (신규) |
| UI | `src/renderer/src/pages/settings/` (신규) |
| renderer slice | `src/renderer/src/entities/settings/` (신규) |

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | player (점수·레벨 read), character (캐릭터/크기/테마 반영), schedule (생일 참조) |
| **호출됨** | 우클릭 메뉴의 '⚙️ 설정' / 레벨업 시 character (모션/말풍선) |

## Open Questions

- **레벨 공식·보상** — A/B/C 모델 중 선택, 레벨업 보상 정책 — **가장 큰 미정 사항**
- **캐릭터 다종화** — 현재 에셋은 `dog` 1종. 참조 앱은 4종(윙피/슈피/쿠피/피요). jumpet 캐릭터 라인업·에셋 작화 결정 필요.
- **테마 적용 범위** — 캐릭터 윈도우(투명 배경)에 테마 색을 어디까지? 말풍선/패널 위주?
- **첫 실행 캐릭터 선택 플로우** — 참조 앱은 별도 setup 창에서 캐릭터를 먼저 골랐다. jumpet도 최초 1회 선택 UX를 둘지(설정 패널로 충분한지).
- **표시 항목** — 내 상태에 누적 통계(뽑기 횟수/완료 TODO 등)도 넣을지.
- **생일 포맷** — 연도 포함 여부, 매년 반복 처리.
