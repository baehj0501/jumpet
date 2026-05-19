import { TodoItem } from '@renderer/entities/todo'
import type { Todo, TodoFilter } from '@renderer/entities/todo'

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
    if (filter === 'completed') {
        return todos.filter((todo) => todo.completed)
    }
    return todos
}

const EMPTY_MESSAGES: Record<TodoFilter, string> = {
    all: '아직 할 일이 없어요',
    active: '진행 중인 할 일이 없어요',
    completed: '완료한 할 일이 없어요',
}

export const TodoList = ({ todos, filter, onToggle, onRemove, onUpdateText }: TodoListProps) => {
    const visibleTodos = filterTodos(todos, filter)

    if (visibleTodos.length === 0) {
        return (
            <div
                css={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#aaaaaa',
                    fontSize: 13,
                }}
            >
                {EMPTY_MESSAGES[filter]}
            </div>
        )
    }

    return (
        <ul
            css={{
                flex: 1,
                overflowY: 'auto',
                padding: '6px 4px',
                listStyle: 'none',
            }}
        >
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
