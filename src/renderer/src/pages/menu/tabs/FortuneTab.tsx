import { useEffect } from 'react'
import { useFortuneActions, useTodayFortune } from '@renderer/entities/fortune'

export const FortuneTab = () => {
    const today = useTodayFortune()
    const { roll } = useFortuneActions()

    // 탭을 열면 오늘 운세를 보장한다(없으면 추첨). 날짜당 멱등 — 중복 보상 없음.
    useEffect(() => {
        void roll()
    }, [roll])

    return (
        <div className='panel'>
            <div className='fortune-card'>
                <div className='section-title'>🌸 오늘의 운세</div>
                {today ? (
                    <>
                        <div className='fortune-level'>{today.scoreAwarded}점</div>
                        <p className='fortune-text'>{today.text}</p>
                    </>
                ) : (
                    <p className='hint'>운세를 보는 중…</p>
                )}
            </div>
        </div>
    )
}
