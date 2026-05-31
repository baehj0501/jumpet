# 돌봄 (Care)

> 구 `feeding-and-playing.md`(먹이주기 + 놀아주기)를 대체한다. 참조 앱(JUMPET_4)의 "돌봄 패널" 비즈니스 로직을 이식했다.

## 한 줄 정체성

캐릭터를 직접 보살피는 패널. **밥/놀이/쓰다듬기/눕기** 네 가지 액션으로 포인트를 얻고 감정·모션 반응을 본다. 별도 인벤토리 소모 없이 **액션 + 쿨타임**으로 동작한다.

## 명세

### 돌봄 액션 4종

| 액션 | 이모지 | 포인트 보상 | 쿨타임 | 반응(감정/모션) | 말풍선 예 |
|---|---|---|---|---|---|
| 밥 주기 | 🍚 | +5~10 랜덤 | 90초 | 먹는 모션 (happy) | "냠냠! 🍖" |
| 놀아주기 | 🎮 | +5~10 랜덤 | 90초 | 신난 모션 (happy) | "신난다! ⚡" |
| 쓰다듬기 | 🤗 | +5~10 랜덤 | 120초 | 애정 모션 (happy) | "좋아 ✨" |
| 눕기 | 🛋️ | +5~10 랜덤 | 150초 | 쉬는 모션 (default/sleep) | "누웠다~ 🛋️" |

> **스탯 시스템은 도입하지 않는다.** 참조 앱의 HP·배고픔·기분 스탯 변동은 가져오지 않기로 결정. 돌봄은 *포인트 보상 + 감정/모션 반응*만 일으킨다. (행동 상태 `idle`/`walking`과 별개의 감정 축은 [character.md](./character.md) 참고.)

### 쿨타임 규칙

- 각 액션은 사용 직후 쿨타임에 들어간다 (위 표 기준).
- 쿨타임 중 해당 버튼은 비활성/카운트다운 표시. 다른 액션은 독립적으로 사용 가능.
- 쿨타임은 **패널이 닫혀 있어도 흐른다** → 마지막 사용 시각(timestamp)을 영속화하고, 패널을 열 때 남은 쿨타임을 계산.
- 쿨타임의 SSOT 위치(아래 아키텍처)와 정확한 초 단위 값은 조정 가능.

### 포인트 보상

- 모든 돌봄 액션은 +5~10점 랜덤 ([player-score.md](./player-score.md)에 출처로 등록).
- 보상 범위·랜덤 룰은 main의 reducer 안에서 결정 (클라이언트가 값을 보내지 않음).

### UI 패널

- 별창 BrowserWindow.
- 4개 액션 버튼 그리드 + 각 버튼의 쿨타임 표시.
- 액션 실행 → 캐릭터 윈도우에서 감정/모션 반응 + 말풍선.
- 현재 보유 포인트 표시(선택).

## 아키텍처 / 데이터 흐름

### 돌봄은 얇은 진입점 + 쿨타임 상태

돌봄 자체 데이터는 **액션별 마지막 사용 시각(쿨타임용)** 정도로 작다. 포인트는 player, 반응은 character/messages가 담당.

```
[돌봄 패널 — 사용자가 '밥 주기' 클릭]
   ↓ useCareStore.apply({ type: 'feed' })
   ↓ window.api.care.apply
[main: care reducer]
   1. 쿨타임 확인 (now - lastUsedAt.feed >= 90s?)
      - 쿨타임 중이면 no-op + 남은 시간 반환
   2. lastUsedAt.feed = now
   ↓ 부수효과 (main/index.ts에서 콜백 조립):
   - applyPlayerEvent({ type: 'careAction' })  → +5~10 랜덤
   - broadcastCharacterMotion('eating', 3000)  → 감정/모션
   - broadcastCharacterSpeech(pickRandomCareMessage('feed'))  → 말풍선
   ↓ writeCareState + broadcast 'care:changed'
```

### 도메인 모델 제안

`src/shared/contracts/careEvents.ts` (신규):

```ts
export type CareAction = 'feed' | 'play' | 'pet' | 'rest'

export const CARE_COOLDOWN_MS: Record<CareAction, number> = {
    feed: 90_000,
    play: 90_000,
    pet: 120_000,
    rest: 150_000,
}

export type CareState = {
    lastUsedAt: Record<CareAction, number>   // epoch ms, 0이면 미사용
}

export type CareEvent = { type: CareAction }
```

### 부수효과 조립 (main/index.ts)

기존 `registerTodoIpc({ onTodoCompleted })` 패턴 그대로:

```ts
registerCareIpc({
    onCareAction: (action) => {
        applyPlayerEvent({ type: 'careAction' })            // +5~10
        broadcastCharacterMotion(MOTION_BY_ACTION[action], 3000)
        broadcastCharacterSpeech(pickRandomCareMessage(action))
    },
})
```

care 모듈은 player/character/messages를 직접 import하지 않고, "돌봄 액션 발생" 사실만 콜백으로 위임한다.

### 멘트 풀 위치

- `src/shared/contracts/messagePools.ts` (또는 main 안):
  ```ts
  export const CARE_MESSAGES: Record<CareAction, string[]> = {
      feed: ['냠냠! 🍖', '맛있어요!', /* ... */],
      play: ['신난다! ⚡', /* ... */],
      pet:  ['좋아 ✨', /* ... */],
      rest: ['누웠다~ 🛋️', /* ... */],
  }
  ```
- 말풍선 시스템은 [messages.md](./messages.md).

### 새 패널 entry

```
src/renderer/care.html
src/renderer/src/pages/care/
```
`electron.vite.config.ts`의 rollup input 등록.

### 관련 코드 (계획)

| 영역 | 파일 |
|---|---|
| 타입 (공유) | `src/shared/contracts/careEvents.ts` (신규) |
| reducer (쿨타임 판정) | `src/main/care/careState.ts` (신규) |
| 영속화 | `src/main/care/store.ts` (신규) |
| IPC | `src/main/care/ipc.ts` (신규) |
| barrel | `src/main/care/index.ts` (신규) |
| renderer slice | `src/renderer/src/entities/care/` (신규) |
| 돌봄 패널 | `src/renderer/src/pages/care/` (신규) |

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | player (포인트 +5~10), character (감정/모션), messages (말풍선) |
| **호출됨** | 우클릭 메뉴의 '🐾 돌봄' |

→ 자기 도메인은 쿨타임 상태 정도로 얇다. 포인트·반응은 다른 도메인이 나눠 가짐.

## Open Questions

- **쿨타임 SSOT 위치** — main(care 도메인)에서 관리 권장(패널 닫혀도 흐름). renderer-only 타이머로는 멀티 윈도우/재시작에 약함.
- **멘트 풀 개수** — 액션별 몇 개씩? (참조 앱은 액션당 소수. 운세/돌봄 멘트 분량은 messages.md와 함께 결정.)
- **모션 매핑** — 각 액션 → 어떤 GIF/감정? (`eating`/`playing`/`petting`/`resting` 등 모션 키 정의 필요. 현재 캐릭터 에셋은 `default` 1종뿐 → 에셋 작화 의존.)
- **쿨타임 중 UI** — 버튼 비활성 + 남은 초 카운트다운? 회색 처리만?
- **연속 사용 정책** — 4개를 연달아 쓰는 건 허용(각자 독립 쿨타임). 한 번에 묶어 쓰는 "전체 돌봄" 버튼은 없음.
- **포인트 보상 범위** — 5~10이 적정한지(참조 앱 기준). todo 완료(1~5)와의 밸런스 검토.
