import { useEffect, useMemo, useState } from 'react'
import { usePlayerStore } from '@renderer/entities/player'
import { PixelArt } from '../PixelArt'
import { buildStopwatch, STOPWATCH_PALETTE } from '../stopwatch'

// 포모도로 타이머 — 집중/휴식 시간을 설정하고 카운트다운한다.
// 메뉴 창 안에서만 동작하는 ephemeral 상태(창을 닫으면 초기화). 설정값만 localStorage에 보존.
// 추후 main SSOT로 옮기면 창을 닫아도 백그라운드로 이어갈 수 있다.

type Phase = 'focus' | 'break'

const FOCUS_KEY = 'jumpet.timer.focusMin'
const BREAK_KEY = 'jumpet.timer.breakMin'
const DEFAULT_FOCUS_MIN = 25
const DEFAULT_BREAK_MIN = 5
// 집중 1회 완료 시 지급 포인트.
const FOCUS_REWARD = 10

const readMinutes = (key: string, fallback: number): number => {
    try {
        const value = Number(localStorage.getItem(key))
        return Number.isFinite(value) && value > 0 ? Math.min(180, Math.floor(value)) : fallback
    } catch {
        return fallback
    }
}

const formatClock = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const TimerTab = () => {
    const applyPlayer = usePlayerStore((state) => state.apply)

    const [focusMin, setFocusMin] = useState(() => readMinutes(FOCUS_KEY, DEFAULT_FOCUS_MIN))
    const [breakMin, setBreakMin] = useState(() => readMinutes(BREAK_KEY, DEFAULT_BREAK_MIN))
    const [phase, setPhase] = useState<Phase>('focus')
    const [remaining, setRemaining] = useState(focusMin * 60)
    const [running, setRunning] = useState(false)
    // 완료한 집중(뽀모) 횟수.
    const [completedFocus, setCompletedFocus] = useState(0)

    // 1초 카운트다운. 0에 도달하면 0으로 멈추고, 전환은 아래 effect가 처리한다.
    useEffect(() => {
        if (!running) {
            return
        }
        const intervalId = setInterval(() => {
            setRemaining((prev) => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        return () => clearInterval(intervalId)
    }, [running])

    // 남은 시간이 0이 되면 단계 전환 — 집중↔휴식.
    useEffect(() => {
        if (remaining !== 0 || !running) {
            return
        }
        if (phase === 'focus') {
            setCompletedFocus((count) => count + 1)
            void applyPlayer({ type: 'manual', delta: FOCUS_REWARD })
            window.api.character.say(`집중 완료! +${FOCUS_REWARD}pt 🍅`)
            setPhase('break')
            setRemaining(breakMin * 60)
        } else {
            window.api.character.say('휴식 끝! 다시 집중해볼까? 💪')
            setPhase('focus')
            setRemaining(focusMin * 60)
        }
    }, [remaining, running, phase, focusMin, breakMin, applyPlayer])

    const toggleRunning = () => setRunning((value) => !value)

    const resetTimer = () => {
        setRunning(false)
        setRemaining(phase === 'focus' ? focusMin * 60 : breakMin * 60)
    }

    // 단계 수동 전환(건너뛰기) — 보상/멘트 없이 다음 단계로.
    const skipPhase = () => {
        if (phase === 'focus') {
            setPhase('break')
            setRemaining(breakMin * 60)
        } else {
            setPhase('focus')
            setRemaining(focusMin * 60)
        }
    }

    const updateFocusMin = (value: number) => {
        const next = Math.max(1, Math.min(180, Math.floor(value) || 1))
        setFocusMin(next)
        try {
            localStorage.setItem(FOCUS_KEY, String(next))
        } catch {
            // 무시.
        }
        if (!running && phase === 'focus') {
            setRemaining(next * 60)
        }
    }

    const updateBreakMin = (value: number) => {
        const next = Math.max(1, Math.min(180, Math.floor(value) || 1))
        setBreakMin(next)
        try {
            localStorage.setItem(BREAK_KEY, String(next))
        } catch {
            // 무시.
        }
        if (!running && phase === 'break') {
            setRemaining(next * 60)
        }
    }

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

            <div className='timer-tomatoes'>{'🍅'.repeat(completedFocus) || ' '}</div>

            <div className='timer-controls'>
                <button
                    type='button'
                    className='pbtn'
                    onClick={toggleRunning}
                >
                    {running ? '일시정지' : '시작'}
                </button>
                <button
                    type='button'
                    className='pbtn ghost'
                    onClick={resetTimer}
                >
                    리셋
                </button>
                <button
                    type='button'
                    className='pbtn ghost'
                    onClick={skipPhase}
                >
                    건너뛰기
                </button>
            </div>

            <div className='divider' />

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
                        onChange={(event) => updateFocusMin(Number(event.target.value))}
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
                        onChange={(event) => updateBreakMin(Number(event.target.value))}
                    />
                    <span>분</span>
                </label>
            </div>
        </div>
    )
}
