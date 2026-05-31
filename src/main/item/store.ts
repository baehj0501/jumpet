import Store from 'electron-store'
import { INITIAL_ITEM_STATE, type ItemState } from '@shared/contracts/itemEvents'

// playerState/todo와 같은 디스크 영속 패턴 — 같은 config.json에 'item' 키를 추가한다.
type SchemaShape = {
    item: ItemState
}

const store = new Store<SchemaShape>({
    defaults: {
        item: INITIAL_ITEM_STATE,
    },
})

// counts는 'itemId → 0 이상 정수'여야 한다. 깨진 항목만 골라낸다.
const sanitizeCounts = (raw: unknown): Record<string, number> => {
    if (typeof raw !== 'object' || raw === null) {
        return {}
    }
    const result: Record<string, number> = {}
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
            result[key] = Math.floor(value)
        }
    }
    return result
}

export const readItemState = (): ItemState => {
    const raw = store.get('item') as ItemState | undefined
    if (raw && typeof raw === 'object') {
        return { counts: sanitizeCounts(raw.counts) }
    }
    console.warn('[itemState] hydration failed, resetting to INITIAL_ITEM_STATE', raw)
    store.set('item', INITIAL_ITEM_STATE)
    return INITIAL_ITEM_STATE
}

export const writeItemState = (next: ItemState): void => {
    store.set('item', next)
}
