import { useMemo, useState } from 'react'
import { useTodos, useTodoActions } from '@renderer/entities/todo'

type TodoFilter = 'active' | 'completed'

// 시각 표기 — 'M/D HH:MM'. (남은 할일=추가 시각, 완료=완료 시각)
const formatDateTime = (epochMs: number): string => {
    const date = new Date(epochMs)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}/${day} ${hours}:${minutes}`
}

export const TodoTab = () => {
    const todos = useTodos()
    const { addTodo, toggleTodo, removeTodo } = useTodoActions()
    const [text, setText] = useState('')
    const [filter, setFilter] = useState<TodoFilter>('active')

    const { activeTodos, completedTodos } = useMemo(() => {
        const activeTodos = []
        const completedTodos = []
        for (const todo of todos) {
            if (todo.completed) {
                completedTodos.push(todo)
            } else {
                activeTodos.push(todo)
            }
        }
        return { activeTodos, completedTodos }
    }, [todos])

    const visibleTodos = filter === 'active' ? activeTodos : completedTodos

    // 출처별 분리 — '일정'(schedule)과 '할일'(manual) 두 섹션으로.
    const scheduleTodos = visibleTodos.filter((todo) => todo.source === 'schedule')
    const manualTodos = visibleTodos.filter((todo) => todo.source !== 'schedule')

    const handleAdd = () => {
        const trimmed = text.trim()
        if (trimmed === '') {
            return
        }
        void addTodo(trimmed)
        setText('')
    }

    // 할 일 한 줄 렌더 — '일정'/'할일' 두 섹션이 공유.
    const renderTodoItem = (todo: (typeof todos)[number]) => {
        // 완료 항목은 완료 시각, 남은 항목은 추가 시각을 보여준다.
        const dateMs = todo.completed ? todo.completedAt : todo.createdAt
        return (
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
                {dateMs !== undefined && <span className='todo-date'>{formatDateTime(dateMs)}</span>}
                <button
                    type='button'
                    className='todo-del'
                    onClick={() => void removeTodo(todo.id)}
                >
                    ✕
                </button>
            </div>
        )
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
                        // 한글(IME) 조합 중 Enter는 조합 확정용 — 추가를 트리거하지 않는다.
                        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
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

            <div className='todo-filters'>
                <button
                    type='button'
                    className={filter === 'active' ? 'todo-filter active' : 'todo-filter'}
                    onClick={() => setFilter('active')}
                >
                    남은 할일 {activeTodos.length}
                </button>
                <button
                    type='button'
                    className={filter === 'completed' ? 'todo-filter active' : 'todo-filter'}
                    onClick={() => setFilter('completed')}
                >
                    완료 {completedTodos.length}
                </button>
            </div>

            <div className='section-title-1'>일정</div>
            {scheduleTodos.length === 0 ? (
                <div className='empty-hint'>
                    {filter === 'active' ? '일정에서 추가한 할일이 없어요' : '완료한 일정이 없어요'}
                </div>
            ) : (
                <div className='todo-list'>{scheduleTodos.map(renderTodoItem)}</div>
            )}

            <div className='section-title-1'>할일</div>
            {manualTodos.length === 0 ? (
                <div className='empty-hint'>
                    {filter === 'active' ? '남은 할일이 없어요' : '완료한 할일이 없어요'}
                </div>
            ) : (
                <div className='todo-list'>{manualTodos.map(renderTodoItem)}</div>
            )}
        </div>
    )
}
