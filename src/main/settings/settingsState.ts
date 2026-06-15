import {
    PET_SCALE_MAX,
    PET_SCALE_MIN,
    THEME_IDS,
    type SettingsEvent,
    type SettingsState,
} from '@shared/contracts/settingsEvents'

const clampPetScale = (value: number): number => {
    if (!Number.isFinite(value)) {
        return 1.0
    }
    return Math.min(PET_SCALE_MAX, Math.max(PET_SCALE_MIN, value))
}

// 설정 reducer. 같은 값이면 동일 참조 반환(불필요 broadcast 방지). 잘못된 입력은 무시/보정한다.
export const reduceSettingsState = (
    state: SettingsState,
    event: SettingsEvent,
): SettingsState => {
    switch (event.type) {
        case 'setTheme': {
            if (!THEME_IDS.includes(event.theme) || event.theme === state.theme) {
                return state
            }
            return { ...state, theme: event.theme }
        }
        case 'setPetScale': {
            const next = clampPetScale(event.petScale)
            if (next === state.petScale) {
                return state
            }
            return { ...state, petScale: next }
        }
        case 'setLaunchAtLogin': {
            if (event.launchAtLogin === state.launchAtLogin) {
                return state
            }
            return { ...state, launchAtLogin: event.launchAtLogin }
        }
        default: {
            const exhaustiveCheck: never = event
            throw new Error(`Unhandled SettingsEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
