import type { TodoFilter } from '@renderer/entities/todo'

type TodoFooterProps = {
    itemsLeft: number
    filter: TodoFilter
    onFilterChange: (filter: TodoFilter) => void
    hasCompleted: boolean
    onClearCompleted: () => void
}

type FilterOption = {
    value: TodoFilter
    label: string
}

const FILTER_OPTIONS: FilterOption[] = [
    { value: 'all', label: '전체' },
    { value: 'active', label: '진행중' },
    { value: 'completed', label: '완료' },
]

// 리스트 하단 바: 남은 개수, 필터 전환, 완료 일괄삭제.
// 빈 상태에서는 상위 컴포넌트가 footer 자체를 숨기므로 itemsLeft=0 처리는 신경 쓰지 않는다.
export const TodoFooter = ({ itemsLeft, filter, onFilterChange, hasCompleted, onClearCompleted }: TodoFooterProps) => {
    return (
        <footer
            css={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderTop: '1px solid #eeeeee',
                fontSize: 12,
                color: '#666666',
            }}
        >
            <span css={{ flexShrink: 0 }}>{itemsLeft}개 남음</span>
            <div
                css={{
                    display: 'flex',
                    gap: 4,
                    flex: 1,
                    justifyContent: 'center',
                }}
                role='radiogroup'
                aria-label='필터'
            >
                {FILTER_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type='button'
                        css={{
                            background: 'transparent',
                            border: '1px solid transparent',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: 'pointer',
                            color: 'inherit',
                            '&:hover': {
                                borderColor: '#dcdcdc',
                            },
                            '&[data-active="true"]': {
                                borderColor: '#4a90e2',
                                color: '#4a90e2',
                            },
                        }}
                        data-active={filter === option.value}
                        role='radio'
                        aria-checked={filter === option.value}
                        onClick={() => onFilterChange(option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            {hasCompleted && (
                <button
                    type='button'
                    css={{
                        background: 'transparent',
                        border: 'none',
                        padding: '3px 4px',
                        cursor: 'pointer',
                        color: 'inherit',
                        fontSize: 12,
                        textDecoration: 'underline',
                        textUnderlineOffset: 2,
                        '&:hover': {
                            color: '#e25b5b',
                        },
                    }}
                    onClick={onClearCompleted}
                >
                    완료 항목 지우기
                </button>
            )}
        </footer>
    )
}
