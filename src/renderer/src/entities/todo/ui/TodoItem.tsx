import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import type { Todo } from '../model/Todo'

type TodoItemProps = {
    todo: Todo
    onToggle: (id: string) => void
    onRemove: (id: string) => void
    // 빈 문자열을 넘기면 store에서 항목을 삭제한다 (TodoMVC 표준).
    onUpdateText: (id: string, text: string) => void
}

// 단일 할 일 항목. 더블클릭으로 인라인 편집 모드 진입.
// Enter/blur=저장, Esc=원복, 빈 문자열로 저장=삭제.
export const TodoItem = ({ todo, onToggle, onRemove, onUpdateText }: TodoItemProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [draft, setDraft] = useState(todo.text)
    const editInputRef = useRef<HTMLInputElement>(null)
    // Esc 시 onBlur가 저장으로 동작하는 걸 막기 위한 가드.
    const isCancellingRef = useRef(false)

    useEffect(() => {
        if (!isEditing) {
            return
        }
        const input = editInputRef.current
        if (input === null) {
            return
        }
        input.focus()
        // 캐럿을 끝으로 이동해서 곧바로 추가 입력할 수 있게 한다.
        const length = input.value.length
        input.setSelectionRange(length, length)
    }, [isEditing])

    const handleToggle = () => {
        onToggle(todo.id)
    }

    const handleRemove = () => {
        onRemove(todo.id)
    }

    const enterEditMode = () => {
        setDraft(todo.text)
        setIsEditing(true)
    }

    const commitEdit = () => {
        setIsEditing(false)
        onUpdateText(todo.id, draft)
    }

    const cancelEdit = () => {
        isCancellingRef.current = true
        setDraft(todo.text)
        setIsEditing(false)
    }

    const handleDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
        setDraft(event.target.value)
    }

    const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            commitEdit()
            return
        }
        if (event.key === 'Escape') {
            event.preventDefault()
            cancelEdit()
        }
    }

    const handleEditBlur = () => {
        if (isCancellingRef.current) {
            isCancellingRef.current = false
            return
        }
        commitEdit()
    }

    return (
        <li
            css={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px',
                borderRadius: 6,
                cursor: 'default',
                '&:hover': {
                    background: '#f3f6fb',
                },
            }}
            data-completed={todo.completed}
        >
            <input
                css={{
                    width: 16,
                    height: 16,
                    cursor: 'pointer',
                    flexShrink: 0,
                }}
                type='checkbox'
                checked={todo.completed}
                onChange={handleToggle}
                aria-label={todo.completed ? '완료 해제' : '완료 표시'}
            />
            {isEditing ? (
                <input
                    ref={editInputRef}
                    css={{
                        flex: 1,
                        padding: '4px 6px',
                        fontSize: 14,
                        border: '1px solid #4a90e2',
                        borderRadius: 4,
                        outline: 'none',
                        background: '#ffffff',
                        color: 'inherit',
                        fontFamily: 'inherit',
                    }}
                    value={draft}
                    onChange={handleDraftChange}
                    onKeyDown={handleEditKeyDown}
                    onBlur={handleEditBlur}
                    aria-label='할 일 텍스트 편집'
                />
            ) : (
                <span
                    css={{
                        flex: 1,
                        fontSize: 14,
                        lineHeight: 1.4,
                        overflowWrap: 'anywhere',
                        userSelect: 'none',
                        ...(todo.completed && {
                            textDecoration: 'line-through',
                            color: '#b0b0b0',
                        }),
                    }}
                    onDoubleClick={enterEditMode}
                >
                    {todo.text}
                </span>
            )}
            <button
                type='button'
                css={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    color: '#cccccc',
                    fontSize: 16,
                    lineHeight: 1,
                    borderRadius: 4,
                    opacity: 0,
                    transition: 'opacity 0.12s ease',
                    // 부모 li가 hover일 때만 노출. 자식이 자기 발현 조건을 지님으로써 응집도 유지.
                    'li:hover > &': {
                        opacity: 1,
                    },
                    '&:hover': {
                        color: '#e25b5b',
                        background: '#ffefef',
                    },
                }}
                onClick={handleRemove}
                aria-label='삭제'
            >
                ×
            </button>
        </li>
    )
}
