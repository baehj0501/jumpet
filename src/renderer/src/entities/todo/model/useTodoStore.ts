import { useCallback, useEffect, useState } from 'react'
import type { Todo } from './Todo'
import { isTodo } from './Todo'
import { STORAGE_KEY, STORAGE_VERSION } from './constants'

// 저장 봉투. version 필드로 스키마 진화 시 구버전 데이터를 안전하게 폐기한다.
type StorageEnvelope = {
    version: number
    todos: Todo[]
}

const loadFromStorage = (): Todo[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw === null) {
            return []
        }
        const parsed: unknown = JSON.parse(raw)
        if (typeof parsed !== 'object' || parsed === null) {
            return []
        }
        const envelope = parsed as Partial<StorageEnvelope>
        if (envelope.version !== STORAGE_VERSION) {
            return []
        }
        if (!Array.isArray(envelope.todos)) {
            return []
        }
        return envelope.todos.filter(isTodo)
    } catch {
        // JSON 깨짐 / quota 등 모든 케이스에서 빈 리스트로 fallback.
        return []
    }
}

const saveToStorage = (todos: Todo[]) => {
    try {
        const envelope: StorageEnvelope = {
            version: STORAGE_VERSION,
            todos,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
    } catch {
        // quota 초과 등은 조용히 무시 (사용자에게 띄울 만한 시그널이 아니다).
    }
}

// 할 일 목록 상태 + localStorage 동기화 hook.
// 액션은 의미 단위로만 노출해 raw setTodos 우회를 차단한다.
export const useTodoStore = () => {
    const [todos, setTodos] = useState<Todo[]>(() => loadFromStorage())

    useEffect(() => {
        saveToStorage(todos)
    }, [todos])

    const addTodo = useCallback((text: string) => {
        const trimmed = text.trim()
        if (trimmed === '') {
            return
        }
        setTodos((previousTodos) => [
            ...previousTodos,
            {
                id: crypto.randomUUID(),
                text: trimmed,
                completed: false,
                createdAt: Date.now(),
            },
        ])
    }, [])

    const toggleTodo = useCallback((id: string) => {
        setTodos((previousTodos) =>
            previousTodos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
        )
    }, [])

    const removeTodo = useCallback((id: string) => {
        setTodos((previousTodos) => previousTodos.filter((todo) => todo.id !== id))
    }, [])

    // 인라인 편집의 저장 동작. 빈 문자열로 저장되면 삭제로 간주 (TodoMVC 표준).
    const updateTodoText = useCallback((id: string, text: string) => {
        const trimmed = text.trim()
        if (trimmed === '') {
            setTodos((previousTodos) => previousTodos.filter((todo) => todo.id !== id))
            return
        }
        setTodos((previousTodos) =>
            previousTodos.map((todo) => (todo.id === id ? { ...todo, text: trimmed } : todo)),
        )
    }, [])

    const clearCompleted = useCallback(() => {
        setTodos((previousTodos) => previousTodos.filter((todo) => !todo.completed))
    }, [])

    return {
        todos,
        addTodo,
        toggleTodo,
        removeTodo,
        updateTodoText,
        clearCompleted,
    }
}
