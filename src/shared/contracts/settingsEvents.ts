// 앱 환경설정(테마·캐릭터 크기)의 IPC 계약.
// 메뉴 창(설정 탭)이 바꾸고, 메뉴 창은 테마를, 캐릭터 창은 크기를 구독해 즉시 반영하는 SSOT.
// 내 정보(이름·생일)는 profile 도메인이 따로 소유하므로 여기엔 없다.

// pixel-theme.css의 [data-theme='...'] 토큰과 1:1. 'skyblue'는 :root 기본값이라 별도 블록이 없다.
export type ThemeId = 'skyblue' | 'green' | 'babypink' | 'brown' | 'light' | 'dark'

export const THEME_IDS: ThemeId[] = ['skyblue', 'green', 'babypink', 'brown', 'light', 'dark']

// 캐릭터 윈도우 표시 배율. 1.0 = 기본 300px. 범위는 reducer에서 강제(clamp).
export const PET_SCALE_MIN = 0.5
export const PET_SCALE_MAX = 2.0

export type SettingsState = {
    theme: ThemeId
    petScale: number
}

export type SettingsEvent =
    | { type: 'setTheme'; theme: ThemeId }
    | { type: 'setPetScale'; petScale: number }

export const INITIAL_SETTINGS_STATE: SettingsState = {
    theme: 'skyblue',
    petScale: 1.0,
}
