import { useMemo, useState } from 'react'
import {
    MAX_SCHEDULE_TITLE_LENGTH,
    MAX_SCHEDULE_MEMO_LENGTH,
    useScheduleItems,
    useScheduleActions,
} from '@renderer/entities/schedule'
import { useTodoActions } from '@renderer/entities/todo'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const pad = (n: number): string => String(n).padStart(2, '0')

// 'YYYY-MM-DD' 로컬 날짜 키. main/schedule의 알림 비교 포맷과 동일해야 한다.
const toDateKey = (year: number, monthIndex: number, day: number): string =>
    `${year}-${pad(monthIndex + 1)}-${pad(day)}`

// 'YYYY-MM-DD' → 'M/D' 짧은 표기.
const formatShortDate = (key: string): string => {
    const [, month, day] = key.split('-').map(Number)
    return `${month}/${day}`
}

// [startKey, endKey] 사이의 모든 날짜 키(양끝 포함). 기간 일정의 달력 점 표시에 사용.
const eachDateInRange = (startKey: string, endKey: string): string[] => {
    const [sy, sm, sd] = startKey.split('-').map(Number)
    const [ey, em, ed] = endKey.split('-').map(Number)
    const cursor = new Date(sy, sm - 1, sd)
    const end = new Date(ey, em - 1, ed)
    const keys: string[] = []
    // 안전장치 — 비정상 범위로 무한 루프 방지(최대 약 2년).
    let guard = 0
    while (cursor <= end && guard < 800) {
        keys.push(toDateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()))
        cursor.setDate(cursor.getDate() + 1)
        guard += 1
    }
    return keys
}

