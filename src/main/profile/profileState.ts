import {
    MAX_PROFILE_VALUE_LENGTH,
    type ProfileEvent,
    type ProfileState,
} from '@shared/contracts/profileEvents'

// 프로필 reducer. 'set'으로 한 필드만 갱신(trim + 길이 제한).
export const reduceProfileState = (state: ProfileState, event: ProfileEvent): ProfileState => {
    switch (event.type) {
        case 'set': {
            const value = event.value.trim().slice(0, MAX_PROFILE_VALUE_LENGTH)
            if (state[event.field] === value) {
                return state
            }
            return { ...state, [event.field]: value }
        }
        default: {
            const exhaustiveCheck: never = event.type
            throw new Error(`Unhandled ProfileEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
