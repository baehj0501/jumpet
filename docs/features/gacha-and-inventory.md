# 가챠 시스템 + 아이템 인벤토리

이 두 시스템은 한 쪽이 다른 쪽 없이 동작하지 못해서 한 문서에 묶음.

## 한 줄 정체성

**가챠** — 점수를 소모해 아이템을 뽑는 핵심 보상 루프.
**인벤토리** — 가챠로 얻은 영구/소모성 아이템을 보관·장착·사용하는 곳.

## 명세

### 가챠 동작 (신 다이어그램 + v2.0 §5)

- **비용**: 1회 50점 소모 (점수 부족 시 가챠 버튼 비활성화).
- **카테고리**: 6개 카테고리에서 랜덤으로 1개 출현.
- **등급별 확률**:

| 등급 | 확률 | 설명 |
|---|---|---|
| 🥉 노말 | 70% | 기본 아이템 |
| 🥈 레어 | 25% | 조금 더 예쁜 아이템 |
| ⭐ 특수 | 5% | 이펙트 포함 특수 아이템 |

- **중복 처리**:
  - **영구형 중복** → 보유 안 추가, 10점으로 환원 (안내 메시지 표시).
  - **소모형 중복** → 보유 개수 +1 (누적).

### 가챠 연출 (v2.0 §5.4)

- 아이템 박스가 화면에 등장하는 애니메이션
- 박스 흔들림/반짝임 효과
- 박스 열림 → 결과 아이템 표시
- 등급별 색상 차이 (노말=회색 / 레어=파랑 / 특수=주황)
- 결과 표시 후 캐릭터가 "기뻐하는 GIF 모션" 재생 (3초) — [character.md](./character.md) 의존

### 인벤토리 구조 (신 다이어그램 4 아이템)

```
아이템 패널
├── 영구 패널
│   ├── 머리
│   ├── 몸통
│   ├── 손
│   └── 펫
└── 소모성 패널
    ├── 먹이
    └── 놀이
```

→ **카테고리 6개 = 영구 4 + 소모 2.**

### 영구 아이템

- 카테고리: 머리 / 몸통 / 손 / 펫.
- **같은 카테고리는 1개만 장착 가능** (v2.0 §7.2). 머리 모자 2개 동시 X.
- 이미 장착된 아이템 다시 클릭 시 해제.
- 장착 시 캐릭터 위에 오버레이로 표시.
- **중복 보유 불가** — 가챠에서 또 나오면 10점 환원.

### 소모성 아이템

- 카테고리: 먹이 / 놀이.
- 종류 각 15개 (먹이 15개, 놀이 15개).
- **개수 누적 가능** — 가챠에서 같은 종류 또 나오면 보유 개수 +1.
- 사용 시 1개 소모 (먹이 패널·놀이 패널에서 사용).
- 자세한 사용 흐름은 [feeding-and-playing.md](./feeding-and-playing.md).

### 획득 방법 (v2.0 §7.3)

- **기본 아이템 일부는 시작 시 잠금 해제** (어떤 것인지 미정).
- 나머지는 가챠로만 획득.

### 시작 시 보유

- 명세 — 일부 영구 아이템(예: 기본 모자) + 일부 소모성(예: 먹이 5개) 보유한 상태로 시작?
- 신 다이어그램 "보유한 먹이/놀이만 선택 가능" 룰을 고려하면 **최소 시드는 있어야** 새 사용자가 빈 인벤토리로 시작하지 않음.

## 아키텍처 / 데이터 흐름

### 도메인 모델 제안

`src/shared/contracts/itemEvents.ts` (신규):

```ts
export type ItemCategory = 'head' | 'body' | 'hand' | 'pet'    // 영구
                        | 'food' | 'toy'                       // 소모성

export type ItemGrade = 'normal' | 'rare' | 'special'

export type ItemDef = {
    id: string                   // 'head_crown_01' 같은 고유 ID
    category: ItemCategory
    grade: ItemGrade
    name: string
    emoji: string                // 예: '👑'
    // 영구형: 캐릭터 오버레이 이미지
    // 소모형: 사용 시 표시할 이미지/효과
    visual: string
}

export type PermanentInventory = {
    [itemId: string]: {
        unlocked: true            // 영구형은 보유 여부만
    }
}

export type ConsumableInventory = {
    [itemId: string]: {
        count: number             // 소모형은 개수 누적
    }
}

export type EquippedSlots = {
    head: string | null           // ItemDef.id 또는 null
    body: string | null
    hand: string | null
    pet: string | null
}

export type ItemState = {
    permanent: PermanentInventory
    consumable: ConsumableInventory
    equipped: EquippedSlots
}

export type ItemEvent =
    | { type: 'gachaSpin' }                                        // 50점 소모 + 1개 뽑기
    | { type: 'equipPermanent'; itemId: string }                   // 영구 장착/해제 토글
    | { type: 'unequipPermanent'; category: ItemCategory }         // 명시적 해제
    | { type: 'consumeFood'; itemId: string }                      // 먹이 1개 소모
    | { type: 'consumeToy'; itemId: string }                       // 놀이 1개 소모
```

