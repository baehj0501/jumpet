import type { TodoFilter } from '@renderer/entities/todo'
import {
    countLabelStyle,
    filterButtonStyle,
    filterGroupStyle,
    footerStyle,
} from './TodoFooter.styles'

type TodoFooterProps = {
    activeCount: number
    completedCount: number
    filter: TodoFilter
    onFilterChange: (filter: TodoFilter) => void
}

type FilterOption = {
    value: TodoFilter
    label: string
}

const FILTER_OPTIONS: FilterOption[] = [
    { value: 'active', label: '진행중' },
    { value: 'completed', label: '완료' },
]

// 리스트 하단 바: 현재 탭의 카운트 + 진행중/완료 탭 전환.
// 빈 상태에서는 상위 컴포넌트가 footer 자체를 숨기므로 0개 처리는 신경 쓰지 않는다.
export const TodoFooter = ({ activeCount, completedCount, filter, onFilterChange }: TodoFooterProps) => {
    // 진행중 탭: "N개 남음", 완료 탭: "N개 완료". 탭별로 의미 있는 카운트만 보인다.
    const countLabel = filter === 'active' ? `${activeCount}개 남음` : `${completedCount}개 완료`

    return (
        <footer css={footerStyle}>
            <span css={countLabelStyle}>{countLabel}</span>
            <div
                css={filterGroupStyle}
                role='radiogroup'
                aria-label='필터'
            >
                {FILTER_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type='button'
                        css={filterButtonStyle}
                        data-active={filter === option.value}
                        role='radio'
                        aria-checked={filter === option.value}
                        onClick={() => onFilterChange(option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </footer>
    )
}
