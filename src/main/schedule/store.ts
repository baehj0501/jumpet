import Store from 'electron-store'
import {
    INITIAL_SCHEDULE_STATE,
    MAX_SCHEDULE_MEMO_LENGTH,
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

// endDate는 후속 추가 필드 — 구버전 데이터엔 없을 수 있어 검증에서 요구하지 않는다.
const isScheduleItemLike = (value: unknown): boolean => {
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

// 구버전 데이터(endDate 없음) 마이그레이션 — endDate가 없거나 시작보다 빠르면 date로 채운다.
const normalizeScheduleItem = (value: Record<string, unknown>): ScheduleItem => {
    const date = value.date as string
    const endDate =
        typeof value.endDate === 'string' && value.endDate >= date ? value.endDate : date
    const memo =
        typeof value.memo === 'string' ? value.memo.slice(0, MAX_SCHEDULE_MEMO_LENGTH) : ''
    const time = value.time as string
    const endTime = typeof value.endTime === 'string' && value.endTime ? value.endTime : time
    return {
        id: value.id as string,
        date,
        endDate,
        time,
        endTime,
        title: value.title as string,
        memo,
    }
}

export const readScheduleState = (): ScheduleState => {
    const raw = store.get('schedule') as ScheduleState | undefined
    if (raw && Array.isArray(raw.items)) {
        const items = raw.items
            .filter(isScheduleItemLike)
            .map((item) => normalizeScheduleItem(item as unknown as Record<string, unknown>))
        return { items }
    }
    console.warn('[scheduleState] hydration failed, resetting to INITIAL_SCHEDULE_STATE', raw)
    store.set('schedule', INITIAL_SCHEDULE_STATE)
    return INITIAL_SCHEDULE_STATE
}

export const writeScheduleState = (next: ScheduleState): void => {
    store.set('schedule', next)
}
