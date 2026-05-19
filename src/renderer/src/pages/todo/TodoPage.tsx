import { useState } from 'react'
import { useTodoStore } from '@renderer/entities/todo'
import type { TodoFilter } from '@renderer/entities/todo'
import { TodoForm } from './TodoForm'
import { TodoList } from './TodoList'
import { TodoFooter } from './TodoFooter'

// TODO 별창의 루트. 데이터/액션은 useTodoStore에 위임하고 UI 조합만 담당한다.
export const TodoPage = () => {
    const { todos, addTodo, toggleTodo, removeTodo, updateTodoText, clearCompleted } = useTodoStore()
    const [filter, setFilter] = useState<TodoFilter>('all')

    const itemsLeft = todos.filter((todo) => !todo.completed).length
    const hasCompleted = todos.some((todo) => todo.completed)

    return (
        <div className='todo-page'>
            <header className='todo-header'>
                <h1>할 일</h1>
                <TodoForm onAdd={addTodo} />
            </header>
            <TodoList
                todos={todos}
                filter={filter}
                onToggle={toggleTodo}
                onRemove={removeTodo}
                onUpdateText={updateTodoText}
            />
            {todos.length > 0 && (
                <TodoFooter
                    itemsLeft={itemsLeft}
                    filter={filter}
                    onFilterChange={setFilter}
                    hasCompleted={hasCompleted}
                    onClearCompleted={clearCompleted}
                />
            )}
        </div>
    )
}
