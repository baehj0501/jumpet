import { useMemo, useState } from 'react'
import { Global } from '@emotion/react'
import { useTodos, useTodoActions, useLastEvictedTodo } from '@renderer/entities/todo'
import type { TodoFilter } from '@renderer/entities/todo'
import { TodoForm } from './TodoForm'
import { TodoList } from './TodoList'
import { TodoFooter } from './TodoFooter'
import {
    containerStyle,
    evictionBannerStyle,
    headerStyle,
    pageGlobalStyles,
    titleStyle,
} from './TodoPage.styles'

// TODO 별창의 루트. 데이터/액션은 useTodoStore에 위임하고 UI 조합만 담당한다.
export const TodoPage = () => {
    const todos = useTodos()
    const { addTodo, toggleTodo, removeTodo, updateTodoText } = useTodoActions()
    const lastEvictedTodo = useLastEvictedTodo()
    // 명세상 메인 탭은 진행중. 사용자가 패널을 열면 곧바로 진행중 목록부터 본다.
    const [filter, setFilter] = useState<TodoFilter>('active')

    // todos 한 번 순회로 active/completed 카운트를 같이 계산.
    // footer가 두 탭에서 각각 다른 숫자를 보여주므로 두 값 다 필요.
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

    return (
        <>
            <Global styles={pageGlobalStyles} />
            <div css={containerStyle}>
                <header css={headerStyle}>
                    <h1 css={titleStyle}>할 일</h1>
                    <TodoForm onAdd={addTodo} />
                </header>
                {lastEvictedTodo && (
                    <div
                        css={evictionBannerStyle}
                        role='status'
                        aria-live='polite'
                    >
                        완료 항목 보관 한도(100개)를 넘어 가장 오래된 “{lastEvictedTodo.text}”가 정리됐어요
                    </div>
                )}
                <TodoList
                    todos={todos}
                    filter={filter}
                    onToggle={toggleTodo}
                    onRemove={removeTodo}
                    onUpdateText={updateTodoText}
                />
                {todos.length > 0 && (
                    <TodoFooter
                        activeCount={activeCount}
                        completedCount={completedCount}
                        filter={filter}
                        onFilterChange={setFilter}
                    />
                )}
            </div>
        </>
    )
}
