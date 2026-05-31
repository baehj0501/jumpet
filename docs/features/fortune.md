# 운세 시스템

## 한 줄 정체성

매일 아침 자동으로 뜨는 "오늘의 운세" 팝업. 60~100점 보상으로 사용자가 매일 한 번 들여다볼 이유를 만든다.

## 명세 (신 다이어그램 — v2.0엔 없던 신규 기능)

### 자동 트리거

- **아침에 자동 24시간 랜덤** — 매일 한 번 자동 팝업.
  - 정확한 트리거 시각은 미정 (Open Question)
  - 한 번 본 후 24시간 잠금 (다시 보려면 다음 날 아침)
- **수동 트리거** — 우클릭 메뉴의 '🌸 운세' 항목으로도 열기 가능 (당일 이미 봤다면 같은 결과 표시?)

### 보상

- **60~100점 랜덤 지급** (다이어그램 명시)
- 운세를 본 시점에 즉시 player 점수에 가산

### 운세 컨텐츠

- **365개 종류 운세 랜덤** — 운세 메시지 풀 365개.
- **1·2·3·4·5단계로 분류** — 등급/운수 단계.
  - 추정: 5단계가 가장 좋고 1단계가 가장 안 좋음 (대길 → 흉) — 또는 그 반대 (Open Question)
  - 단계별로 점수 분포가 다를 수도 (예: 5단계 → 90~100점, 1단계 → 60~70점)
- 운세 메시지 텍스트 + 단계 표시 + 점수 안내.

### UI

- **닫기 버튼**.
- **별창(BrowserWindow)으로 구현됨** — 다른 패널(todo 등)과 일관. 340×320 고정 크기.
- 단계 라벨(대길~대흉) + 운세 메시지 + 획득 점수 표시.
- 표시 시간 제한 없음 (사용자가 닫을 때까지).

## 아키텍처 / 데이터 흐름

### 도메인 모델 제안

`src/shared/contracts/fortuneEvents.ts` (신규):

```ts
export type FortuneLevel = 1 | 2 | 3 | 4 | 5

export type FortuneRecord = {
    date: string                  // 'YYYY-MM-DD'
    fortuneId: number             // 0~364 (365개 풀의 index)
    level: FortuneLevel
    scoreAwarded: number          // 60~100
    text: string                  // 운세 메시지
    viewedAt: number              // 사용자가 본 timestamp
}

export type FortuneState = {
    today: FortuneRecord | null
    history: FortuneRecord[]      // 과거 운세 (옵션)
}

export type FortuneEvent =
    | { type: 'roll' }             // 오늘 운세 뽑기 + 점수 가산
    | { type: 'view' }              // 사용자가 봤음을 기록 (자동 트리거 후 닫기)
```

### 데이터 흐름

```
[앱 시작 또는 자정 → 매일 첫 사용자 활동]
   ↓
main이 검사: 오늘 fortune이 있나?
   ├── 있음 → 이미 봤거나 미확인 상태 (재팝업 X)
   └── 없음 → 새 fortune 생성
       ↓
       applyFortuneEvent({ type: 'roll' })
       1. 365개 풀에서 랜덤 선택
       2. 단계 결정 (분포 룰)
       3. 점수 60~100 랜덤
       4. fortuneRecord 생성 + writeFortuneState
       5. applyPlayerEvent({ type: 'fortune' }, scoreAwarded)
       6. broadcast 'fortune:changed'
       ↓
       모든 윈도우가 today fortune 존재 인지
       ↓
       캐릭터 윈도우(또는 운세 별창)가 자동으로 팝업 표시
```

### 자동 트리거 — 어떻게 "매일 아침" 감지?

옵션:
- (A) **앱 시작 시 확인** — 오늘 fortune 없으면 즉시 생성·표시. 사용자가 아침에 PC 켜자마자.
- (B) **자정 cron** — `setInterval` 또는 `node-schedule`로 자정에 새 fortune. 다음 사용자 활동 시 팝업.
- (C) **사용자 첫 활동 감지** — 마지막 활동 시간을 기록. 오늘 첫 인터랙션이면 트리거.

