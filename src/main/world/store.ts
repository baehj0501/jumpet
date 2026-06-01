import Store from 'electron-store'
import type { PlacedItem, WorldMode, WorldState } from '@shared/contracts/worldEvents'

// 영속은 보유/배치만. 꾸미기 모드(mode)는 영속하지 않고 메모리에만 둔다(앱 시작은 항상 fixed).
type PersistShape = {
    owned: Record<string, number>
    placed: PlacedItem[]
}

type SchemaShape = {
    world: PersistShape
}

const store = new Store<SchemaShape>({
    defaults: {
        world: { owned: {}, placed: [] },
    },
})

// 런타임 모드 — 메모리에만 보관(재시작 시 fixed로 초기화).
let currentMode: WorldMode = 'fixed'

export const readWorldState = (): WorldState => {
    const raw = store.get('world') as PersistShape | undefined
    const owned = raw && typeof raw.owned === 'object' && raw.owned !== null ? raw.owned : {}
    const placed = raw && Array.isArray(raw.placed) ? raw.placed : []
    return { owned, placed, mode: currentMode }
}

export const writeWorldState = (next: WorldState): void => {
    store.set('world', { owned: next.owned, placed: next.placed })
    currentMode = next.mode
}