### 가챠 결과 처리 흐름

```
[사용자가 가챠 버튼 클릭]
   ↓ useInventoryStore.apply({ type: 'gachaSpin' })
   ↓ window.api.item.apply
[main: gacha reducer]
   1. 점수 >= 50 확인
      - 부족하면 no-op + 에러 반환
   2. applyPlayerEvent({ type: 'gachaSpin' }) → -50점
   3. 가챠 풀에서 등급 추첨 (70/25/5)
   4. 그 등급의 카테고리·아이템 풀에서 랜덤 1개
   5. 결과 아이템이 영구형:
      - 이미 보유 → applyPlayerEvent({ type: 'gachaRefund' }) +10
      - 미보유 → permanent[itemId] = { unlocked: true }
   6. 결과 아이템이 소모형:
      - consumable[itemId].count += 1
   ↓
writeItemState + broadcastItemState
   ↓
'item:changed' broadcast
   ↓
가챠 결과 정보(획득 아이템 ID, 환원 여부)를 응답으로 반환 → 가챠 패널이 박스 애니메이션 재생
```

### 도메인 간 부수효과 조립

가챠는 player 점수에 의존. 이전 패턴(`onTodoCompleted` 콜백)처럼 인벤토리 도메인이 player를 직접 import하지 않고 콜백 주입:

```ts
// src/main/index.ts
registerInventoryIpc({
    onGachaSpinCost: () => applyPlayerEvent({ type: 'gachaSpin' }),
    onGachaRefund: () => applyPlayerEvent({ type: 'gachaRefund' }),
    getCurrentScore: () => readPlayerState().score,
})
```

### 새 패널 추가 흐름 (가챠, 아이템)

[context-menu.md](./context-menu.md)의 "새 패널 추가 흐름" 그대로:
1. PanelId union에 `'gacha'`, `'item'` 추가 (이미 메뉴에는 있음)
2. `src/main/panels/openGachaPanel.ts`, `openItemPanel.ts` 작성
3. `src/main/panels/index.ts` switch 등록
4. `src/renderer/gacha.html`, `item.html` + `pages/gacha/`, `pages/item/` 추가
5. `electron.vite.config.ts`의 rollup input 등록

### 관련 코드 (계획)

| 영역 | 파일 |
|---|---|
| 타입 (공유) | `src/shared/contracts/itemEvents.ts` (신규) |
| 가챠 풀 데이터 | `src/shared/contracts/gachaPool.ts` 또는 `src/main/item/pool.ts` (신규) |
| reducer + 가챠 로직 | `src/main/item/itemState.ts` (신규) |
| 영속화 | `src/main/item/store.ts` (신규) |
| IPC | `src/main/item/ipc.ts` (신규) |
| barrel | `src/main/item/index.ts` (신규) |
| renderer slice | `src/renderer/src/entities/item/` (신규) |
| 가챠 패널 | `src/renderer/src/pages/gacha/` (신규) |
| 아이템 패널 | `src/renderer/src/pages/item/` (신규) |

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | player (50점 소모 + 환원), character (장착 오버레이) |
| **호출됨** | 우클릭 메뉴의 '🎰 가챠' '🎒 아이템' / feeding·playing(소모성 사용) |

## Open Questions

- **가챠 풀 확정** — 카테고리별로 노말/레어/특수에 몇 개씩? 시작 시 잠금 해제는 무엇? — **가장 큰 미정 사항**
- **결과 등급별 카테고리 분포** — 다이어그램의 "6개 카테고리에서 랜덤 출현"은 등급별로 어떻게? 옵션:
  - (A) 등급 추첨 후 6 카테고리 균등 분포
  - (B) 등급별로 카테고리 분포가 다름 (예: 특수는 펫·이펙트만)
  - (C) 카테고리 먼저 추첨 후 그 안에서 등급 결정
- **`equippedSlots`의 'pet'** — 펫(예: 캐릭터의 동반자) 카테고리는 캐릭터 위에 오버레이? 옆에 별도 표시?
- **시작 시 보유 (시드)** — 빈 인벤토리로 시작하면 먹이/놀이 패널이 항상 비어있음. 최소 시드 정책 필요
- **가챠 애니메이션 시간** — 박스 등장·흔들림·열림까지 총 몇 초?
- **가챠 결과 안내** — 영구 중복 환원 시 안내 메시지 어떻게?
- **인벤토리 capacity** — 소모형 누적의 상한? (10개? 99개? 무한?)
- **장착 동기화** — 캐릭터 윈도우의 시각 = 인벤토리의 `equipped` slot. 인벤토리 변경 → 캐릭터 윈도우가 자동 반영 (Zustand selector + 캐릭터 컴포넌트의 오버레이)
