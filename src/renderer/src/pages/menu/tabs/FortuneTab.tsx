import { useEffect, useMemo, useState } from 'react'
import { useFortuneActions, useTodayFortune } from '@renderer/entities/fortune'
import { PixelArt } from '../PixelArt'
import { buildCrystal, CRYSTAL_PALETTE } from '../crystalBall'

export const FortuneTab = () => {
    const today = useTodayFortune()
    const { roll } = useFortuneActions()
    const [phase, setPhase] = useState(0)

    // 탭을 열면 오늘 운세를 보장한다(없으면 추첨). 날짜당 멱등 — 중복 보상 없음.
    useEffect(() => {
        void roll()
    }, [roll])

    // 수정구슬 그라데이션 물결을 계속 흐르게 한다.
    useEffect(() => {
        const intervalId = setInterval(() => setPhase((p) => p + 0.4), 140)
        return () => clearInterval(intervalId)
    }, [])

    const crystal = useMemo(() => buildCrystal(phase), [phase])

    return (
        <div className='panel'>
            <div className='fortune-card'>
                <div className='section-title'>🌸 오늘의 운세</div>
                <div className='fortune-orb'>
                    <PixelArt
                        pixels={crystal}
                        palette={CRYSTAL_PALETTE}
                        cell={4}
                    />
                    {today && <span className='fortune-orb-score'>{today.scoreAwarded}점</span>}
                </div>
                {today ? (
                    <>
                        <p className='fortune-text'>{today.text}</p>
                        <div className='fortune-stars'>{'★'.repeat(today.level)}</div>
                    </>
                ) : (
                    <p className='hint'>운세를 보는 중…</p>
                )}
            </div>
        </div>
    )
}
