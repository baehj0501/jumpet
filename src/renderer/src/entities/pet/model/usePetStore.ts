import { create } from 'zustand'
import { INITIAL_PET_SELECTION_STATE } from '@shared/contracts/petEvents'
import { PET_CATALOG, type PetDef } from './pets'

// 장착된 동반 펫 + 보유 목록의 renderer 측 글로벌 store.
// main이 SSOT — 펫 창(App)과 메뉴 창(펫 탭)이 같은 값을 구독한다. ''이면 미장착.
// 보유(ownedPets)한 펫만 장착 가능하며, 미보유 펫은 뽑기로 해제한다.
// usePlayerStore와 같은 패턴 — entrypoint(app/main.tsx, menu/main.tsx)가 sync를 1회 호출.

type PetStore = {
    petId: string
    ownedPets: string[]
    // 펫 장착/해제(같은 펫을 다시 누르면 해제). 보유한 펫만. main을 거쳐 영속화 + broadcast.
    select: (petId: string) => Promise<void>
    // 펫 뽑기 — main이 비용 차감 후, renderer가 미보유 펫을 추첨해 보유에 적립. 획득 펫 반환(실패 시 null).
    rollPetGacha: () => Promise<PetDef | null>
}

const usePetStoreInternal = create<PetStore>((set, get) => ({
    petId: INITIAL_PET_SELECTION_STATE.petId,
    ownedPets: INITIAL_PET_SELECTION_STATE.ownedPets,
    select: async (petId) => {
        const next = await window.api.petSelection.apply({ type: 'select', petId })
        set({ petId: next.petId, ownedPets: next.ownedPets })
    },
    rollPetGacha: async () => {
        // 미보유 펫이 없으면(모두 보유) 비용을 쓰지 않고 종료.
        const locked = PET_CATALOG.filter((pet) => !get().ownedPets.includes(pet.id))
        if (locked.length === 0) {
            return null
        }
        const result = await window.api.petSelection.gacha()
        if (!result.success) {
            return null
        }
        const pick = locked[Math.floor(Math.random() * locked.length)]
        const next = await window.api.petSelection.apply({ type: 'unlock', petId: pick.id })
        set({ petId: next.petId, ownedPets: next.ownedPets })
        return pick
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
            usePetStoreInternal.setState({ petId: state.petId, ownedPets: state.ownedPets })
        })
        .catch(() => {
            // 창이 닫히는 타이밍 등으로 IPC가 단절되면 조용히 무시.
        })
    unsubscribeFromChanges = window.api.petSelection.onChange((state) => {
        usePetStoreInternal.setState({ petId: state.petId, ownedPets: state.ownedPets })
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
export const useOwnedPets = (): string[] => usePetStoreInternal((state) => state.ownedPets)
export const useRollPetGacha = (): (() => Promise<PetDef | null>) =>
    usePetStoreInternal((state) => state.rollPetGacha)