export const ScheduleTab = () => {
    const items = useScheduleItems()
    const { add, remove, update } = useScheduleActions()
    const { addTodo, removeTodo } = useTodoActions()

    // 일정 수정 — 항목 더블클릭하면 ✎ 버튼이 뜨고, 누르면 제목 인라인 편집.
    const [revealEditId, setRevealEditId] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const startEditItem = (id: string, currentTitle: string) => {
        setEditingId(id)
        setEditTitle(currentTitle)
        setRevealEditId(null)
    }
    const commitEditItem = (id: string, memo: string) => {
        const trimmed = editTitle.trim()
        if (trimmed !== '') {
            void update(id, trimmed, memo)
        }
        setEditingId(null)
    }

    // 오늘 — 렌더 시점 1회 고정(탭이 떠 있는 동안 날짜 경계를 넘는 일은 드묾).
    const today = useMemo(() => new Date(), [])
    const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate())

    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth())
    const [selectedDate, setSelectedDate] = useState(todayKey)

    const [time, setTime] = useState('09:00')
    const [endTime, setEndTime] = useState('10:00')
    const [title, setTitle] = useState('')
    const [memo, setMemo] = useState('')
    // 추가 폼의 시작일/종료일. 날짜를 더블클릭해 열 때 그 날짜로 채워진다.
    const [startDate, setStartDate] = useState(todayKey)
    const [endDate, setEndDate] = useState(todayKey)
    // 체크 시에만 같은 내용을 '할 일' 탭에도 등록한다. 기본 on.
    const [addToTodo, setAddToTodo] = useState(true)
    // 추가 폼 열림 여부 — 캘린더 날짜를 더블클릭하면 토글된다.
    const [isAddOpen, setIsAddOpen] = useState(false)

    // 날짜 더블클릭 — 같은 날을 다시 더블클릭하면 닫고, 다른 날이면 그 날로 열기.
    const handleDayDoubleClick = (dateKey: string) => {
        setSelectedDate(dateKey)
        setIsAddOpen((prev) => {
            const willOpen = selectedDate === dateKey ? !prev : true
            if (willOpen) {
                // 폼을 열 때 시작/종료일을 더블클릭한 날짜로 초기화.
                setStartDate(dateKey)
                setEndDate(dateKey)
            }
            return willOpen
        })
    }

    // 드롭다운 연도 범위 — 오늘 기준 ±5년.
    const yearOptions = useMemo(() => {
        const base = today.getFullYear()
        const years: number[] = []
        for (let year = base - 5; year <= base + 5; year += 1) {
            years.push(year)
        }
        return years
    }, [today])

    // 날짜별 일정 개수 — 달력 점 표시에 사용. 기간 일정은 시작~종료 모든 날에 카운트.
    const eventCountByDate = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const item of items) {
            for (const key of eachDateInRange(item.date, item.endDate)) {
                counts[key] = (counts[key] ?? 0) + 1
            }
        }
        return counts
    }, [items])

    // 선택한 날짜에 걸치는 일정 — 시각 오름차순. (시작 ≤ 선택일 ≤ 종료)
    const selectedDayItems = useMemo(
        () =>
            items
                .filter((item) => item.date <= selectedDate && selectedDate <= item.endDate)
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

    const handleAdd = async () => {
        const trimmed = title.trim()
        if (trimmed === '' || startDate === '') {
            return
        }
        // 종료일이 시작보다 빠르면 시작일로 맞춘다(단일 일정).
        const normalizedEnd = endDate && endDate >= startDate ? endDate : startDate
        // 체크된 경우 '할 일' 탭에도 등록(날짜 + 시각 + 제목)하고, 그 todo id를 일정에 연결한다.
        // → 나중에 일정을 삭제하면 연결된 todo도 함께 삭제된다.
        let linkedTodoId: string | undefined
        if (addToTodo) {
            linkedTodoId = await addTodo(`${formatShortDate(startDate)} ${time} ${trimmed}`, 'schedule')
        }
        await add(startDate, normalizedEnd, time, endTime, trimmed, memo.trim(), linkedTodoId)
        setTitle('')
        setMemo('')
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
                {(() => {
                    const dayCells = cells.map((day, index) => {
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
                                onDoubleClick={() => handleDayDoubleClick(dateKey)}
                            >
                                <span className='cal-day-num'>{day}</span>
                                {eventCountByDate[dateKey] ? (
                                    <span className='cal-dots'>
                                        {Array.from({
                                            length: Math.min(eventCountByDate[dateKey], 3),
                                        }).map((_, dotIndex) => (
                                            <span
                                                key={dotIndex}
                                                className='cal-dot'
                                            />
                                        ))}
                                    </span>
                                ) : null}
                            </button>
                        )
                    })

                    // 더블클릭으로 열렸으면, 선택한 날짜가 속한 '주(週)' 바로 아래에 폼을 full-width로 끼운다.
                    if (isAddOpen) {
                        const selectedCellIndex = cells.findIndex(
                            (day) =>
                                day !== null &&
                                toDateKey(viewYear, viewMonth, day) === selectedDate,
                        )
                        if (selectedCellIndex >= 0) {
                            const weekEndIndex = Math.min(
                                cells.length - 1,
                                Math.floor(selectedCellIndex / 7) * 7 + 6,
                            )
                            dayCells.splice(
                                weekEndIndex + 1,
                                0,
                                <div
                                    className='cal-inline-add'
                                    key='inline-add'
                                >
                                    <div className='sched-datetime-row'>
                                        <span className='sched-dt-label'>시작</span>
                                        <input
                                            className='fi sched-dt'
                                            type='date'
                                            value={startDate}
                                            onChange={(event) => {
                                                const next = event.target.value
                                                setStartDate(next)
                                                // 시작일이 종료일보다 뒤면 종료일도 따라간다.
                                                if (next > endDate) {
                                                    setEndDate(next)
                                                }
                                            }}
                                        />
                                        <input
                                            className='fi sched-dt'
                                            type='time'
                                            value={time}
                                            onChange={(event) => setTime(event.target.value)}
                                        />
                                    </div>
                                    <div className='sched-datetime-row'>
                                        <span className='sched-dt-label'>종료</span>
                                        <input
                                            className='fi sched-dt'
                                            type='date'
                                            min={startDate}
                                            value={endDate}
                                            onChange={(event) => setEndDate(event.target.value)}
                                        />
                                        <input
                                            className='fi sched-dt'
                                            type='time'
                                            value={endTime}
                                            onChange={(event) => setEndTime(event.target.value)}
                                        />
                                    </div>
                                    <input
                                        className='fi sched-title-input'
                                        placeholder='일정 입력...'
                                        autoFocus
                                        maxLength={MAX_SCHEDULE_TITLE_LENGTH}
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === 'Enter' &&
                                                !event.nativeEvent.isComposing
                                            ) {
                                                handleAdd()
                                            }
                                        }}
                                    />
                                    <textarea
                                        className='fi sched-memo-input'
                                        placeholder='메모 (100자 이내)'
                                        rows={2}
                                        maxLength={MAX_SCHEDULE_MEMO_LENGTH}
                                        value={memo}
                                        onChange={(event) => setMemo(event.target.value)}
                                    />
                                    <div className='sched-add-actions'>
                                        <label className='sched-todo-check'>
                                            <input
                                                type='checkbox'
                                                checked={addToTodo}
                                                onChange={(event) =>
                                                    setAddToTodo(event.target.checked)
                                                }
                                            />
                                            할 일에도 추가
                                        </label>
                                        <button
                                            type='button'
                                            className='add-btn'
                                            onClick={handleAdd}
                                        >
                                            추가
                                        </button>
                                    </div>
                                </div>,
                            )
                        }
                    }

                    return dayCells
                })()}
            </div>

            <div className='section-title-1'>{selectedLabel}</div>

            {!isAddOpen && (
                <div className='sched-hint'>날짜를 더블클릭하면 일정을 추가할 수 있어요</div>
            )}

            {selectedDayItems.length === 0 ? (
                <div className='sched-empty'>이 날의 일정이 없어요</div>
            ) : (
                <div className='sched-list'>
                    {selectedDayItems.map((item) => (
                        <div
                            key={item.id}
                            className='sched-item'
                            onDoubleClick={() => {
                                if (editingId !== item.id) {
                                    setRevealEditId(item.id)
                                }
                            }}
                        >
                            <span className='sched-time-badge'>{item.time}</span>
                            {(item.date !== item.endDate || item.endTime !== item.time) && (
                                <span className='sched-range'>
                                    ~
                                    {item.date !== item.endDate
                                        ? `${formatShortDate(item.endDate)} `
                                        : ''}
                                    {item.endTime}
                                </span>
                            )}
                            <span className='sched-text'>
                                {editingId === item.id ? (
                                    <input
                                        className='fi item-edit-input'
                                        autoFocus
                                        maxLength={MAX_SCHEDULE_TITLE_LENGTH}
                                        value={editTitle}
                                        onChange={(event) => setEditTitle(event.target.value)}
                                        onBlur={() => commitEditItem(item.id, item.memo)}
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === 'Enter' &&
                                                !event.nativeEvent.isComposing
                                            ) {
                                                commitEditItem(item.id, item.memo)
                                            } else if (event.key === 'Escape') {
                                                setEditingId(null)
                                            }
                                        }}
                                    />
                                ) : (
                                    <>
                                        <span className='sched-title'>{item.title}</span>
                                        {item.memo && (
                                            <span className='sched-memo'>{item.memo}</span>
                                        )}
                                    </>
                                )}
                            </span>
                            {revealEditId === item.id && editingId !== item.id && (
                                <button
                                    type='button'
                                    className='item-edit-btn'
                                    title='수정'
                                    onClick={() => startEditItem(item.id, item.title)}
                                >
                                    ✎
                                </button>
                            )}
                            <button
                                type='button'
                                className='todo-del'
                                onClick={() => {
                                    // 일정 삭제 시 연결된 할일도 함께 삭제.
                                    if (item.todoId) {
                                        void removeTodo(item.todoId)
                                    }
                                    void remove(item.id)
                                }}
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
