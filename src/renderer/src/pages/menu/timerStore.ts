import { create } from 'zustand'
import { usePlayerStore } from '@renderer/entities/player'

// 포모도로 타이머 공유 store.
// 탭을 바꿔도 타이머가 계속 돌도록 TimerTab이 아닌 MenuPage(항상 마운트)에서 tick 엔진을 돌린다.
// 메뉴 창 안에서만 동작(창을 닫으면 초기화). 설정값만 localStorage 보존.

type Phase = 'focus' | 'break'

const FOCUS_KEY = 'jumpet.timer.focusMin'
const BREAK_KEY = 'jumpet.timer.breakMin'
const DEFAULT_FOCUS_MIN = 25
const DEFAULT_BREAK_MIN = 5
const FOCUS_REWARD = 10
// 상단 배너 표시 시간(ms).
const BANNER_DURATION_MS = 6000

const readMinutes = (key: string, fallback: number): number => {
    try {
        const value = Number(localStorage.getItem(key))
        return Number.isFinite(value) && value > 0 ? Math.min(180, Math.floor(value)) : fallback
    } catch {
        return fallback
    }
}

const clampMinutes = (value: number): number => Math.max(1, Math.min(180, Math.floor(value) || 1))

// 완료 시 상단에 띄우는 캐릭터 멘트 배너.
export type TimerBanner = {
    title: string
    lines: string[]
}

type TimerStore = {
    phase: Phase
    remaining: number
    running: boolean
    focusMin: number
    breakMin: number
    completedFocus: number
    banner: TimerBanner | null
    toggle: () => void
    reset: () => void
    skip: () => void
    setFocusMin: (value: number) => void
    setBreakMin: (value: number) => void
    tick: () => void
    dismissBanner: () => void
}

let bannerTimeoutId: ReturnType<typeof setTimeout> | null = null

export const useTimerStore = create<TimerStore>((set, get) => {
    const initialFocus = readMinutes(FOCUS_KEY, DEFAULT_FOCUS_MIN)
    const initialBreak = readMinutes(BREAK_KEY, DEFAULT_BREAK_MIN)

    const flashBanner = (banner: TimerBanner) => {
        set({ banner })
        if (bannerTimeoutId) {
            clearTimeout(bannerTimeoutId)
        }
        bannerTimeoutId = setTimeout(() => set({ banner: null }), BANNER_DURATION_MS)
    }

    return {
        phase: 'focus',
        remaining: initialFocus * 60,
        running: false,
        focusMin: initialFocus,
        breakMin: initialBreak,
        completedFocus: 0,
        banner: null,

        toggle: () => set((state) => ({ running: !state.running })),

        reset: () =>
            set((state) => ({
                running: false,
                remaining: (state.phase === 'focus' ? state.focusMin : state.breakMin) * 60,
            })),

        skip: () =>
            set((state) =>
                state.phase === 'focus'
                    ? { phase: 'break', remaining: state.breakMin * 60 }
                    : { phase: 'focus', remaining: state.focusMin * 60 },
            ),

        setFocusMin: (value) => {
            const next = clampMinutes(value)
            try {
                localStorage.setItem(FOCUS_KEY, String(next))
            } catch {
                // 무시.
            }
            set((state) => ({
                focusMin: next,
                remaining:
                    !state.running && state.phase === 'focus' ? next * 60 : state.remaining,
            }))
        },

        setBreakMin: (value) => {
            const next = clampMinutes(value)
            try {
                localStorage.setItem(BREAK_KEY, String(next))
            } catch {
                // 무시.
            }
            set((state) => ({
                breakMin: next,
                remaining:
                    !state.running && state.phase === 'break' ? next * 60 : state.remaining,
            }))
        },

        tick: () => {
            const state = get()
            if (!state.running) {
                return
            }
            if (state.remaining > 1) {
                set({ remaining: state.remaining - 1 })
                return
            }
            // 0 도달 → 단계 전환 + 보상 + 캐릭터 멘트 + 상단 배너.
            if (state.phase === 'focus') {
                void usePlayerStore.getState().apply({ type: 'manual', delta: FOCUS_REWARD })
                window.api.character.say(`집중 ${state.focusMin}분 완료! 휴식하세요 ☕`, {
                    sticky: true,
                })
                set({
                    phase: 'break',
                    remaining: state.breakMin * 60,
                    completedFocus: state.completedFocus + 1,
                })
                flashBanner({
                    title: '포모도로 타이머',
                    lines: [`집중 ${state.focusMin}분 완료`, '휴식하세요'],
                })
            } else {
                window.api.character.say(`휴식 ${state.breakMin}분 완료! 집중하세요 🍅`, {
                    sticky: true,
                })
                set({ phase: 'focus', remaining: state.focusMin * 60 })
                flashBanner({
                    title: '포모도로 타이머',
                    lines: [`휴식 ${state.breakMin}분 완료`, '집중하세요'],
                })
            }
        },

        dismissBanner: () => {
            if (bannerTimeoutId) {
                clearTimeout(bannerTimeoutId)
                bannerTimeoutId = null
            }
            set({ banner: null })
        },
    }
})
