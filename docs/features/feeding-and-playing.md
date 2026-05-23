# 먹이주기 + 놀아주기

두 시스템은 동작 패턴이 거의 동일해서 한 문서에 묶음.

## 한 줄 정체성

가챠로 얻은 **소모성 아이템**(먹이/놀이)을 캐릭터에게 사용 → 점수 보상 + GIF 모션 + 말풍선.

## 명세 (신 다이어그램)

### 공통 동작

| 항목 | 먹이주기 | 놀아주기 |
|---|---|---|
| 종류 수 | 15개 (예: 뼈다귀, 사료, 간식 …) | 15개 (예: 공, 인형, 원반 …) |
| 선택 가능 조건 | **보유한 먹이만** | **보유한 놀이만** |
| 사용 시 | 1개 소모 (인벤토리 count -1) | 1개 소모 |
| 모션 | 먹는 모션 3초 (GIF) | 신난 모션 3초 (GIF) |
| 점수 | +1~5 랜덤 | +1~5 랜덤 |
| 멘트 | 먹이 멘트 30개 중 랜덤 | 놀이 멘트 30개 중 랜덤 |

### 사용 흐름

```
[사용자가 우클릭 → 먹이주기 (또는 놀아주기)]
   ↓
먹이 패널 별창 열림
   ↓
보유한 먹이 목록 표시 (count > 0인 것만)
   ↓
사용자가 한 종류 선택
   ↓
1. 인벤토리에서 1개 차감 — applyItemEvent({ type: 'consumeFood', itemId })
2. player 점수 가산 — applyPlayerEvent({ type: 'feed' }) (reducer가 1~5 랜덤)
3. 캐릭터 GIF 모션 3초 재생
4. 말풍선: 30개 멘트 중 랜덤 + 획득 점수 표시 ("냠냠~ 맛있어요! 🍖 +3점")
   ↓
3초 후 GIF → PNG 복귀
```

### 멘트 풀

- 먹이 멘트 30개·놀이 멘트 30개를 텍스트로 작성.
- 사용 시 랜덤으로 1개 선택.
- v2.0 §10.2 참고 — "냠냠~ 맛있어요! 🍖" / "신난다! 🎉" 등.

### UI 패널 (먹이 패널 / 놀이 패널)

- 별창 BrowserWindow.
- 보유한 아이템만 그리드 또는 리스트로 표시.
- 각 아이템에 보유 개수 배지 (예: `🍖 ×3`).
- 보유 0개인 아이템은 회색·비활성 또는 숨김.
- 사용 후 그 아이템의 count 갱신 (count 0 되면 해당 아이템 비활성/사라짐).
- 사용 직후 자동으로 패널 닫힘? 또는 사용자가 ✕ 버튼으로 닫음? — Open Question.

## 아키텍처 / 데이터 흐름

이 두 기능은 **인벤토리(소모) + player(점수) + character(GIF) + messages(말풍선)** 의 합성. 자기 도메인이 거의 없고 진입점 역할.

### 데이터 흐름

```
[먹이 패널 — 사용자가 '뼈다귀' 클릭]
   ↓ onUseFood('food_bone_01')
   ↓
1. useInventoryStore.apply({ type: 'consumeFood', itemId: 'food_bone_01' })
   ↓ window.api.item.apply
   [main: ItemReducer가 consumable['food_bone_01'].count -= 1]
   ↓ broadcastItemState

2. 같은 시점 main이 부수효과로:
   - applyPlayerEvent({ type: 'feed' }) → 1~5 랜덤 점수
   - 캐릭터 윈도우에 webContents.send('character:motion', 'feeding') → GIF 3초
   - 캐릭터 윈도우에 webContents.send('character:speech', { text: '...', score: 3 }) → 말풍선
```

→ 자기 도메인은 **얇은 진입점** 정도. 핵심 로직은 인벤토리/player/character가 나눠 가짐.

### 부수효과 조립 (main/index.ts)

```ts
// src/main/index.ts (예시)
registerInventoryIpc({
    onFoodConsumed: () => {
        applyPlayerEvent({ type: 'feed' })
        broadcastCharacterMotion('feeding', 3000)
        broadcastCharacterSpeech(pickRandomFoodMessage())
    },
    onToyConsumed: () => {
        applyPlayerEvent({ type: 'play' })
        broadcastCharacterMotion('playing', 3000)
        broadcastCharacterSpeech(pickRandomToyMessage())
    },
})
```

이 패턴이 일관되게 적용되면 사용 시점의 모든 부수효과가 한 곳에 모임.

### 새 패널 entry

```
src/renderer/feed.html       # 먹이 패널 entry
src/renderer/play.html       # 놀이 패널 entry
src/renderer/src/pages/
├── feed/                    # 먹이 패널 React tree
└── play/                    # 놀이 패널 React tree
```

`electron.vite.config.ts`의 rollup input 등록.

### 멘트 풀 위치

- `src/shared/contracts/messagePools.ts` (또는 main 안):
  ```ts
  export const FOOD_MESSAGES: string[] = [
      '냠냠~ 맛있어요! 🍖',
      '와, 이거 제일 좋아해요!',
      // ... 30개
  ]
  export const TOY_MESSAGES: string[] = [ ... ]
  ```
- 자세한 말풍선 시스템은 [messages.md](./messages.md)

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | inventory (소모), player (점수), character (GIF), messages (말풍선) |
| **호출됨** | 우클릭 메뉴의 '🍖 먹이주기' '🎮 놀아주기' |

이 두 기능은 **다른 시스템들의 통합 진입점**. 단독 구현 의미 작음 — 인벤토리·말풍선·GIF가 같이 있어야 의미.

## Open Questions

- **먹이/놀이 종류 데이터** — 각 15개의 이름·이모지·visual 정의 (가챠 풀과 같이 결정될 가능성)
- **멘트 풀 작성** — 60개(먹이 30 + 놀이 30)의 한국어 문구
- **사용 후 패널 동작** — 자동 닫힘 / 사용자가 닫기 / 연속 사용 가능?
- **스탯과의 연결** (v2.0 §6) — 먹이는 포만감 +30, 에너지 +10 등 스탯 변경. 스탯 시스템이 폐기됐다면 무관
- **사용 시 캐릭터 위 시각 효과** — 먹이를 던지는 애니메이션? 그냥 GIF만?
- **인벤토리 빈 상태에서 메뉴 활성/비활성** — 보유 0이면 우클릭 메뉴 항목 자체를 회색 처리?
- **여러 종류 같이 사용 가능?** — 한 번에 먹이 5개 사용? 1개만?
