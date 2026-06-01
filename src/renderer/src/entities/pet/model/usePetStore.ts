import { create } from 'zustand'
import { INITIAL_PET_SELECTION_STATE } from '@shared/contracts/petEvents'

// 장착된 동반 펫의 renderer 측 글로벌 store.
// main이 SSOT — 펫 창(App)과 메뉴 창(펫 탭)이 같은 값을 구독한다. ''이면 미장착.
// usePlayerStore와 같은 패턴 — entrypoint(app/main.tsx, menu/main.tsx)가 sync를 1회 호출.

type PetStore = {
    petId: string
    // 펫 장착/해제(같은 펫을 다시 누르면 해제). main을 거쳐 영속화 + 모든 창 broadcast.
    select: (petId: string) => Promise<void>
}

const usePetStoreInternal = create<PetStore>((set) => ({
    petId: INITIAL_PET_SELECTION_STATE.petId,
    select: async (petId) => {
        const next = await window.api.petSelection.apply({ type: 'select', petId })
        set({ petId: next.petId })
    },
}))

let isInitialized = false
let unsubscribeFromChanges: (() => void) | null = null

export const initializePetSync = (): void => {
    if (isInitialized) {
        return
    }
    isInitialized = true

    void window.api.petSelection
        .get()
        .then((state) => {
            usePetStoreInternal.setState({ petId: state.petId })
        })
        .catch(() => {
            // 창이 닫히는 타이밍 등으로 IPC가 단절되면 조용히 무시.
        })
    unsubscribeFromChanges = window.api.petSelection.onChange((state) => {
        usePetStoreInternal.setState({ petId: state.petId })
    })
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        unsubscribeFromChanges?.()
        unsubscribeFromChanges = null
        isInitialized = false
    })
}

export const useSelectedPetId = (): string => usePetStoreInternal((state) => state.petId)
export const useSelectPet = (): ((petId: string) => Promise<void>) =>
    usePetStoreInternal((state) => state.select)
