import { useMemo, useState } from 'react'
import { useTodos, useTodoActions } from '@renderer/entities/todo'
import { MAX_TODO_PROJECT_LENGTH } from '@shared/contracts/todoEvents'

// 상단 탭 — 할 일(진행 중 수동) / 지난 할 일(완료) / 일정(진행 중 일정).
type TodoView = 'active' | 'completed' | 'schedule'

// 프로젝트 선택 특수값.
const PROJECT_ALL = '__ALL__'
const PROJECT_NONE = '__NONE__'

// 사용자가 만든(아직 할일이 없을 수 있는) 프로젝트 목록 저장 키.
const PROJECTS_KEY = 'jumpet.todo.projects'

const readStoredProjects = (): string[] => {
    try {
        const raw = localStorage.getItem(PROJECTS_KEY)
        if (!raw) {
            return []
        }
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : []
    } catch {
        return []
    }
}

const writeStoredProjects = (projects: string[]): void => {
    try {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
    } catch {
        // localStorage 접근 불가 시 무시.
    }
}

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
    const { addTodo, toggleTodo, removeTodo, setTodoProject } = useTodoActions()
    const [text, setText] = useState('')
    const [view, setView] = useState<TodoView>('active')
    const [selectedProject, setSelectedProject] = useState<string>(PROJECT_ALL)
    // 새 할일을 넣을 프로젝트(입력 줄 드롭다운). 기본 '전체'(=미지정). 필터(selectedProject)와 별개.
    const [addProject, setAddProject] = useState<string>(PROJECT_ALL)
    // 사용자가 만든 프로젝트 목록(빈 프로젝트 포함). 할일에 달린 태그와 합쳐 보여준다.
    const [createdProjects, setCreatedProjects] = useState<string[]>(() => readStoredProjects())
    const [newProject, setNewProject] = useState('')
    // 삭제 확인 중인 프로젝트(null이면 확인창 닫힘).
    const [deletingProject, setDeletingProject] = useState<string | null>(null)
    // 프로젝트 편집 모드 — 켜면 칩에 'x' 삭제 버튼이 나타난다.
    const [editingProjects, setEditingProjects] = useState(false)

    // 출처·완료 기준 분류.
    const { activeManual, activeSchedule, completedTodos } = useMemo(() => {
        const activeManual = []
        const activeSchedule = []
        const completedTodos = []
        for (const todo of todos) {
            if (todo.completed) {
                completedTodos.push(todo)
            } else if (todo.source === 'schedule') {
                activeSchedule.push(todo)
            } else {
                activeManual.push(todo)
            }
        }
        return { activeManual, activeSchedule, completedTodos }
    }, [todos])

    // 프로젝트 칩 = 만든 목록 ∪ '할일'(수동) 항목에 달린 태그. (일정 항목은 제외)
    const projectNames = useMemo(() => {
        const set = new Set<string>(createdProjects)
        for (const todo of todos) {
            if (todo.source !== 'schedule' && todo.project) {
                set.add(todo.project)
            }
        }
        return Array.from(set).sort()
    }, [todos, createdProjects])

    const matchesProject = (todo: (typeof todos)[number]): boolean => {
        if (selectedProject === PROJECT_ALL) {
            return true
        }
        if (selectedProject === PROJECT_NONE) {
            return !todo.project
        }
        return todo.project === selectedProject
    }

    // 현재 탭에 보일 목록.
    const listTodos =
        view === 'completed'
            ? completedTodos
            : view === 'schedule'
              ? activeSchedule
              : activeManual.filter(matchesProject)

    // 입력 줄 드롭다운에서 고른 프로젝트로 새 할일을 넣는다. '전체'면 미지정.
    const addTargetProject = addProject !== PROJECT_ALL ? addProject : undefined

    const handleAdd = () => {
        const trimmed = text.trim()
        if (trimmed === '') {
            return
        }
        void addTodo(trimmed, undefined, addTargetProject)
        setText('')
        // 추가 후 프로젝트 선택은 '전체'로 초기화.
        setAddProject(PROJECT_ALL)
    }

    // 프로젝트를 만든 목록에서 제거하고 선택을 전체로 되돌린다.
    const removeProjectFromList = (name: string) => {
        const next = createdProjects.filter((projectName) => projectName !== name)
        setCreatedProjects(next)
        writeStoredProjects(next)
        if (selectedProject === name) {
            setSelectedProject(PROJECT_ALL)
        }
    }

    // 확인창 — 할일까지 함께 삭제.
    const deleteProjectWithTodos = () => {
        const name = deletingProject
        if (!name) {
            return
        }
        for (const todo of todos) {
            if (todo.project === name) {
                void removeTodo(todo.id)
            }
        }
        removeProjectFromList(name)
        setDeletingProject(null)
    }

    // 확인창 — 할일은 남기고(미분류로) 프로젝트만 삭제.
    const deleteProjectKeepTodos = () => {
        const name = deletingProject
        if (!name) {
            return
        }
        for (const todo of todos) {
            if (todo.project === name) {
                void setTodoProject(todo.id, '')
            }
        }
        removeProjectFromList(name)
        setDeletingProject(null)
    }

    const handleAddProject = () => {
        const name = newProject.trim().slice(0, MAX_TODO_PROJECT_LENGTH)
        if (name === '' || projectNames.includes(name)) {
            // 빈 이름/중복이면 입력만 비우고, 이미 있으면 필터만 옮긴다.
            if (name !== '') {
                setSelectedProject(name)
            }
            setNewProject('')
            return
        }
        const next = [...createdProjects, name]
        setCreatedProjects(next)
        writeStoredProjects(next)
        setSelectedProject(name)
        setNewProject('')
    }

    // 할 일 한 줄 렌더.
    const renderTodoItem = (todo: (typeof todos)[number]) => {
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
                <div className='todo-text'>
                    {todo.project && <span className='todo-project-tag'>{todo.project}</span>}
                    {todo.text}
                </div>
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

    const emptyHint =
        view === 'completed'
            ? '아직 완료한 할일이 없어요'
            : view === 'schedule'
              ? '일정에서 추가한 할일이 없어요'
              : '남은 할일이 없어요'

    return (
        <div className='panel'>
            <div className='todo-add-row'>
                <select
                    className='todo-add-project-select'
                    value={addProject}
                    onChange={(event) => setAddProject(event.target.value)}
                    title='추가할 프로젝트'
                >
                    <option value={PROJECT_ALL}>전체</option>
                    {projectNames.map((name) => (
                        <option
                            key={name}
                            value={name}
                        >
                            {name}
                        </option>
                    ))}
                </select>
                <input
                    className='fi'
                    placeholder='할 일 입력 후 Enter'
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
            </div>

            <div className='todo-filters'>
                <button
                    type='button'
                    className={view === 'active' ? 'todo-filter active' : 'todo-filter'}
                    onClick={() => setView('active')}
                >
                    할 일 {activeManual.length}
                </button>
                <button
                    type='button'
                    className={view === 'completed' ? 'todo-filter active' : 'todo-filter'}
                    onClick={() => setView('completed')}
                >
                    지난 할 일 {completedTodos.length}
                </button>
                <button
                    type='button'
                    className={view === 'schedule' ? 'todo-filter active' : 'todo-filter'}
                    onClick={() => setView('schedule')}
                >
                    일정 {activeSchedule.length}
                </button>
            </div>

            {view === 'active' && (
                <div className='todo-projects'>
                    <button
                        type='button'
                        className={
                            selectedProject === PROJECT_ALL
                                ? 'todo-chip todo-chip-fixed active'
                                : 'todo-chip todo-chip-fixed'
                        }
                        onClick={() => setSelectedProject(PROJECT_ALL)}
                    >
                        전체
                    </button>
                    <div className='todo-chip-scroll'>
                        {projectNames.map((name) => (
                            <span
                                key={name}
                                className={
                                    selectedProject === name ? 'todo-chip active' : 'todo-chip'
                                }
                            >
                                <button
                                    type='button'
                                    className='todo-chip-label'
                                    onClick={() => setSelectedProject(name)}
                                >
                                    {name}
                                </button>
                                {editingProjects && (
                                    <button
                                        type='button'
                                        className='todo-chip-x'
                                        onClick={() => setDeletingProject(name)}
                                        title='프로젝트 삭제'
                                    >
                                        ✕
                                    </button>
                                )}
                            </span>
                        ))}
                        {editingProjects && (
                            <input
                                className='todo-chip-add'
                                placeholder='+ 새 프로젝트'
                                maxLength={MAX_TODO_PROJECT_LENGTH}
                                value={newProject}
                                onChange={(event) => setNewProject(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                                        handleAddProject()
                                    }
                                }}
                            />
                        )}
                    </div>
                    <button
                        type='button'
                        className={
                            editingProjects
                                ? 'todo-chip-edit todo-chip-fixed active'
                                : 'todo-chip-edit todo-chip-fixed'
                        }
                        onClick={() => setEditingProjects((value) => !value)}
                    >
                        {editingProjects ? '완료' : '수정'}
                    </button>
                </div>
            )}

            {deletingProject !== null && (
                <div className='project-delete-confirm'>
                    <div className='project-delete-msg'>
                        '{deletingProject}' 프로젝트의 할일은?
                    </div>
                    <div className='project-delete-actions'>
                        <button
                            type='button'
                            className='pbtn'
                            onClick={deleteProjectWithTodos}
                        >
                            함께 삭제
                        </button>
                        <button
                            type='button'
                            className='pbtn ghost'
                            onClick={deleteProjectKeepTodos}
                        >
                            남기기
                        </button>
                        <button
                            type='button'
                            className='pbtn ghost'
                            onClick={() => setDeletingProject(null)}
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}

            {listTodos.length === 0 ? (
                <div className='empty-hint'>{emptyHint}</div>
            ) : (
                <div className='todo-list'>{listTodos.map(renderTodoItem)}</div>
            )}

        </div>
    )
}
