import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import {
    INITIAL_SETTINGS_STATE,
    type SettingsState,
    type ThemeId,
} from '@shared/contracts/settingsEvents'

// 앱 환경설정(테마·캐릭터 크기)의 renderer 측 글로벌 store.
// main이 SSOT — 설정 탭에서 바꾸면 메뉴 창(테마)·캐릭터 창(크기)이 같은 값을 구독한다.
// 다른 도메인과 동일 패턴 — entrypoint(app/main.tsx, menu/main.tsx)가 sync를 1회 호출.

type SettingsStore = {
    theme: ThemeId
    petScale: number
    launchAtLogin: boolean
    setTheme: (theme: ThemeId) => Promise<void>
    setPetScale: (petScale: number) => Promise<void>
    setLaunchAtLogin: (launchAtLogin: boolean) => Promise<void>
}

// main이 돌려준 전체 상태를 store에 반영.
const mirror = (set: (partial: Partial<SettingsStore>) => void, state: SettingsState): void => {
    set({ theme: state.theme, petScale: state.petScale, launchAtLogin: state.launchAtLogin })
}

const useSettingsStoreInternal = create<SettingsStore>((set) => ({
    theme: INITIAL_SETTINGS_STATE.theme,
    petScale: INITIAL_SETTINGS_STATE.petScale,
    launchAtLogin: INITIAL_SETTINGS_STATE.launchAtLogin,
    setTheme: async (theme) => {
        mirror(set, await window.api.settings.apply({ type: 'setTheme', theme }))
    },
    setPetScale: async (petScale) => {
        mirror(set, await window.api.settings.apply({ type: 'setPetScale', petScale }))
    },
    setLaunchAtLogin: async (launchAtLogin) => {
        mirror(set, await window.api.settings.apply({ type: 'setLaunchAtLogin', launchAtLogin }))
    },
}))

let isInitialized = false
let unsubscribeFromChanges: (() => void) | null = null

export const initializeSettingsSync = (): void => {
    if (isInitialized) {
        return
    }
    // preload가 아직 settings를 노출하지 않으면(예: dev에서 preload 미재시작) 조용히 건너뛴다.
    // 새 API 누락이 메뉴 창 전체 렌더를 죽이지 않도록 방어.
    if (!window.api?.settings) {
        return
    }
    isInitialized = true

    void window.api.settings
        .get()
        .then((state: SettingsState) => {
            mirror(useSettingsStoreInternal.setState, state)
        })
        .catch(() => {
            // 창이 닫히는 타이밍 등으로 IPC가 단절되면 조용히 무시.
        })
    unsubscribeFromChanges = window.api.settings.onChange((state) => {
        mirror(useSettingsStoreInternal.setState, state)
    })
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        unsubscribeFromChanges?.()
        unsubscribeFromChanges = null
        isInitialized = false
    })
}

export const useTheme = (): ThemeId => useSettingsStoreInternal((state) => state.theme)
export const usePetScale = (): number => useSettingsStoreInternal((state) => state.petScale)
export const useLaunchAtLogin = (): boolean =>
    useSettingsStoreInternal((state) => state.launchAtLogin)

export const useSettingsActions = (): {
    setTheme: (theme: ThemeId) => Promise<void>
    setPetScale: (petScale: number) => Promise<void>
    setLaunchAtLogin: (launchAtLogin: boolean) => Promise<void>
} =>
    useSettingsStoreInternal(
        useShallow((state) => ({
            setTheme: state.setTheme,
            setPetScale: state.setPetScale,
            setLaunchAtLogin: state.setLaunchAtLogin,
        })),
    )
