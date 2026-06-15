// 일정(캘린더) 영속 데이터의 IPC 계약.
// main reducer · preload bridge · renderer mirror 세 곳이 모두 이 한 파일을 import한다.

export type ScheduleItem = {
    id: string
    date: string // 시작일 'YYYY-MM-DD'
    endDate: string // 종료일 'YYYY-MM-DD' (단일 일정이면 date와 동일)
    time: string // 시작 시각 'HH:MM'
    endTime: string // 종료 시각 'HH:MM'
    title: string
    memo: string // 100자 이내 간단 메모 (없으면 '')
    // '할 일에도 추가'로 함께 만든 todo의 id. 일정 삭제 시 이 todo도 같이 지운다. 없으면 undefined.
    todoId?: string
}

export type ScheduleState = {
    items: ScheduleItem[]
}

export type ScheduleEvent =
    | {
          type: 'add'
          date: string
          endDate: string
          time: string
          endTime: string
          title: string
          memo: string
          todoId?: string
      }
    | { type: 'remove'; id: string }
    // 추가된 일정의 제목·메모 수정.
    | { type: 'update'; id: string; title: string; memo: string }

export const INITIAL_SCHEDULE_STATE: ScheduleState = {
    items: [],
}

// 일정 제목 최대 길이. UI input maxLength + reducer 안전망에 둘 다 적용.
export const MAX_SCHEDULE_TITLE_LENGTH = 30

// 일정 메모 최대 길이.
export const MAX_SCHEDULE_MEMO_LENGTH = 100
