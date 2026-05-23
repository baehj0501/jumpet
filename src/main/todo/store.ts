import Store from 'electron-store'
import { INITIAL_TODO_STATE, type Todo, type TodoState } from '@shared/contracts/todoEvents'

// playerState와 같은 디스크 영속 패턴.
// 별도 Store 인스턴스를 만들어도 electron-store는 같은 config.json에 키를 추가한다.
type SchemaShape = {
    todo: TodoState
}

const store = new Store<SchemaShape>({
    defaults: {
        todo: INITIAL_TODO_STATE,
    },
})

const isTodo = (value: unknown): value is Todo => {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    const candidate = value as Record<string, unknown>
    if (typeof candidate.id !== 'string') return false
    if (typeof candidate.text !== 'string') return false
    if (typeof candidate.completed !== 'boolean') return false
    if (typeof candidate.createdAt !== 'number' || !Number.isFinite(candidate.createdAt)) return false
    // completedAt은 optional — 있으면 finite number여야 함 (구버전 데이터 호환).
    if (candidate.completedAt !== undefined) {
        if (typeof candidate.completedAt !== 'number' || !Number.isFinite(candidate.completedAt)) {
            return false
        }
    }
    return true
}

export const readTodoState = (): TodoState => {
    // 디스크 손상·사용자 자가 편집 등으로 깨진 값이 들어올 수 있어 가볍게 검사.
    // 배열 안의 항목 단위로 검증해 일부만 깨졌다면 살릴 수 있는 것만 살린다.
    const raw = store.get('todo') as TodoState | undefined
    if (raw && Array.isArray(raw.todos)) {
        const sanitized = raw.todos.filter(isTodo)
        return { todos: sanitized }
    }
    console.warn('[todoState] hydration failed, resetting to INITIAL_TODO_STATE', raw)
    store.set('todo', INITIAL_TODO_STATE)
    return INITIAL_TODO_STATE
}

export const writeTodoState = (next: TodoState): void => {
    store.set('todo', next)
}
