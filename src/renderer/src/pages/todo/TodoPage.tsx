import { useState } from 'react'
import { Global, css } from '@emotion/react'
import { useTodoStore } from '@renderer/entities/todo'
import type { TodoFilter } from '@renderer/entities/todo'
import { TodoForm } from './TodoForm'
import { TodoList } from './TodoList'
import { TodoFooter } from './TodoFooter'

// TODO 별창의 루트. 데이터/액션은 useTodoStore에 위임하고 UI 조합만 담당한다.
//
// 페이지 단위 root-level 스타일(:root, body)은 emotion <Global>로 주입한다.
// 펫 윈도우의 global.css(transparent 배경)와 격리되어 이 창에서만 적용된다.
const pageGlobalStyles = css`
    :root {
        color-scheme: light;
    }

    body {
        background: #f7f7f7;
        color: #1a1a1a;
    }
`

export const TodoPage = () => {
    const { todos, addTodo, toggleTodo, removeTodo, updateTodoText, clearCompleted } = useTodoStore()
    const [filter, setFilter] = useState<TodoFilter>('all')

    const itemsLeft = todos.filter((todo) => !todo.completed).length
    const hasCompleted = todos.some((todo) => todo.completed)

    return (
        <>
            <Global styles={pageGlobalStyles} />
            <div
                css={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    background: '#ffffff',
                }}
            >
                <header
                    css={{
                        padding: '16px 18px 12px',
                        borderBottom: '1px solid #eeeeee',
                    }}
                >
                    <h1
                        css={{
                            fontSize: 18,
                            fontWeight: 600,
                            marginBottom: 10,
                            color: '#1a1a1a',
                        }}
                    >
                        할 일
                    </h1>
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
        </>
    )
}
