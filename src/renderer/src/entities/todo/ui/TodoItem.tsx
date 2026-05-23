import { memo, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { MAX_TODO_TEXT_LENGTH, type Todo } from '@shared/contracts/todoEvents'

type TodoItemProps = {
    todo: Todo
    onToggle: (id: string) => void
    onRemove: (id: string) => void
    // 빈 문자열을 넘기면 store에서 항목을 삭제한다 (TodoMVC 표준).
    onUpdateText: (id: string, text: string) => void
}

// 완료 시각 표시 포맷: "5/16 14:30" (명세 §8.2).
const formatCompletedAt = (timestamp: number): string => {
    const date = new Date(timestamp)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}/${day} ${hours}:${minutes}`
}

// 단일 할 일 항목.
//
// 표시 형식 (명세 §8.2):
//   진행 중: ⭕ + 할 일 텍스트
//   완료:    ✅ + 취소선 텍스트 + 완료 시각 (예: 5/16 14:30)
//
// 단방향 정책 — toggle만 단방향(false → true). 편집·삭제는 진행·완료 양쪽 모두 가능.
//   ⭕/✅ 토글: 완료 시 disabled (해제 불가)
//   편집:      텍스트 클릭으로 진입 (진행/완료 모두 가능)
//   × 삭제:    진행/완료 모두 가능
//   빈 텍스트로 편집 저장하면 삭제 (TodoMVC 표준).
//
// memo로 감싸 부모(TodoList) 재렌더 시 변경 안 된 항목은 reconcile 건너뜀.
// 변경 없는 todo는 reducer가 동일 reference를 유지하므로 strict-equal OK.
export const TodoItem = memo(({ todo, onToggle, onRemove, onUpdateText }: TodoItemProps) => {
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
            <button
                type='button'
                css={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    fontSize: 16,
                    lineHeight: 1,
                    flexShrink: 0,
                    cursor: todo.completed ? 'default' : 'pointer',
                    '&:disabled': {
                        cursor: 'default',
                    },
                }}
                onClick={handleToggle}
                disabled={todo.completed}
                aria-label={todo.completed ? '완료됨' : '완료 표시'}
            >
                {todo.completed ? '✅' : '⭕'}
            </button>
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
                    maxLength={MAX_TODO_TEXT_LENGTH}
                />
            ) : (
                <>
                    <span
                        css={{
                            flex: 1,
                            fontSize: 14,
                            lineHeight: 1.4,
                            overflowWrap: 'anywhere',
                            userSelect: 'none',
                            cursor: 'text',
                            ...(todo.completed && {
                                textDecoration: 'line-through',
                                color: '#b0b0b0',
                            }),
                        }}
                        onClick={enterEditMode}
                    >
                        {todo.text}
                    </span>
                    {todo.completed && todo.completedAt !== undefined && (
                        <time
                            css={{
                                fontSize: 11,
                                color: '#aaaaaa',
                                flexShrink: 0,
                            }}
                            dateTime={new Date(todo.completedAt).toISOString()}
                        >
                            {formatCompletedAt(todo.completedAt)}
                        </time>
                    )}
                </>
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
})
