import { randomUUID } from 'node:crypto'
import {
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
            const item = {
                id: randomUUID(),
                date: event.date,
                time: event.time || '00:00',
                title,
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
