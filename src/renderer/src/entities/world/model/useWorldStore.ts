import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import {
    INITIAL_WORLD_STATE,
    type PlacedItem,
    type WorldMode,
    type WorldState,
} from '@shared/contracts/worldEvents'
import { DECOR_ITEMS, type DecorItemDef } from './decorCatalog'

// 데스크탑 월드(아이템 꾸미기) renderer 글로벌 store.
// main이 SSOT — 메뉴 창(아이템 탭)과 월드 창이 같은 값을 구독한다.
// usePetStore와 같은 패턴 — entrypoint가 initializeWorldSync()를 1회 호출.

type WorldActions = {
    // 가챠 획득 → 보관함에 1개.
    acquire: (itemId: string) => Promise<void>
    // 배치 — 보관분 1개를 월드 좌표(비율)에 놓는다.
    place: (itemId: string, x: number, y: number) => Promise<void>
    // 배치 이동.
    move: (instanceId: string, x: number, y: number) => Promise<void>
    // 회수 — 배치 → 보관함.
    recall: (instanceId: string) => Promise<void>
    // 저장(커밋) — 보유/배치 전체 교체.
    commitLayout: (owned: Record<string, number>, placed: PlacedItem[]) => Promise<void>
    // 초기화 — 배치 전부 회수.
    reset: () => Promise<void>
    // 꾸미기 모드 전환.
    setMode: (mode: WorldMode) => Promise<void>
    // 가챠 — main이 비용 차감 후, renderer가 데코를 추첨해 보관함에 적립. 획득 데코를 반환(실패 시 null).
    rollGacha: () => Promise<DecorItemDef | null>
}

type WorldStore = WorldState & WorldActions

const newInstanceId = (): string =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `inst_${Date.now()}_${Math.floor(Math.random() * 1e6)}`

const useWorldStoreInternal = create<WorldStore>((set) => {
    const applyResult = (next: WorldState) =>
        set({ owned: next.owned, placed: next.placed, mode: next.mode })
    return {
        owned: INITIAL_WORLD_STATE.owned,
        placed: INITIAL_WORLD_STATE.placed,
        mode: INITIAL_WORLD_STATE.mode,
        acquire: async (itemId) => {
            applyResult(await window.api.world.apply({ type: 'acquire', itemId }))
        },
        place: async (itemId, x, y) => {
            applyResult(
                await window.api.world.apply({
                    type: 'place',
                    instanceId: newInstanceId(),
                    itemId,
                    x,
                    y,
                }),
            )
        },
        move: async (instanceId, x, y) => {
            applyResult(await window.api.world.apply({ type: 'move', instanceId, x, y }))
        },
        recall: async (instanceId) => {
            applyResult(await window.api.world.apply({ type: 'recall', instanceId }))
        },
        commitLayout: async (owned, placed) => {
            applyResult(await window.api.world.apply({ type: 'commitLayout', owned, placed }))
        },
        reset: async () => {
            applyResult(await window.api.world.apply({ type: 'reset' }))
        },
        setMode: async (mode) => {
            applyResult(await window.api.world.apply({ type: 'setMode', mode }))
        },
        rollGacha: async () => {
            const result = await window.api.world.gacha()
            if (!result.success || DECOR_ITEMS.length === 0) {
                return null
            }
            const pick = DECOR_ITEMS[Math.floor(Math.random() * DECOR_ITEMS.length)]
            applyResult(await window.api.world.apply({ type: 'acquire', itemId: pick.id }))
            return pick
        },
    }
})

let isInitialized = false
let unsubscribeFromChanges: (() => void) | null = null

// 팀 데모용 — 시작 시 보유하지 않은 데코를 전부 1개씩 보유 처리(가챠 없이 모두 사용 가능).
// 정식 동작: 데코는 뽑기로만 획득하므로 false. (데모 확인이 필요할 때만 임시로 true)
const DEMO_UNLOCK_ALL_DECOR = false

export const initializeWorldSync = (): void => {
    if (isInitialized) {
        return
    }
    isInitialized = true

    void window.api.world
        .get()
        .then((state) => {
            useWorldStoreInternal.setState({
                owned: state.owned,
                placed: state.placed,
                mode: state.mode,
            })
            // 데모: 미보유 데코를 모두 1개씩 채워 넣는다(이미 가진 건 그대로 — 중복 적립 없음).
            if (DEMO_UNLOCK_ALL_DECOR) {
                const owned = { ...state.owned }
                let changed = false
                for (const decor of DECOR_ITEMS) {
                    if ((owned[decor.id] ?? 0) <= 0) {
                        owned[decor.id] = 1
                        changed = true
                    }
                }
                if (changed) {
                    void window.api.world
                        .apply({ type: 'commitLayout', owned, placed: state.placed })
                        .then((next) =>
                            useWorldStoreInternal.setState({
                                owned: next.owned,
                                placed: next.placed,
                                mode: next.mode,
                            }),
                        )
                        .catch(() => {})
                }
            }
        })
        .catch(() => {
            // 창 종료 타이밍 등으로 IPC 단절 시 조용히 무시.
        })
    unsubscribeFromChanges = window.api.world.onChange((state) => {
        useWorldStoreInternal.setState({
            owned: state.owned,
            placed: state.placed,
            mode: state.mode,
        })
    })
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        unsubscribeFromChanges?.()
        unsubscribeFromChanges = null
        isInitialized = false
    })
}

export const useOwnedDecor = (): Record<string, number> =>
    useWorldStoreInternal((state) => state.owned)
export const usePlacedItems = (): PlacedItem[] => useWorldStoreInternal((state) => state.placed)
export const useWorldMode = (): WorldMode => useWorldStoreInternal((state) => state.mode)
export const useWorldActions = (): WorldActions =>
    useWorldStoreInternal(
        useShallow((state) => ({
            acquire: state.acquire,
            place: state.place,
            move: state.move,
            recall: state.recall,
            commitLayout: state.commitLayout,
            reset: state.reset,
            setMode: state.setMode,
            rollGacha: state.rollGacha,
        })),
    )
