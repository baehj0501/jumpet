import {
    BIRTHDAY_EDIT_COOLDOWN_MS,
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
            // 생일은 변경 후 1달 쿨타임 — 최초 변경(birthdayUpdatedAt 0)은 허용.
            if (event.field === 'birthday') {
                const now = Date.now()
                if (
                    state.birthdayUpdatedAt > 0 &&
                    now - state.birthdayUpdatedAt < BIRTHDAY_EDIT_COOLDOWN_MS
                ) {
                    return state // 쿨타임 중 — 변경 거부
                }
                return { ...state, birthday: value, birthdayUpdatedAt: now }
            }
            return { ...state, [event.field]: value }
        }
        default: {
            const exhaustiveCheck: never = event.type
            throw new Error(`Unhandled ProfileEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
