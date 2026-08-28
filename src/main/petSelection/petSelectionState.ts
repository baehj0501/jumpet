import type { PetSelectionEvent, PetSelectionState } from '@shared/contracts/petEvents'

// 동반 펫 선택/보유 reducer. 같은 값이면 동일 참조 반환(불필요 broadcast 방지).
export const reducePetSelectionState = (
    state: PetSelectionState,
    event: PetSelectionEvent,
): PetSelectionState => {
    switch (event.type) {
        case 'select': {
            // ''(해제)은 항상 허용, 그 외엔 보유한 펫만 장착 가능.
            if (event.petId !== '' && !state.ownedPets.includes(event.petId)) {
                return state
            }
            if (event.petId === state.petId) {
                return state
            }
            return { ...state, petId: event.petId }
        }
        case 'unlock': {
            // 뽑기로 보유 추가. 빈 값이거나 이미 보유면 no-op.
            if (event.petId === '' || state.ownedPets.includes(event.petId)) {
                return state
            }
            return { ...state, ownedPets: [...state.ownedPets, event.petId] }
        }
        default: {
            const exhaustiveCheck: never = event
            throw new Error(`Unhandled PetSelectionEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
