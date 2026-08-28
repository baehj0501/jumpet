import Store from 'electron-store'
import {
    INITIAL_SETTINGS_STATE,
    PET_SCALE_MAX,
    PET_SCALE_MIN,
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

const clampPetScale = (value: number): number => Math.min(PET_SCALE_MAX, Math.max(PET_SCALE_MIN, value))

export const readSettingsState = (): SettingsState => {
    const raw = store.get('settings') as unknown
    if (isValidSettings(raw)) {
        // 누락 필드(구버전 데이터의 launchAtLogin 등)는 기본값으로 보강한다.
        const next = {
            ...INITIAL_SETTINGS_STATE,
            ...raw,
            petScale: clampPetScale(raw.petScale),
            launchAtLogin: Boolean(raw.launchAtLogin),
        }
        if (next.petScale !== raw.petScale || next.launchAtLogin !== raw.launchAtLogin) {
            store.set('settings', next)
        }
        return next
    }
    store.set('settings', INITIAL_SETTINGS_STATE)
    return INITIAL_SETTINGS_STATE
}

export const writeSettingsState = (next: SettingsState): void => {
    store.set('settings', next)
}
