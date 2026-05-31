# 가챠(뽑기) + 아이템 인벤토리

> 참조 앱(JUMPET_4)의 "꾸미기(뽑기+바탕화면 데코)" + "펫 수집" 비즈니스 로직을 이식해 재편했다.
> 기존 jumpet의 "영구(머리/몸통/손/펫) + 소모(먹이/놀이)" 인벤토리 모델은 폐기한다 — 먹이/놀이는 [care.md](./care.md)의 액션으로, 꾸미기는 바탕화면 데코로 대체됐다.

## 한 줄 정체성

- **가챠(뽑기)** — 포인트를 소모해 아이템을 뽑는 핵심 보상 루프. **우클릭 메뉴 '🎰 가챠'에서 실행.**
- **아이템 인벤토리** — 뽑기로 모은 것을 보관·사용하는 곳. **우클릭 메뉴 '🎒 아이템'에서 열며, [꾸미기] [펫수집] 두 탭**으로 구성.

→ 메뉴상 **뽑기(실행)와 인벤토리(보유 현황)는 분리**되어 있다. 두 종류의 뽑기 풀(데코 / 펫)이 있고, 각 풀의 결과물이 아이템 패널의 해당 탭에 쌓인다.

## 명세

### 두 개의 뽑기 풀

| 풀 | 비용 | 결과물 | 등급 분포 | 인벤토리 탭 |
|---|---|---|---|---|
| **꾸미기(데코)** | 30점 | 바탕화면 데코 아이템 | 일반 60% / 희귀 30% / 전설 10% | 🎨 꾸미기 |
| **펫 수집** | 50점 | 동물 친구(companion) | 일반 / 희귀 / 전설 (분포 미정) | 🐾 펫수집 |

- 점수 부족 시 해당 뽑기 버튼 비활성화.
- 뽑기 패널('🎰 가챠')은 어떤 풀을 돌릴지 선택(데코/펫) → 뽑기 → 결과 연출.

### 가챠 연출

- 박스 등장 → 흔들림/반짝임 → 열림 → 결과 아이템 표시.
- 등급별 색상 차이(일반=회색 / 희귀=파랑 / 전설=주황 등).
- 결과 표시 후 캐릭터가 기뻐하는 감정/모션 (3초) — [character.md](./character.md) 의존.
- 신규 획득이면 인벤토리에 추가, 중복이면 아래 규칙.

### 중복 처리

- **데코·펫 모두 "보유 여부" 기반** (영구형). 이미 보유한 것이 또 나오면 → 보유 추가 없이 **포인트 일부 환원**(예: 10점) + 안내 메시지.
- (참조 앱은 단순 컬렉션 채우기 모델. 소모성 누적 카운트는 더 이상 없음.)

### 탭 1 — 🎨 꾸미기 (바탕화면 데코)

> **모델: 바탕화면 데코 (JUMPET_4 방식).** 캐릭터에 입히는 오버레이가 아니라, **바탕화면 위 전체화면 투명창에 아이템을 배치**하는 방식.

- 뽑기로 얻은 데코 아이템(이모지 또는 PNG, 참조 앱 기준 약 22종: flower, butterfly, clover, bluebird, snowflake, igloo, rocket, gift 등)을 보유 그리드로 표시.
- 보유 아이템 클릭 → **바탕화면에 배치**.
- 배치된 데코는 **드래그로 이동**, **우클릭으로 삭제** 가능.
- **전체 삭제** 버튼.
- 데코는 전용 플로팅 창(전체화면, 투명, 마우스 통과) 또는 캐릭터 캔버스 위에 렌더링.

### 탭 2 — 🐾 펫수집 (companions)

- 뽑기로 얻은 동물 친구(참조 앱 기준 약 8종: bunny, panda, penguin, pig, jellyfish 등)를 컬렉션으로 표시 + 수집 진행도.
- 보유 펫 → **바탕화면(캐릭터 옆)에 추가**. 동시 표시 **최대 5마리** (초과 시 무시).
- 펫별 **이름 편집** 가능.
- 펫별 **크기 조정** 슬라이더(예: 0.5~2.0).

### 획득 / 시작 시 보유

- 기본은 뽑기로만 획득.
- 빈 컬렉션으로 시작하면 초기 경험이 비어 보일 수 있음 → 최소 시드(데코 몇 종/펫 1종) 여부는 Open Question.

## 아키텍처 / 데이터 흐름

### 도메인 모델 제안

`src/shared/contracts/itemEvents.ts` (신규):

```ts
export type GachaPool = 'decor' | 'pet'
export type ItemGrade = 'normal' | 'rare' | 'legendary'

export const GACHA_COST: Record<GachaPool, number> = { decor: 30, pet: 50 }
export const GACHA_REFUND = 10                          // 중복 시 환원

export type DecorDef = {
    id: string                 // 'decor_flower_01'
    grade: ItemGrade
    name: string
    visual: string             // 이모지 또는 PNG 경로
    isPng: boolean
}

export type PetDef = {
    id: string                 // 'pet_panda'
    grade: ItemGrade
    name: string               // 기본 이름
    visual: string             // PNG 경로
}

// 바탕화면에 실제 배치된 데코 인스턴스
export type PlacedDecor = { instanceId: string; defId: string; x: number; y: number; size: number }
// 바탕화면에 올라온 펫 인스턴스 (최대 5)
export type PlacedPet = { instanceId: string; defId: string; name: string; scale: number }

export type ItemState = {
    ownedDecor: string[]            // 보유한 DecorDef.id (영구)
    ownedPets: string[]             // 보유한 PetDef.id (영구)
    placedDecor: PlacedDecor[]      // 바탕화면 배치 현황
    placedPets: PlacedPet[]         // 바탕화면 표시 현황 (≤5)
}

export type ItemEvent =
    | { type: 'gachaSpin'; pool: GachaPool }
    | { type: 'placeDecor'; defId: string; x: number; y: number }
    | { type: 'moveDecor'; instanceId: string; x: number; y: number }
    | { type: 'removeDecor'; instanceId: string }
    | { type: 'clearDecor' }
    | { type: 'addPet'; defId: string }              // 바탕화면에 펫 등장 (≤5)
    | { type: 'removePet'; instanceId: string }
    | { type: 'renamePet'; instanceId: string; name: string }
    | { type: 'resizePet'; instanceId: string; scale: number }
```

