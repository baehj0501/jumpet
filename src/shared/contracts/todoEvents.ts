// TODO 영속 데이터의 IPC 계약.
// main reducer · preload bridge · renderer mirror 세 곳이 모두 이 한 파일을 import한다.

export type Todo = {
    id: string
    text: string
    completed: boolean
    createdAt: number
    // 완료 시점(toggle false→true). 미완료 항목에는 undefined.
    // UI에서 "5/16 14:30" 같은 완료 시각 표시에 사용.
    completedAt?: number
}

export type TodoState = {
    todos: Todo[]
}

// 'toggle'은 단방향 (완료 처리만, 되돌릴 수 없음).
// 편집/삭제는 진행·완료 양쪽 모두 가능 (명세 §8).
// 100개 초과 시 main reducer가 createdAt 기준 가장 오래된 완료 항목부터 FIFO 정리.
export type TodoEvent =
    | { type: 'add'; text: string }
    | { type: 'toggle'; id: string }
    | { type: 'remove'; id: string }
    | { type: 'updateText'; id: string; text: string }

export const INITIAL_TODO_STATE: TodoState = {
    todos: [],
}

// 할 일 텍스트 최대 길이 (명세 §8). UI input의 maxLength + reducer 안전망에 둘 다 적용.
export const MAX_TODO_TEXT_LENGTH = 40
