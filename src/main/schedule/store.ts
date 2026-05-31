import Store from 'electron-store'
import {
    INITIAL_SCHEDULE_STATE,
    type ScheduleItem,
    type ScheduleState,
} from '@shared/contracts/scheduleEvents'

type SchemaShape = {
    schedule: ScheduleState
}

const store = new Store<SchemaShape>({
    defaults: {
        schedule: INITIAL_SCHEDULE_STATE,
    },
})

const isScheduleItem = (value: unknown): value is ScheduleItem => {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    const candidate = value as Record<string, unknown>
    return (
        typeof candidate.id === 'string' &&
        typeof candidate.date === 'string' &&
        typeof candidate.time === 'string' &&
        typeof candidate.title === 'string'
    )
}

export const readScheduleState = (): ScheduleState => {
    const raw = store.get('schedule') as ScheduleState | undefined
    if (raw && Array.isArray(raw.items)) {
        return { items: raw.items.filter(isScheduleItem) }
    }
    console.warn('[scheduleState] hydration failed, resetting to INITIAL_SCHEDULE_STATE', raw)
    store.set('schedule', INITIAL_SCHEDULE_STATE)
    return INITIAL_SCHEDULE_STATE
}

export const writeScheduleState = (next: ScheduleState): void => {
    store.set('schedule', next)
}
