import { randomUUID } from 'node:crypto'
import {
    MAX_SCHEDULE_MEMO_LENGTH,
    MAX_SCHEDULE_TITLE_LENGTH,
    type ScheduleEvent,
    type ScheduleState,
} from '@shared/contracts/scheduleEvents'

// 일정 영속 데이터의 SSOT reducer.
// pure는 아니다 — 'add' 시 randomUUID를 호출한다.
export const reduceScheduleState = (state: ScheduleState, event: ScheduleEvent): ScheduleState => {
    switch (event.type) {
        case 'add': {
            const title = event.title.trim().slice(0, MAX_SCHEDULE_TITLE_LENGTH)
            if (title === '' || event.date === '') {
                return state
            }
            // 종료일이 비었거나 시작보다 빠르면 시작일로 맞춘다(단일 일정).
            // 'YYYY-MM-DD' ISO 포맷은 문자열 비교가 곧 날짜 비교.
            const endDate =
                event.endDate && event.endDate >= event.date ? event.endDate : event.date
            const memo = (event.memo ?? '').trim().slice(0, MAX_SCHEDULE_MEMO_LENGTH)
            const time = event.time || '00:00'
            const item = {
                id: randomUUID(),
                date: event.date,
                endDate,
                time,
                endTime: event.endTime || time,
                title,
                memo,
                todoId: event.todoId,
            }
            return { items: [...state.items, item] }
        }
        case 'remove': {
            const next = state.items.filter((item) => item.id !== event.id)
            if (next.length === state.items.length) {
                return state
            }
            return { items: next }
        }
        default: {
            const exhaustiveCheck: never = event
            throw new Error(`Unhandled ScheduleEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
