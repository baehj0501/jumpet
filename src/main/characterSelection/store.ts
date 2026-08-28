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
    const raw = store.get('characterSelection') as Partial<CharacterSelectionState> | undefined
    if (raw && typeof raw.characterId === 'string' && raw.characterId !== '') {
        // chosen이 없던 구버전 저장값은 false로 간주(온보딩 1회 노출).
        const chosen = raw.chosen === true
        let ownedCharacters = Array.isArray(raw.ownedCharacters)
            ? raw.ownedCharacters.filter((id): id is string => typeof id === 'string')
            : []
        // 이미 골랐는데 보유 목록이 비어 있으면(구버전) 현재 캐릭터를 스타터로 채운다.
        if (chosen && ownedCharacters.length === 0) {
            ownedCharacters = [raw.characterId]
        }
        // 활성 캐릭터는 항상 보유 중이어야 한다 — 아니면 보유 첫 캐릭터로 되돌린다.
        const characterId =
            ownedCharacters.length === 0 || ownedCharacters.includes(raw.characterId)
                ? raw.characterId
                : ownedCharacters[0]
        return { characterId, chosen, ownedCharacters }
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
