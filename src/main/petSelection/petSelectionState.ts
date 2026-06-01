import type { PetSelectionEvent, PetSelectionState } from '@shared/contracts/petEvents'

// 동반 펫 선택 reducer. 같은 값이면 동일 참조 반환(불필요 broadcast 방지). ''은 장착 해제.
export const reducePetSelectionState = (
    state: PetSelectionState,
    event: PetSelectionEvent,
): PetSelectionState => {
    switch (event.type) {
        case 'select': {
            if (event.petId === state.petId) {
                return state
            }
            return { petId: event.petId }
        }
        default: {
            const exhaustiveCheck: never = event.type
            throw new Error(`Unhandled PetSelectionEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
