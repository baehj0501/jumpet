import type {
    CharacterSelectionEvent,
    CharacterSelectionState,
} from '@shared/contracts/characterEvents'

// 캐릭터 선택/보유 reducer. 순수 함수 — 같은 값이면 동일 참조를 반환해 불필요한 broadcast를 막는다.
export const reduceCharacterSelectionState = (
    state: CharacterSelectionState,
    event: CharacterSelectionEvent,
): CharacterSelectionState => {
    switch (event.type) {
        case 'select': {
            // 보유한 캐릭터로만 전환. 미보유거나 같은 값이면 no-op.
            if (event.characterId === '' || !state.ownedCharacters.includes(event.characterId)) {
                return state
            }
            if (event.characterId === state.characterId) {
                return state
            }
            return { ...state, characterId: event.characterId }
        }
        case 'choose': {
            // 온보딩 최초 선택 — 스타터 확정. 보유는 이 캐릭터 하나만(나머지 잠금).
            if (event.characterId === '') {
                return state
            }
            return {
                characterId: event.characterId,
                chosen: true,
                ownedCharacters: [event.characterId],
            }
        }
        case 'unlock': {
            // 보유 추가(중복/빈 값이면 no-op).
            if (event.characterId === '' || state.ownedCharacters.includes(event.characterId)) {
                return state
            }
            return { ...state, ownedCharacters: [...state.ownedCharacters, event.characterId] }
        }
        default: {
            const exhaustiveCheck: never = event
            throw new Error(`Unhandled CharacterSelectionEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
