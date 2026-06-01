import Store from 'electron-store'
import {
    INITIAL_SETTINGS_STATE,
    THEME_IDS,
    type SettingsState,
} from '@shared/contracts/settingsEvents'

type SchemaShape = {
    settings: SettingsState
}

const store = new Store<SchemaShape>({
    defaults: {
        settings: INITIAL_SETTINGS_STATE,
    },
})

// 저장된 값이 깨졌으면(타입/범위 이상) 초기값으로 복구한다.
const isValidSettings = (raw: unknown): raw is SettingsState => {
    if (!raw || typeof raw !== 'object') {
        return false
    }
    const candidate = raw as Partial<SettingsState>
    return (
        typeof candidate.theme === 'string' &&
        THEME_IDS.includes(candidate.theme as SettingsState['theme']) &&
        typeof candidate.petScale === 'number' &&
        Number.isFinite(candidate.petScale)
    )
}

export const readSettingsState = (): SettingsState => {
    const raw = store.get('settings') as unknown
    if (isValidSettings(raw)) {
        return raw
    }
    store.set('settings', INITIAL_SETTINGS_STATE)
    return INITIAL_SETTINGS_STATE
}

export const writeSettingsState = (next: SettingsState): void => {
    store.set('settings', next)
}
