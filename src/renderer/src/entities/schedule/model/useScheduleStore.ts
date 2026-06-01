import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { ScheduleItem } from '@shared/contracts/scheduleEvents'

// 일정의 renderer 측 글로벌 store.
// main이 SSOT, 이 store는 read-only 미러 + 의미 단위 액션의 진입점.
// useItemStore와 같은 패턴 — entrypoint(pages/*/main.tsx)가 initializeScheduleSync()를 1회 호출.

type ScheduleActions = {
    // 일정 1개 추가. date(시작)·endDate(종료)는 'YYYY-MM-DD', time은 'HH:MM', memo는 100자 이내.
    add: (
        date: string,
        endDate: string,
        time: string,
        endTime: string,
        title: string,
        memo: string,
        todoId?: string,
    ) => Promise<void>
    // 일정 1개 삭제.
    remove: (id: string) => Promise<void>
}

type ScheduleStore = {
    items: ScheduleItem[]
} & ScheduleActions

const useScheduleStoreInternal = create<ScheduleStore>((set) => ({
    items: [],
    add: async (date, endDate, time, endTime, title, memo, todoId) => {
        const next = await window.api.schedule.apply({
            type: 'add',
            date,
            endDate,
            time,
            endTime,
            title,
            memo,
            todoId,
        })
        set({ items: next.items })
    },
    remove: async (id) => {
        const next = await window.api.schedule.apply({ type: 'remove', id })
        set({ items: next.items })
    },
}))

let isInitialized = false
let unsubscribeFromChanges: (() => void) | null = null

export const initializeScheduleSync = (): void => {
    if (isInitialized) {
        return
    }
    isInitialized = true

    void window.api.schedule
        .get()
        .then((state) => {
            useScheduleStoreInternal.setState({ items: state.items })
        })
        .catch(() => {
            // 창이 닫히는 타이밍 등으로 IPC가 단절되면 조용히 무시.
        })
    unsubscribeFromChanges = window.api.schedule.onChange((state) => {
        useScheduleStoreInternal.setState({ items: state.items })
    })
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        unsubscribeFromChanges?.()
        unsubscribeFromChanges = null
        isInitialized = false
    })
}

export const useScheduleItems = () => useScheduleStoreInternal((state) => state.items)
export const useScheduleActions = (): ScheduleActions =>
    useScheduleStoreInternal(
        useShallow((state) => ({
            add: state.add,
            remove: state.remove,
        })),
    )