추천: **(A) + (C) 혼합** — 앱이 24시간 떠있지 않을 가능성 고려. 앱 시작 또는 첫 활동 시 "오늘 fortune 없으면 만든다".

### 단계 분포 룰 (제안)

365개 운세에 단계가 어떻게 분포되는지:

```ts
const LEVEL_DISTRIBUTION: Record<FortuneLevel, number> = {
    5: 0.10,   // 10% — 대길
    4: 0.20,   // 20% — 길
    3: 0.40,   // 40% — 보통
    2: 0.20,   // 20% — 흉
    1: 0.10,   // 10% — 대흉
}

const SCORE_BY_LEVEL: Record<FortuneLevel, [number, number]> = {
    5: [91, 100],
    4: [81, 90],
    3: [71, 80],
    2: [66, 75],   // 살짝 겹침 — 단계 차이가 너무 크지 않게
    1: [60, 70],
}
```

→ 정확한 분포는 사용자 결정 사항.

### 새 패널 entry (별창 옵션 선택 시)

```
src/renderer/fortune.html
src/renderer/src/pages/fortune/
```

또는 캐릭터 위 React 모달이면 entry 추가 없이 캐릭터 윈도우 안에서 표현.

### 관련 코드 (계획)

| 영역 | 파일 |
|---|---|
| 타입 (공유) | `src/shared/contracts/fortuneEvents.ts` |
| 운세 풀 데이터 | `src/main/fortune/pool.ts` 또는 `src/shared/contracts/fortunePool.ts` |
| reducer | `src/main/fortune/fortuneState.ts` |
| 영속화 | `src/main/fortune/store.ts` |
| IPC + 자동 트리거 (setInterval/cron) | `src/main/fortune/ipc.ts` |
| renderer slice | `src/renderer/src/entities/fortune/` |
| 팝업 UI | `src/renderer/src/pages/fortune/` (별창) 또는 `widgets/FortunePopup/` (모달) |

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | player (60~100점 가산) |
| **호출됨** | 우클릭 메뉴의 '🌸 운세' / 자동 트리거 (앱 시작·자정) |

## 구현 시 확정된 결정 (코드가 진실)

- **팝업 형태** — 별창(BrowserWindow) 채택. `src/main/panels/openFortunePanel.ts`.
- **자동 트리거** — 앱 시작 시 오늘 운세를 보장(옵션 A). 새로 떴으면 운세 창 자동 표시. 날짜당 멱등(같은 날 재시작·재오픈 시 재추첨/중복 보상 없음).
- **24시간 잠금** — 로컬 날짜('YYYY-MM-DD') 기준. 날짜가 바뀌어야 새 운세.
- **단계 분포·점수 매핑** — `src/main/fortune/pool.ts`에 구현 (5:10% [91-100] / 4:20% [81-90] / 3:40% [71-80] / 2:20% [66-75] / 1:10% [60-70]).
- **점수 가산** — `PlayerEvent { type: 'fortune'; amount }` — 금액은 운세 단계가 결정, player는 잔액 invariant만 책임. 조립은 `main/index.ts`의 `onFortuneRolled` 콜백.
- **메시지 ↔ 단계** — 단계별 풀(`FORTUNE_POOL_BY_LEVEL`)로 묶어 톤이 단계와 어긋나지 않게 함.

## Open Questions

- **365개 운세 컨텐츠 작성** — 현재는 단계별 시드 풀(단계당 3개)만. 정식 풀(직접/AI/외부) 미정 — **가장 큰 미정 사항**
- **이미 본 운세 다시 보기** — 현재 동작: 메뉴로 다시 열면 오늘 결과를 그대로 표시(재추첨/추가 보상 없음). 별도 "기록" 기능은 미정.
- **풀 소진/반복** — 시드 풀이 작아 같은 메시지가 자주 반복될 수 있음. 정식 풀 작성 시 해소.
- **점수 외 보상** — 5단계 때 아이템 보너스? 현재는 점수만.
- **자동 팝업 정책** — 현재는 "새 운세가 뜬 날" 1회 자동 표시. 사용자가 끌 수 있는 옵션(설정)으로 둘지 미정.
