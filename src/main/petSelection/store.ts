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
    const raw = store.get('petSelection') as PetSelectionState | undefined
    if (raw && typeof raw.petId === 'string') {
        return raw
    }
    store.set('petSelection', INITIAL_PET_SELECTION_STATE)
    return INITIAL_PET_SELECTION_STATE
}

export const writePetSelectionState = (next: PetSelectionState): void => {
    store.set('petSelection', next)
}
