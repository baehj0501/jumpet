// 소모성 아이템 인벤토리의 SSOT reducer.
// 타입/시드는 @shared/contracts에서 import해 main·preload·renderer가 동일 정의를 공유한다.

import {
    CONSUMABLE_ITEMS,
    type ConsumableItemDef,
    type ItemEvent,
    type ItemState,
} from '@shared/contracts/itemEvents'

export const reduceItemState = (state: ItemState, event: ItemEvent): ItemState => {
    switch (event.type) {
        case 'consume': {
            const current = state.counts[event.itemId] ?? 0
            // 미보유 아이템 소모 요청은 무시(변화 없음 → 같은 참조 반환).
            if (current <= 0) {
                return state
            }
            return { counts: { ...state.counts, [event.itemId]: current - 1 } }
        }
        default: {
            const exhaustiveCheck: never = event.type
            throw new Error(`Unhandled ItemEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}

// 뽑기: 시드 풀에서 균등 추첨해 1개 지급. (Math.random은 'gachaSpin'의 도메인 룰 자체.)
export const grantRandomItem = (
    state: ItemState,
): { state: ItemState; item: ConsumableItemDef } => {
    const item = CONSUMABLE_ITEMS[Math.floor(Math.random() * CONSUMABLE_ITEMS.length)]
    const current = state.counts[item.id] ?? 0
    return {
        state: { counts: { ...state.counts, [item.id]: current + 1 } },
        item,
    }
}
