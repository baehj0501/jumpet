// TODO 영속 데이터의 IPC 계약.
// main reducer · preload bridge · renderer mirror 세 곳이 모두 이 한 파일을 import한다.

// 할 일의 출처. 'schedule'은 일정 탭에서 추가돼 '일정' 섹션에, 그 외 'manual'은 '할일' 섹션에 묶인다.
// optional — 구버전 데이터/이벤트는 'manual'로 간주.
export type TodoSource = 'manual' | 'schedule'

export type Todo = {
    id: string
    text: string
    completed: boolean
    createdAt: number
    // 완료 시점(toggle false→true). 미완료 항목에는 undefined.
    // UI에서 "5/16 14:30" 같은 완료 시각 표시에 사용.
    completedAt?: number
    // 출처(일정/수동). 없으면 'manual'로 본다.
    source?: TodoSource
    // 프로젝트 태그. 없거나 ''면 '미분류'로 본다. 상단 칩으로 필터링.
    project?: string
}

export type TodoState = {
    todos: Todo[]
}

// 'toggle'은 단방향 (완료 처리만, 되돌릴 수 없음).
// 편집/삭제는 진행·완료 양쪽 모두 가능 (명세 §8).
// 100개 초과 시 main reducer가 createdAt 기준 가장 오래된 완료 항목부터 FIFO 정리.
export type TodoEvent =
    | { type: 'add'; text: string; source?: TodoSource; project?: string }
    | { type: 'toggle'; id: string }
    | { type: 'remove'; id: string }
    | { type: 'updateText'; id: string; text: string }
    | { type: 'setProject'; id: string; project: string }

export const INITIAL_TODO_STATE: TodoState = {
    todos: [],
}

// 할 일 텍스트 최대 길이 (명세 §8). UI input의 maxLength + reducer 안전망에 둘 다 적용.
export const MAX_TODO_TEXT_LENGTH = 40

// 프로젝트 태그 최대 길이.
export const MAX_TODO_PROJECT_LENGTH = 16
