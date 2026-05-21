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
    // 'toggle'은 단방향 — 완료 처리만 가능하고 진행중으로 되돌릴 수 없다.
    // 이유: 명세 "완료한 to-do 모아두기" 의미 + 같은 to-do 재토글로 점수 어뷰징 방지.
    | { type: 'toggle'; id: string }
    | { type: 'remove'; id: string }
    | { type: 'updateText'; id: string; text: string }

export const INITIAL_TODO_STATE: TodoState = {
    todos: [],
}

// 완료한 to-do 보관 상한 (명세). 초과 시 createdAt 기준 가장 오래된 완료 항목부터 제거.
const MAX_COMPLETED_TODOS = 100

// 완료 보관 상한 정리.
// 'toggle'은 단방향(+1)이라 한 호출당 완료 항목이 최대 1개만 늘어난다 — 초과는 정확히 1건.
// 따라서 정렬 없이 단일 패스로 가장 오래된 완료 항목 1건만 찾아 evict.
const pruneOldestCompleted = (todos: Todo[]): Todo[] => {
    let completedCount = 0
    let oldestCompleted: Todo | null = null
    for (const todo of todos) {
        if (!todo.completed) {
            continue
        }
        completedCount += 1
        if (oldestCompleted === null || todo.createdAt < oldestCompleted.createdAt) {
            oldestCompleted = todo
        }
    }
    if (completedCount <= MAX_COMPLETED_TODOS) {
        return todos
    }
    const evictId = oldestCompleted!.id
    return todos.filter((todo) => todo.id !== evictId)
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
            const target = state.todos.find((todo) => todo.id === event.id)
            if (!target || target.completed) {
                // 없는 id이거나 이미 완료된 항목 — 단방향 정책상 변경 없음.
                return state
            }
            const updated = state.todos.map((todo) =>
                todo.id === event.id ? { ...todo, completed: true } : todo,
            )
            return { todos: pruneOldestCompleted(updated) }
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
        default: {
            // TodoEvent union이 확장되면 TS가 event.type을 never로 좁히지 못해
            // 여기서 컴파일 에러로 잡아준다.
            const exhaustiveCheck: never = event
            throw new Error(`Unhandled TodoEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
