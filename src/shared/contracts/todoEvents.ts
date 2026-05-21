// TODO 영속 데이터의 IPC 계약.
// main reducer · preload bridge · renderer mirror 세 곳이 모두 이 한 파일을 import한다.

export type Todo = {
    id: string
    text: string
    completed: boolean
    createdAt: number
}

export type TodoState = {
    todos: Todo[]
}

// 'toggle'은 단방향 (완료 처리만, 되돌릴 수 없음).
// 100개 초과 시 main reducer가 createdAt 기준 가장 오래된 완료 항목부터 FIFO 정리.
export type TodoEvent =
    | { type: 'add'; text: string }
    | { type: 'toggle'; id: string }
    | { type: 'remove'; id: string }
    | { type: 'updateText'; id: string; text: string }

export const INITIAL_TODO_STATE: TodoState = {
    todos: [],
}
