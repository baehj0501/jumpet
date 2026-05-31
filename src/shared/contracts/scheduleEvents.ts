// 일정(캘린더) 영속 데이터의 IPC 계약.
// main reducer · preload bridge · renderer mirror 세 곳이 모두 이 한 파일을 import한다.

export type ScheduleItem = {
    id: string
    date: string // 'YYYY-MM-DD'
    time: string // 'HH:MM'
    title: string
}

export type ScheduleState = {
    items: ScheduleItem[]
}

export type ScheduleEvent =
    | { type: 'add'; date: string; time: string; title: string }
    | { type: 'remove'; id: string }

export const INITIAL_SCHEDULE_STATE: ScheduleState = {
    items: [],
}

// 일정 제목 최대 길이. UI input maxLength + reducer 안전망에 둘 다 적용.
export const MAX_SCHEDULE_TITLE_LENGTH = 30
