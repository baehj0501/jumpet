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
        // 알람 오프셋(분). null/undefined면 알람 없음, 0이면 정시.
        remindOffsetMinutes?: number | null,
    ) => Promise<void>
    // 일정 1개 삭제.
    remove: (id: string) => Promise<void>
    // 일정 1개의 제목·메모 수정.
    update: (id: string, title: string, memo: string) => Promise<void>
    // 알람 오프셋(분) 설정·해제(null이면 해제).
    setRemind: (id: string, remindOffsetMinutes: number | null) => Promise<void>
}

type ScheduleStore = {
    items: ScheduleItem[]
} & ScheduleActions

const useScheduleStoreInternal = create<ScheduleStore>((set) => ({
    items: [],
    add: async (date, endDate, time, endTime, title, memo, todoId, remindOffsetMinutes) => {
        const next = await window.api.schedule.apply({
            type: 'add',
            date,
            endDate,
            time,
            endTime,
            title,
            memo,
            todoId,
            // null(없음) → undefined. 0(정시)은 그대로 유지(?? 는 null/undefined만 잡음).
            remindOffsetMinutes: remindOffsetMinutes ?? undefined,
        })
        set({ items: next.items })
    },
    remove: async (id) => {
        const next = await window.api.schedule.apply({ type: 'remove', id })
        set({ items: next.items })
    },
    update: async (id, title, memo) => {
        const next = await window.api.schedule.apply({ type: 'update', id, title, memo })
        set({ items: next.items })
    },
    setRemind: async (id, remindOffsetMinutes) => {
        const next = await window.api.schedule.apply({
            type: 'setRemind',
            id,
            remindOffsetMinutes,
        })
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
            update: state.update,
            setRemind: state.setRemind,
        })),
    )
