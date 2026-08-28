import type { PlacedItem, WorldEvent, WorldState } from '@shared/contracts/worldEvents'

// 데스크탑 월드 reducer. 보관(owned) ↔ 배치(placed) 이동을 다룬다.
// 같은 값이면 동일 참조 반환(불필요 broadcast 방지)은 caller(ipc)에서 비교한다.

const addOwned = (owned: Record<string, number>, itemId: string, delta: number): Record<string, number> => {
    const next = { ...owned }
    const count = (next[itemId] ?? 0) + delta
    if (count <= 0) {
        delete next[itemId]
    } else {
        next[itemId] = count
    }
    return next
}

export const reduceWorldState = (state: WorldState, event: WorldEvent): WorldState => {
    switch (event.type) {
        case 'acquire': {
            return { ...state, owned: addOwned(state.owned, event.itemId, 1) }
        }
        case 'place': {
            if ((state.owned[event.itemId] ?? 0) <= 0) {
                return state
            }
            const placedItem: PlacedItem = {
                instanceId: event.instanceId,
                itemId: event.itemId,
                x: event.x,
                y: event.y,
            }
            return {
                ...state,
                owned: addOwned(state.owned, event.itemId, -1),
                placed: [...state.placed, placedItem],
            }
        }
        case 'move': {
            return {
                ...state,
                placed: state.placed.map((item) =>
                    item.instanceId === event.instanceId
                        ? { ...item, x: event.x, y: event.y }
                        : item,
                ),
            }
        }
        case 'recall': {
            const target = state.placed.find((item) => item.instanceId === event.instanceId)
            if (!target) {
                return state
            }
            return {
                ...state,
                owned: addOwned(state.owned, target.itemId, 1),
                placed: state.placed.filter((item) => item.instanceId !== event.instanceId),
            }
        }
        case 'commitLayout': {
            // 꾸미기 모드 저장/되돌리기 — 보유/배치를 통째로 교체.
            return { ...state, owned: event.owned, placed: event.placed }
        }
        case 'reset': {
            // 배치 전부 회수 → 보관분으로 되돌린다.
            let owned = state.owned
            for (const item of state.placed) {
                owned = addOwned(owned, item.itemId, 1)
            }
            return { ...state, owned, placed: [] }
        }
        case 'setMode': {
            if (event.mode === state.mode) {
                return state
            }
            return { ...state, mode: event.mode }
        }
        default: {
            const exhaustiveCheck: never = event
            throw new Error(`Unhandled WorldEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
