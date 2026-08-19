import Store from 'electron-store'
import { INITIAL_PET_SELECTION_STATE, type PetSelectionState } from '@shared/contracts/petEvents'

type SchemaShape = {
    petSelection: PetSelectionState
}

const store = new Store<SchemaShape>({
    defaults: {
        petSelection: INITIAL_PET_SELECTION_STATE,
    },
})

export const readPetSelectionState = (): PetSelectionState => {
    const raw = store.get('petSelection') as Partial<PetSelectionState> | undefined
    if (raw && typeof raw.petId === 'string') {
        // ownedPets가 없던 구버전 저장값은 빈 배열로(모두 잠금).
        const ownedPets = Array.isArray(raw.ownedPets)
            ? raw.ownedPets.filter((id): id is string => typeof id === 'string')
            : []
        // 보유하지 않은 펫이 장착돼 있으면 해제(잠금 일관성).
        const petId = ownedPets.includes(raw.petId) ? raw.petId : ''
        return { petId, ownedPets }
    }
    store.set('petSelection', INITIAL_PET_SELECTION_STATE)
    return INITIAL_PET_SELECTION_STATE
}

export const writePetSelectionState = (next: PetSelectionState): void => {
    store.set('petSelection', next)
}
