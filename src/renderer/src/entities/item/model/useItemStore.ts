import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { GachaResult } from '@shared/contracts/itemEvents'

// 소모성 아이템 인벤토리의 renderer 측 글로벌 store.
// main이 SSOT, 이 store는 read-only 미러 + 의미 단위 액션의 진입점.
// useTodoStore와 같은 패턴 — entrypoint(pages/*/main.tsx)가 initializeItemSync()를 1회 호출.

type ItemActions = {
    // 돌봄 액션이 아이템 1개를 소모한다.
    consume: (itemId: string) => Promise<void>
    // 뽑기 1회. 결과(성공 여부·획득 아이템)를 호출자에게 반환한다.
    gacha: () => Promise<GachaResult>
}

type ItemStore = {
    counts: Record<string, number>
} & ItemActions

const useItemStoreInternal = create<ItemStore>((set) => ({
    counts: {},
    consume: async (itemId) => {
        const next = await window.api.item.apply({ type: 'consume', itemId })
        set({ counts: next.counts })
    },
    gacha: async () => {
        const result = await window.api.item.gacha()
        set({ counts: result.state.counts })
        return result
    },
}))

let isInitialized = false
let unsubscribeFromChanges: (() => void) | null = null

export const initializeItemSync = (): void => {
    if (isInitialized) {
        return
    }
    isInitialized = true

    void window.api.item
        .get()
        .then((state) => {
            useItemStoreInternal.setState({ counts: state.counts })
        })
        .catch(() => {
            // 패널 창이 닫히는 타이밍 등으로 IPC가 단절되면 조용히 무시.
        })
    unsubscribeFromChanges = window.api.item.onChange((state) => {
        useItemStoreInternal.setState({ counts: state.counts })
    })
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        unsubscribeFromChanges?.()
        unsubscribeFromChanges = null
        isInitialized = false
    })
}

export const useItemCounts = () => useItemStoreInternal((state) => state.counts)
export const useItemActions = (): ItemActions =>
    useItemStoreInternal(
        useShallow((state) => ({
            consume: state.consume,
            gacha: state.gacha,
        })),
    )
