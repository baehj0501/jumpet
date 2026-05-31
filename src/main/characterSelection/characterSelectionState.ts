import type {
    CharacterSelectionEvent,
    CharacterSelectionState,
} from '@shared/contracts/characterEvents'

// 캐릭터 선택 reducer. 순수 함수 — 같은 값/빈 값이면 동일 참조를 반환해 불필요한 broadcast를 막는다.
export const reduceCharacterSelectionState = (
    state: CharacterSelectionState,
    event: CharacterSelectionEvent,
): CharacterSelectionState => {
    switch (event.type) {
        case 'select': {
            if (event.characterId === '' || event.characterId === state.characterId) {
                return state
            }
            return { characterId: event.characterId }
        }
        default: {
            const exhaustiveCheck: never = event.type
            throw new Error(`Unhandled CharacterSelectionEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
