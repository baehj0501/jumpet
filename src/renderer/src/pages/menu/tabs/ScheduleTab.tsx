import { useMemo, useState } from 'react'
import {
    MAX_SCHEDULE_TITLE_LENGTH,
    useScheduleItems,
    useScheduleActions,
} from '@renderer/entities/schedule'
import { useTodoActions } from '@renderer/entities/todo'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const pad = (n: number): string => String(n).padStart(2, '0')

// 'YYYY-MM-DD' 로컬 날짜 키. main/schedule의 알림 비교 포맷과 동일해야 한다.
const toDateKey = (year: number, monthIndex: number, day: number): string =>
    `${year}-${pad(monthIndex + 1)}-${pad(day)}`

export const ScheduleTab = () => {
    const items = useScheduleItems()
    const { add, remove } = useScheduleActions()
    const { addTodo } = useTodoActions()

    // 오늘 — 렌더 시점 1회 고정(탭이 떠 있는 동안 날짜 경계를 넘는 일은 드묾).
    const today = useMemo(() => new Date(), [])
    const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate())

    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth())
    const [selectedDate, setSelectedDate] = useState(todayKey)

    const [time, setTime] = useState('09:00')
    const [title, setTitle] = useState('')

    // 드롭다운 연도 범위 — 오늘 기준 ±5년.
    const yearOptions = useMemo(() => {
        const base = today.getFullYear()
        const years: number[] = []
        for (let year = base - 5; year <= base + 5; year += 1) {
            years.push(year)
        }
        return years
    }, [today])

    // 날짜별 일정 개수 — 달력 점 표시에 사용.
    const eventCountByDate = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const item of items) {
            counts[item.date] = (counts[item.date] ?? 0) + 1
        }
        return counts
    }, [items])

    // 선택한 날짜의 일정 — 시각 오름차순.
    const selectedDayItems = useMemo(
        () =>
            items
                .filter((item) => item.date === selectedDate)
                .sort((a, b) => a.time.localeCompare(b.time)),
        [items, selectedDate],
    )

    // 달력 셀 — 선행 공백 + 1..말일.
    const cells = useMemo(() => {
        const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
        const result: (number | null)[] = []
        for (let i = 0; i < firstWeekday; i += 1) {
            result.push(null)
        }
        for (let day = 1; day <= daysInMonth; day += 1) {
            result.push(day)
        }
        return result
    }, [viewYear, viewMonth])

    const goToPreviousMonth = () => {
        if (viewMonth === 0) {
            setViewYear((year) => year - 1)
            setViewMonth(11)
        } else {
            setViewMonth((month) => month - 1)
        }
    }

    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewYear((year) => year + 1)
            setViewMonth(0)
        } else {
            setViewMonth((month) => month + 1)
        }
    }

    const handleAdd = () => {
        const trimmed = title.trim()
        if (trimmed === '') {
            return
        }
        void add(selectedDate, time, trimmed)
        // 추가한 일정을 '할 일' 탭에도 등록한다(시각 + 제목). source로 '일정' 섹션에 묶인다.
        void addTodo(`${time} ${trimmed}`, 'schedule')
        setTitle('')
    }

    // 선택 날짜 헤딩용 'M월 D일 (요일)'.
    const selectedLabel = useMemo(() => {
        const [year, month, day] = selectedDate.split('-').map(Number)
        const weekday = WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()]
        return `${month}월 ${day}일 (${weekday})`
    }, [selectedDate])

    return (
        <div className='panel'>
            <div className='cal-head'>
                <button
                    type='button'
                    className='cal-nav'
                    onClick={goToPreviousMonth}
                >
                    ‹
                </button>
                <div className='cal-selects'>
                    <select
                        className='cal-select'
                        value={viewYear}
                        onChange={(event) => setViewYear(Number(event.target.value))}
                    >
                        {yearOptions.map((year) => (
                            <option
                                key={year}
                                value={year}
                            >
                                {year}년
                            </option>
                        ))}
                    </select>
                    <select
                        className='cal-select'
                        value={viewMonth}
                        onChange={(event) => setViewMonth(Number(event.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, index) => (
                            <option
                                key={index}
                                value={index}
                            >
                                {index + 1}월
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type='button'
                    className='cal-nav'
                    onClick={goToNextMonth}
                >
                    ›
                </button>
            </div>

            <div className='cal-weekdays'>
                {WEEKDAY_LABELS.map((label, index) => (
                    <div
                        key={label}
                        className={
                            index === 0
                                ? 'cal-weekday sun'
                                : index === 6
                                  ? 'cal-weekday sat'
                                  : 'cal-weekday'
                        }
                    >
                        {label}
                    </div>
                ))}
            </div>

            <div className='cal-grid'>
                {cells.map((day, index) => {
                    if (day === null) {
                        return (
                            <div
                                key={`blank-${index}`}
                                className='cal-cell blank'
                            />
                        )
                    }
                    const dateKey = toDateKey(viewYear, viewMonth, day)
                    const classes = ['cal-cell']
                    if (dateKey === selectedDate) {
                        classes.push('selected')
                    }
                    if (dateKey === todayKey) {
                        classes.push('today')
                    }
                    return (
                        <button
                            type='button'
                            key={dateKey}
                            className={classes.join(' ')}
                            onClick={() => setSelectedDate(dateKey)}
                        >
                            <span className='cal-day-num'>{day}</span>
                            {eventCountByDate[dateKey] ? <span className='cal-dot' /> : null}
                        </button>
                    )
                })}
            </div>

            <div className='section-title-1'>{selectedLabel}</div>

            <div className='sched-add-row'>
                <input
                    className='fi sched-time'
                    type='time'
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                />
                <input
                    className='fi'
                    placeholder='일정 입력...'
                    maxLength={MAX_SCHEDULE_TITLE_LENGTH}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    onKeyDown={(event) => {
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

            {selectedDayItems.length === 0 ? (
                <div className='sched-empty'>이 날의 일정이 없어요</div>
            ) : (
                <div className='sched-list'>
                    {selectedDayItems.map((item) => (
                        <div
                            key={item.id}
                            className='sched-item'
                        >
                            <span className='sched-time-badge'>{item.time}</span>
                            <span className='sched-title'>{item.title}</span>
                            <button
                                type='button'
                                className='todo-del'
                                onClick={() => void remove(item.id)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
