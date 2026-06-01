// Public API of the settings entity (테마·캐릭터 크기 환경설정).
export {
    initializeSettingsSync,
    useTheme,
    usePetScale,
    useSettingsActions,
} from './model/useSettingsStore'
export {
    THEME_IDS,
    PET_SCALE_MIN,
    PET_SCALE_MAX,
    type ThemeId,
} from '@shared/contracts/settingsEvents'
