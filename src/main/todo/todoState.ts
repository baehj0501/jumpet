import { randomUUID } from 'node:crypto'

// 할 일 항목.
// createdAt은 안정적 정렬을 위해 보관한다.
export type Todo = {
    id: string
    text: string
    completed: boolean
    createdAt: number
}

export type TodoState = {
    todos: Todo[]
}

// 클라이언트가 의미 단위로 보내는 액션.
// id/createdAt 같은 비결정적 값은 main의 reducer 안에서 생성한다 — 도메인 룰 한 곳 집중.
export type TodoEvent =
    | { type: 'add'; text: string }
    | { type: 'toggle'; id: string }
    | { type: 'remove'; id: string }
    | { type: 'updateText'; id: string; text: string }
    | { type: 'clearCompleted' }

export const INITIAL_TODO_STATE: TodoState = {
    todos: [],
}

// 도메인 로직.
// pure는 아니다 — 'add' 시 randomUUID/Date.now를 호출한다.
// 호출자(IPC 핸들러)가 enrich/dispatch를 둘로 나누는 대신, 인터페이스 일관성을 위해
// reducer 안에서 처리한다.
export const reduceTodoState = (state: TodoState, event: TodoEvent): TodoState => {
    switch (event.type) {
        case 'add': {
            const trimmed = event.text.trim()
            if (trimmed === '') {
                return state
            }
            const newTodo: Todo = {
                id: randomUUID(),
                text: trimmed,
                completed: false,
                createdAt: Date.now(),
            }
            return { todos: [...state.todos, newTodo] }
        }
        case 'toggle': {
            return {
                todos: state.todos.map((todo) =>
                    todo.id === event.id ? { ...todo, completed: !todo.completed } : todo,
                ),
            }
        }
        case 'remove': {
            return { todos: state.todos.filter((todo) => todo.id !== event.id) }
        }
        case 'updateText': {
            // 빈 텍스트로 저장하면 삭제로 간주 (TodoMVC 표준).
            const trimmed = event.text.trim()
            if (trimmed === '') {
                return { todos: state.todos.filter((todo) => todo.id !== event.id) }
            }
            return {
                todos: state.todos.map((todo) =>
                    todo.id === event.id ? { ...todo, text: trimmed } : todo,
                ),
            }
        }
        case 'clearCompleted': {
            return { todos: state.todos.filter((todo) => !todo.completed) }
        }
        default: {
            // TodoEvent union이 확장되면 TS가 event.type을 never로 좁히지 못해
            // 여기서 컴파일 에러로 잡아준다.
            const exhaustiveCheck: never = event
            throw new Error(`Unhandled TodoEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
