import { TodoItem } from '@renderer/entities/todo'
import type { Todo, TodoFilter } from '@renderer/entities/todo'
import { emptyStateStyle, listStyle } from './TodoList.styles'

type TodoListProps = {
    todos: Todo[]
    filter: TodoFilter
    onToggle: (id: string) => void
    onRemove: (id: string) => void
    onUpdateText: (id: string, text: string) => void
}

const filterTodos = (todos: Todo[], filter: TodoFilter): Todo[] => {
    if (filter === 'active') {
        return todos.filter((todo) => !todo.completed)
    }
    return todos.filter((todo) => todo.completed)
}

const EMPTY_MESSAGES: Record<TodoFilter, string> = {
    active: '진행 중인 할 일이 없어요',
    completed: '완료한 할 일이 없어요',
}

export const TodoList = ({ todos, filter, onToggle, onRemove, onUpdateText }: TodoListProps) => {
    const visibleTodos = filterTodos(todos, filter)

    if (visibleTodos.length === 0) {
        return <div css={emptyStateStyle}>{EMPTY_MESSAGES[filter]}</div>
    }

    return (
        <ul css={listStyle}>
            {visibleTodos.map((todo) => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={onToggle}
                    onRemove={onRemove}
                    onUpdateText={onUpdateText}
                />
            ))}
        </ul>
    )
}