### 가챠 결과 처리 흐름

```
[가챠 패널 — 사용자가 'pet' 풀 뽑기 클릭]
   ↓ useItemStore.apply({ type: 'gachaSpin', pool: 'pet' })
   ↓ window.api.item.apply
[main: gacha reducer]
   1. 점수 >= GACHA_COST[pool] 확인 (부족 시 no-op + 에러)
   2. applyPlayerEvent({ type: 'gachaSpin', pool })   → -비용
   3. 풀에서 등급 추첨 → 그 등급의 아이템 1개 랜덤
   4. 이미 보유 → applyPlayerEvent({ type: 'gachaRefund' }) +10, 보유 추가 안 함
      미보유 → ownedPets.push(defId)
   ↓ writeItemState + broadcast 'item:changed'
   ↓ 결과(획득 id, 등급, 환원 여부) 응답 반환 → 패널이 박스 연출 재생
```

### 도메인 간 부수효과 조립 (main/index.ts)

```ts
registerItemIpc({
    onGachaCost: (pool) => applyPlayerEvent({ type: 'gachaSpin', pool }),
    onGachaRefund: () => applyPlayerEvent({ type: 'gachaRefund' }),
    getCurrentScore: () => readPlayerState().score,
    onPlacedItemsChanged: (state) => broadcastDesktopDecor(state),  // 데코/펫 창 갱신
})
```

item 도메인은 player를 직접 import하지 않고 콜백 주입(기존 패턴 일관).

### 바탕화면 데코/펫 렌더링

- 데코·펫은 **캐릭터 윈도우 캔버스 위** 또는 **별도 전체화면 투명 플로팅 창**에 그린다.
  - 참조 앱은 전체화면 투명창(`focusable:false`, `setIgnoreMouseEvents(true, {forward})`) + 캐릭터 캔버스 양쪽을 썼다.
  - jumpet 채택안: Open Question (캐릭터 캔버스 통합 vs 전용 데코 창).
- `item:changed` broadcast → 렌더러가 placedDecor/placedPets를 미러링해 갱신.

### 새 패널 추가 흐름 (가챠, 아이템)

1. PanelId union에 `'gacha'`, `'item'` (이미 메뉴에 있음)
2. `src/main/panels/openGachaPanel.ts`, `openItemPanel.ts`
3. `src/main/panels/index.ts` switch 등록
4. `src/renderer/gacha.html`, `item.html` + `pages/gacha/`, `pages/item/`(탭 UI) 추가
5. `electron.vite.config.ts` rollup input 등록

### 관련 코드 (계획)

| 영역 | 파일 |
|---|---|
| 타입 (공유) | `src/shared/contracts/itemEvents.ts` (신규) |
| 뽑기 풀 데이터 (데코/펫) | `src/main/item/pool.ts` (신규) |
| reducer + 가챠 로직 | `src/main/item/itemState.ts` (신규) |
| 영속화 | `src/main/item/store.ts` (신규) |
| IPC | `src/main/item/ipc.ts` (신규) |
| barrel | `src/main/item/index.ts` (신규) |
| renderer slice | `src/renderer/src/entities/item/` (신규) |
| 가챠 패널 | `src/renderer/src/pages/gacha/` (신규) |
| 아이템 패널 (탭) | `src/renderer/src/pages/item/` (신규) |

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | player (뽑기 비용 30/50 + 중복 환원), character (바탕화면 데코·펫 렌더, 결과 모션) |
| **호출됨** | 우클릭 메뉴의 '🎰 가챠'(뽑기) · '🎒 아이템'(인벤토리 탭) |

## Open Questions

- **데코/펫 풀 확정** — 데코 종류(이모지/PNG 목록·등급), 펫 종류·등급 분포 — **가장 큰 미정 사항**
- **펫 풀 등급 분포** — 참조 앱은 일반1/희귀4/전설3(8종). 비율과 뽑기 가중치 확정 필요.
- **중복 환원량** — 10점이 적정한지(데코 30·펫 50 비용 대비).
- **바탕화면 렌더링 방식** — 캐릭터 캔버스 통합 vs 전용 전체화면 투명창. 후자는 새 윈도우 추가 필요.
- **데코 좌표 영속화 단위** — 절대 px vs 화면 비율(0~1). 멀티 모니터/해상도 변화 대응.
- **시작 시드** — 빈 컬렉션 시작 허용 여부.
- **펫 최대 5마리 초과 시 UX** — 추가 버튼 비활성? 가장 오래된 펫 교체 권유?
- **가챠 연출 시간** — 박스 등장~열림 총 몇 초?
