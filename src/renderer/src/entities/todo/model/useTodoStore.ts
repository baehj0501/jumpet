import { create } from 'zustand'
import type { Todo } from './Todo'

// TODO 데이터의 renderer 측 글로벌 store.
// main이 SSOT이고, 이 store는 main 데이터의 read-only 미러 + 의미 단위 액션의 진입점이다.
// usePlayerStore와 같은 패턴 — 모듈 로드 시 한 번 main 동기화를 시작하고,
// 'todo:changed' broadcast로 자동 갱신된다.
//
// 반환 인터페이스는 마이그레이션 전 hook과 동일하게 유지해 TodoPage 변경을 0으로 만든다.

type TodoStore = {
    todos: Todo[]
    addTodo: (text: string) => Promise<void>
    toggleTodo: (id: string) => Promise<void>
    removeTodo: (id: string) => Promise<void>
    updateTodoText: (id: string, text: string) => Promise<void>
    clearCompleted: () => Promise<void>
}

const useTodoStoreInternal = create<TodoStore>((set) => ({
    todos: [],
    addTodo: async (text) => {
        const next = await window.api.todo.apply({ type: 'add', text })
        set({ todos: next.todos })
    },
    toggleTodo: async (id) => {
        const next = await window.api.todo.apply({ type: 'toggle', id })
        set({ todos: next.todos })
    },
    removeTodo: async (id) => {
        const next = await window.api.todo.apply({ type: 'remove', id })
        set({ todos: next.todos })
    },
    updateTodoText: async (id, text) => {
        const next = await window.api.todo.apply({ type: 'updateText', id, text })
        set({ todos: next.todos })
    },
    clearCompleted: async () => {
        const next = await window.api.todo.apply({ type: 'clearCompleted' })
        set({ todos: next.todos })
    },
}))

// 모듈 단위 초기화 가드 — usePlayerStore와 동일 패턴.
// HMR 재평가 시 listener가 누적되지 않게 dispose도 같이 둔다.
let isInitialized = false
let unsubscribeFromChanges: (() => void) | null = null

const initializeTodoSync = (): void => {
    if (isInitialized) {
        return
    }
    isInitialized = true

    void window.api.todo.get().then((state) => {
        useTodoStoreInternal.setState({ todos: state.todos })
    })
    unsubscribeFromChanges = window.api.todo.onChange((state) => {
        useTodoStoreInternal.setState({ todos: state.todos })
    })
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        unsubscribeFromChanges?.()
        unsubscribeFromChanges = null
        isInitialized = false
    })
}

initializeTodoSync()

// 사용처는 마이그레이션 전과 동일한 호출 방식 유지:
//   const { todos, addTodo, toggleTodo, ... } = useTodoStore()
export const useTodoStore = (): TodoStore => useTodoStoreInternal()
