import Store from 'electron-store'
import {
    INITIAL_CHARACTER_SELECTION_STATE,
    type CharacterSelectionState,
} from '@shared/contracts/characterEvents'

type SchemaShape = {
    characterSelection: CharacterSelectionState
}

const store = new Store<SchemaShape>({
    defaults: {
        characterSelection: INITIAL_CHARACTER_SELECTION_STATE,
    },
})

export const readCharacterSelectionState = (): CharacterSelectionState => {
    const raw = store.get('characterSelection') as CharacterSelectionState | undefined
    if (raw && typeof raw.characterId === 'string' && raw.characterId !== '') {
        return raw
    }
    console.warn(
        '[characterSelection] hydration failed, resetting to INITIAL_CHARACTER_SELECTION_STATE',
        raw,
    )
    store.set('characterSelection', INITIAL_CHARACTER_SELECTION_STATE)
    return INITIAL_CHARACTER_SELECTION_STATE
}

export const writeCharacterSelectionState = (next: CharacterSelectionState): void => {
    store.set('characterSelection', next)
}
