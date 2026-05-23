import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { Todo } from '@shared/contracts/todoEvents'

// banner 자동 사라짐 시간 (ms). 4초면 사용자가 어떤 todo가 정리됐는지 읽을 수 있는 정도.
const EVICTION_BANNER_DURATION_MS = 4000

// TODO 데이터의 renderer 측 글로벌 store.
// main이 SSOT이고, 이 store는 main 데이터의 read-only 미러 + 의미 단위 액션의 진입점이다.
// usePlayerStore와 같은 패턴 — entrypoint(pages/todo/main.tsx)가 initializeTodoSync()를 1회 호출.

type TodoActions = {
    addTodo: (text: string) => Promise<void>
    // 단방향: 완료 처리만 가능하다 (main reducer 정책).
    toggleTodo: (id: string) => Promise<void>
    removeTodo: (id: string) => Promise<void>
    updateTodoText: (id: string, text: string) => Promise<void>
}

type TodoStore = {
    todos: Todo[]
    // 100개 한도 초과로 직전에 정리된 todo. banner 표시용. 4초 후 자동 null.
    lastEvictedTodo: Todo | null
} & TodoActions

const useTodoStoreInternal = create<TodoStore>((set) => ({
    todos: [],
    lastEvictedTodo: null,
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
}))

// 모듈 단위 초기화 가드. HMR 재평가 시 listener가 누적되지 않게 dispose도 같이 둔다.
let isInitialized = false
let unsubscribeFromChanges: (() => void) | null = null
let unsubscribeFromEvictions: (() => void) | null = null
// 새 evict가 도착하면 이전 timeout을 취소하고 다시 4초 카운트. 마지막 evict로부터 4초.
let dismissEvictionTimeoutId: ReturnType<typeof setTimeout> | null = null

// 명시적 진입점. 모듈 import 자체로 IPC를 호출하는 사이드이펙트를 제거하고,
// 테스트/Storybook 등 window.api가 없는 환경에서 import만으로 깨지는 일을 막는다.
export const initializeTodoSync = (): void => {
    if (isInitialized) {
        return
    }
    isInitialized = true

    void window.api.todo
        .get()
        .then((state) => {
            useTodoStoreInternal.setState({ todos: state.todos })
        })
        .catch(() => {
            // 패널 창이 닫히는 타이밍 등으로 IPC가 단절되면 조용히 무시.
        })
    unsubscribeFromChanges = window.api.todo.onChange((state) => {
        useTodoStoreInternal.setState({ todos: state.todos })
    })
    unsubscribeFromEvictions = window.api.todo.onEvicted((evictedTodos) => {
        if (evictedTodos.length === 0) {
            return
        }
        // toggle 한 호출당 한 todo만 evict되므로 마지막 1건만 표시.
        const latest = evictedTodos[evictedTodos.length - 1]
        useTodoStoreInternal.setState({ lastEvictedTodo: latest })
        if (dismissEvictionTimeoutId !== null) {
            clearTimeout(dismissEvictionTimeoutId)
        }
        dismissEvictionTimeoutId = setTimeout(() => {
            useTodoStoreInternal.setState({ lastEvictedTodo: null })
            dismissEvictionTimeoutId = null
        }, EVICTION_BANNER_DURATION_MS)
    })
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        unsubscribeFromChanges?.()
        unsubscribeFromChanges = null
        unsubscribeFromEvictions?.()
        unsubscribeFromEvictions = null
        if (dismissEvictionTimeoutId !== null) {
            clearTimeout(dismissEvictionTimeoutId)
            dismissEvictionTimeoutId = null
        }
        isInitialized = false
    })
}

// 분할 selector — todos 변경 시 액션-only 구독자는 재렌더되지 않는다.
// 액션 reference는 store 생성 시 1회 고정되어 useShallow가 안정적으로 동작한다.
export const useTodos = () => useTodoStoreInternal((state) => state.todos)
export const useTodoActions = (): TodoActions =>
    useTodoStoreInternal(
        useShallow((state) => ({
            addTodo: state.addTodo,
            toggleTodo: state.toggleTodo,
            removeTodo: state.removeTodo,
            updateTodoText: state.updateTodoText,
        })),
    )
// evict banner 전용 selector — 한 슬라이스만 구독해 다른 변경에 묻어 재렌더되지 않게.
export const useLastEvictedTodo = () => useTodoStoreInternal((state) => state.lastEvictedTodo)
