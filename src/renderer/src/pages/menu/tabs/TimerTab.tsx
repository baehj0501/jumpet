import { useMemo } from 'react'
import { PixelArt } from '../PixelArt'
import { buildStopwatch, STOPWATCH_PALETTE } from '../stopwatch'
import { useTimerStore } from '../timerStore'

// 포모도로 타이머 탭 — 상태/로직은 공유 store(timerStore)에 있고, 여기선 표시·조작만.
// tick 엔진은 MenuPage가 돌리므로 탭을 벗어나도 타이머가 계속 간다.

const formatClock = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const TimerTab = () => {
    const phase = useTimerStore((state) => state.phase)
    const remaining = useTimerStore((state) => state.remaining)
    const running = useTimerStore((state) => state.running)
    const focusMin = useTimerStore((state) => state.focusMin)
    const breakMin = useTimerStore((state) => state.breakMin)
    const completedFocus = useTimerStore((state) => state.completedFocus)
    const toggle = useTimerStore((state) => state.toggle)
    const reset = useTimerStore((state) => state.reset)
    const skip = useTimerStore((state) => state.skip)
    const setFocusMin = useTimerStore((state) => state.setFocusMin)
    const setBreakMin = useTimerStore((state) => state.setBreakMin)

    // 바늘 없는 스톱워치(정적) — 면 가운데에 카운트다운 숫자를 올린다.
    const stopwatch = useMemo(() => buildStopwatch(null), [])

    return (
        <div className='panel timer-panel'>
            <div className={phase === 'focus' ? 'timer-phase focus' : 'timer-phase break'}>
                {phase === 'focus' ? '포모도로 타이머' : '☕ 휴식'}
            </div>

            <div className='timer-stopwatch'>
                <PixelArt
                    pixels={stopwatch}
                    palette={STOPWATCH_PALETTE}
                    cell={4}
                />
                <span className='timer-stopwatch-time'>{formatClock(remaining)}</span>
            </div>

            <div className='timer-tomatoes'>{'🍅'.repeat(completedFocus) || ' '}</div>

            <div className='timer-controls'>
                <button
                    type='button'
                    className='pbtn'
                    onClick={toggle}
                >
                    {running ? '일시정지' : '시작'}
                </button>
                <button
                    type='button'
                    className='pbtn ghost'
                    onClick={reset}
                >
                    리셋
                </button>
                <button
                    type='button'
                    className='pbtn ghost'
                    onClick={skip}
                >
                    건너뛰기
                </button>
            </div>

            <div className='section-title-1'>설정</div>
            <div className='timer-settings'>
                <label className='timer-setting'>
                    <span>집중</span>
                    <input
                        className='fi'
                        type='number'
                        min={1}
                        max={180}
                        value={focusMin}
                        onChange={(event) => setFocusMin(Number(event.target.value))}
                    />
                    <span>분</span>
                </label>
                <label className='timer-setting'>
                    <span>휴식</span>
                    <input
                        className='fi'
                        type='number'
                        min={1}
                        max={180}
                        value={breakMin}
                        onChange={(event) => setBreakMin(Number(event.target.value))}
                    />
                    <span>분</span>
                </label>
            </div>
        </div>
    )
}
