import { useEffect, useMemo, useState } from 'react'
import { useFortuneActions, useTodayFortune } from '@renderer/entities/fortune'
import { PixelArt } from '../PixelArt'
import { buildCrystal, CRYSTAL_PALETTE } from '../crystalBall'

// 반짝이 픽셀 프레임 — 프레임을 번갈아 보여줘 '형태가 변하며' 반짝이게 한다.
const SPARK_FRAMES: string[][] = [
    ['..#..', '..#..', '#####', '..#..', '..#..'], // 플러스(4방)
    ['.....', '..#..', '.###.', '..#..', '.....'], // 작은 다이아몬드
    ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'], // X
    ['..#..', '.###.', '#####', '.###.', '..#..'], // 큰 다이아몬드
    ['.....', '.....', '..#..', '.....', '.....'], // 점(가장 작음)
]
const sparkPalette = (color: string): Record<string, string> => ({ '#': color })

// 구슬 중심 기준 px 오프셋 — 사방으로 30px 이상 퍼지게 배치.
const SPARKLES: { x: number; y: number; color: string; cell: number }[] = [
    { x: 0, y: -96, color: '#f5a8d2', cell: 4 },
    { x: 78, y: -64, color: '#a6d6f2', cell: 3 },
    { x: 100, y: 4, color: '#f5a8d2', cell: 4 },
    { x: 80, y: 70, color: '#a6d6f2', cell: 3 },
    { x: 4, y: 100, color: '#f5a8d2', cell: 3 },
    { x: -80, y: 70, color: '#a6d6f2', cell: 4 },
    { x: -100, y: 0, color: '#f5a8d2', cell: 3 },
    { x: -78, y: -64, color: '#a6d6f2', cell: 4 },
]

export const FortuneTab = () => {
    const today = useTodayFortune()
    const { roll } = useFortuneActions()
    const [phase, setPhase] = useState(0)
    const [sparkFrame, setSparkFrame] = useState(0)

    // 탭을 열면 오늘 운세를 보장한다(없으면 추첨). 날짜당 멱등 — 중복 보상 없음.
    useEffect(() => {
        void roll()
    }, [roll])

    // 수정구슬 그라데이션 물결을 계속 흐르게 한다.
    useEffect(() => {
        const intervalId = setInterval(() => setPhase((p) => p + 0.4), 140)
        return () => clearInterval(intervalId)
    }, [])

    // 반짝이 형태를 천천히 바꾼다(프레임 순환).
    useEffect(() => {
        const intervalId = setInterval(() => setSparkFrame((f) => f + 1), 280)
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
                    {SPARKLES.map((spark, index) => (
                        <span
                            key={index}
                            className='fortune-spark'
                            style={{
                                left: `calc(50% + ${spark.x}px)`,
                                top: `calc(50% + ${spark.y}px)`,
                                animationDelay: `${index * 0.22}s`,
                            }}
                        >
                            <PixelArt
                                pixels={SPARK_FRAMES[(sparkFrame + index) % SPARK_FRAMES.length]}
                                palette={sparkPalette(spark.color)}
                                cell={spark.cell}
                            />
                        </span>
                    ))}
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
