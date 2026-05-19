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
        <footer className='todo-footer'>
            <span className='todo-footer-count'>{itemsLeft}개 남음</span>
            <div
                className='todo-filter-group'
                role='radiogroup'
                aria-label='필터'
            >
                {FILTER_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type='button'
                        className='todo-filter-button'
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
                    className='todo-clear-completed'
                    onClick={onClearCompleted}
                >
                    완료 항목 지우기
                </button>
            )}
        </footer>
    )
}
