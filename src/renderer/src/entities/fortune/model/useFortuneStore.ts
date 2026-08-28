import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { FortuneRecord } from '@shared/contracts/fortuneEvents'

// 운세 데이터의 renderer 측 글로벌 store.
// main이 SSOT이고, 이 store는 main 데이터의 read-only 미러 + 의미 단위 액션의 진입점이다.
// useTodoStore와 같은 패턴 — entrypoint(pages/fortune/main.tsx)가 initializeFortuneSync()를 1회 호출.

type FortuneActions = {
    // 오늘 운세를 보장한다(없으면 추첨). 날짜당 멱등이라 여러 번 불러도 안전.
    roll: () => Promise<void>
}

type FortuneStore = {
    today: FortuneRecord | null
} & FortuneActions

const useFortuneStoreInternal = create<FortuneStore>((set) => ({
    today: null,
    roll: async () => {
        const next = await window.api.fortune.apply({ type: 'roll' })
        set({ today: next.today })
    },
}))

// 모듈 단위 초기화 가드 + HMR dispose (listener 누적 방지).
let isInitialized = false
let unsubscribeFromChanges: (() => void) | null = null

export const initializeFortuneSync = (): void => {
    if (isInitialized) {
        return
    }
    isInitialized = true

    void window.api.fortune
        .get()
        .then((state) => {
            useFortuneStoreInternal.setState({ today: state.today })
        })
        .catch(() => {
            // 패널 창이 닫히는 타이밍 등으로 IPC가 단절되면 조용히 무시.
        })
    unsubscribeFromChanges = window.api.fortune.onChange((state) => {
        useFortuneStoreInternal.setState({ today: state.today })
    })
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        unsubscribeFromChanges?.()
        unsubscribeFromChanges = null
        isInitialized = false
    })
}

export const useTodayFortune = () => useFortuneStoreInternal((state) => state.today)
export const useFortuneActions = (): FortuneActions =>
    useFortuneStoreInternal(
        useShallow((state) => ({
            roll: state.roll,
        })),
    )
