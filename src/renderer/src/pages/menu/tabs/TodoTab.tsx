import { useMemo, useState } from 'react'
import { useTodos, useTodoActions } from '@renderer/entities/todo'

export const TodoTab = () => {
    const todos = useTodos()
    const { addTodo, toggleTodo, removeTodo } = useTodoActions()
    const [text, setText] = useState('')

    const { activeCount, completedCount } = useMemo(() => {
        let active = 0
        let completed = 0
        for (const todo of todos) {
            if (todo.completed) {
                completed += 1
            } else {
                active += 1
            }
        }
        return { activeCount: active, completedCount: completed }
    }, [todos])

    const handleAdd = () => {
        const trimmed = text.trim()
        if (trimmed === '') {
            return
        }
        void addTodo(trimmed)
        setText('')
    }

    return (
        <div className='panel'>
            <div className='todo-add-row'>
                <input
                    className='fi'
                    placeholder='할 일 입력...'
                    maxLength={40}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            handleAdd()
                        }
                    }}
                />
                <button
                    type='button'
                    className='add-btn'
                    onClick={handleAdd}
                >
                    추가
                </button>
            </div>

            {todos.length === 0 ? (
                <div className='todo-empty'>
                    할 일을 추가해봐!
                    <br />
                    완료하면 포인트를 줄게! 🪙
                </div>
            ) : (
                <div className='todo-list'>
                    {todos.map((todo) => (
                        <div
                            key={todo.id}
                            className={todo.completed ? 'todo-item done' : 'todo-item'}
                        >
                            <div
                                className={todo.completed ? 'todo-check checked' : 'todo-check'}
                                onClick={() => {
                                    if (!todo.completed) {
                                        void toggleTodo(todo.id)
                                    }
                                }}
                            >
                                {todo.completed ? '✓' : ''}
                            </div>
                            <div className='todo-text'>{todo.text}</div>
                            <button
                                type='button'
                                className='todo-del'
                                onClick={() => void removeTodo(todo.id)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className='todo-stats'>
                <span>남은 할일 {activeCount}개</span>
                <span>완료 {completedCount}개</span>
            </div>
        </div>
    )
}
