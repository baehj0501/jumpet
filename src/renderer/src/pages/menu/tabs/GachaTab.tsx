import { useState } from 'react'
import { usePlayerStore } from '@renderer/entities/player'
import { CONSUMABLE_ITEMS, GACHA_COST, useItemActions } from '@renderer/entities/item'
import { PixelArt } from '../PixelArt'

// 검볼(가챠) 머신 — 정면/수평. 유리돔은 비워두고 알사탕은 오버레이로 그려 섞이는 모션을 준다.
// o=외곽선 g=유리 G=유리하이라이트 d=유리음영 P=몸체 H=몸체하이라이트 D=몸체음영 b=손잡이 k=배출구
const MACHINE: string[] = [
    '...........ooooooooo..........',
    '..........oHHHPPPDDDo.........',
    '.............oooo.............',
    '..........oooGGGGooo..........',
    '.........ooGGGGGGggoo.........',
    '........oGGGGGGGgggggo........',
    '.......oGGGGGGGgggggggo.......',
    '......ooGGGGGGggggggggoo......',
    '......oGGGGGGggggggggggo......',
    '......oGGGGGgggggggggggo......',
    '.....oGGGGGggggggggggggdo.....',
    '.....oGGGGggggggggggggddo.....',
    '.....oGGGggggggggggggdddo.....',
    '.....oGGggggggggggggddddo.....',
    '......oggggggggggggddddo......',
    '......ogggggggggggdddddo......',
    '......oogggggggggdddddoo......',
    '.......oggggggggddddddo.......',
    '........oggggggddddddo........',
    '.........oogggdddddoo.........',
    '..........oooddddooo..........',
    '...........oHPPPPPDo..........',
    '.........oHPPPPPPPPPDo........',
    '.........oHPPPPPPPPPDo........',
    '.........oHPPbbbbbPPDo........',
    '.........oHPPPGGGPPPDo........',
    '.........oHPPPPPPPPPDo........',
    '.........oHPPPPPPPPPDo........',
    '.......oHPPPPkkkkkPPPPDo......',
    '.......oHPPPPkkkkkPPPPDo......',
    '.......oHPPPPkkkkkPPPPDo......',
    '.......oHPPPPkkkkkPPPPDo......',
    '.......ooooookkkkkoooooo......',
]
const MACHINE_PALETTE: Record<string, string> = {
    o: '#2f6aa8',
    g: '#cdebf8',
    G: '#e8f8ff',
    d: '#a9d4ec',
    P: '#7ab8ec',
    H: '#b3dbf7',
    D: '#4a8fd0',
    b: '#dfeefb',
    k: '#15406e',
}

// 유리돔 안 알사탕(오버레이). left/top은 stage(120×132px) 기준 px. 돔 내부에 배치.
const DOME_BALLS: { left: number; top: number; color: string }[] = [
    { left: 44, top: 24, color: '#f29b9b' },
    { left: 60, top: 24, color: '#f7df85' },
    { left: 36, top: 36, color: '#93c8ee' },
    { left: 52, top: 34, color: '#c7a0e6' },
    { left: 68, top: 36, color: '#a8e2c4' },
    { left: 44, top: 48, color: '#f7df85' },
    { left: 60, top: 48, color: '#93c8ee' },
]

// 알사탕 픽셀 스프라이트(7×7, 계단식 라운드). c=알사탕색, w=하이라이트.
const BALL_SPRITE = ['..ccc..', '.wcccc.', 'ccccccc', 'ccccccc', 'ccccccc', '.ccccc.', '..ccc..']
const ballPalette = (color: string): Record<string, string> => ({ c: color, w: '#ffffff' })

// 반짝이 픽셀 스프라이트(4점 별, 가운데 비움).
const SPARKLE = ['..#..', '..#..', '##.##', '..#..', '..#..']
const SPARKLE_SMALL = ['.#.', '#.#', '.#.']
const sparklePalette = (color: string): Record<string, string> => ({ '#': color })

// 뽑기 연출 시간(ms) — 알사탕이 섞이는 시간.
const SPIN_DURATION_MS = 1000
// 아이템 공개(반짝이) 유지 시간(ms).
const REVEAL_DURATION_MS = 2600

export const GachaTab = () => {
    const score = usePlayerStore((state) => state.player.score)
    const { gacha } = useItemActions()
    const [message, setMessage] = useState('포인트를 모아\n돌봄 아이템을 뽑아 보세요')
    const [spinning, setSpinning] = useState(false)
    const [reveal, setReveal] = useState<{ emoji: string; name: string } | null>(null)

    const canSpin = !spinning && score >= GACHA_COST

    const handleSpin = async () => {
        if (!canSpin) {
            return
        }
        setSpinning(true)
        setReveal(null)
        const outcome = await gacha()
        // 유리돔 알사탕이 섞이는 연출 (~1초).
        await new Promise((resolve) => setTimeout(resolve, SPIN_DURATION_MS))
        setSpinning(false)

        if (!outcome.success) {
            setMessage('포인트가 부족해요')
            return
        }
        const wonItem = CONSUMABLE_ITEMS.find((item) => item.id === outcome.wonItemId)
        if (wonItem) {
            // 획득 멘트는 표시하지 않는다(아래 reveal로 충분). 안내 멘트는 그대로 둔다.
            setMessage('포인트를 모아\n돌봄 아이템을 뽑아 보세요')
            setReveal({ emoji: wonItem.emoji, name: wonItem.name })
            setTimeout(() => setReveal(null), REVEAL_DURATION_MS)
        }
    }

    return (
        <div className='panel'>
            <div className='section-title gacha-title'>🎰 돌봄 아이템 뽑기</div>
            <div className='gacha-wrap'>
                <div className='gacha-msg'>{message}</div>
                <div className='gacha-machine'>
                    {reveal ? (
                        <div className='gacha-reveal'>
                            <span className='sparkle sparkle-1'>
                                <PixelArt
                                    pixels={SPARKLE}
                                    palette={sparklePalette('#f6dd5a')}
                                    cell={4}
                                />
                            </span>
                            <span className='sparkle sparkle-2'>
                                <PixelArt
                                    pixels={SPARKLE_SMALL}
                                    palette={sparklePalette('#e88bb8')}
                                    cell={4}
                                />
                            </span>
                            <span className='sparkle sparkle-3'>
                                <PixelArt
                                    pixels={SPARKLE_SMALL}
                                    palette={sparklePalette('#f6dd5a')}
                                    cell={3}
                                />
                            </span>
                            <span className='reveal-emoji'>{reveal.emoji}</span>
                            <span className='reveal-name'>{reveal.name}</span>
                        </div>
                    ) : (
                        <div className='gacha-stage'>
                            <PixelArt
                                pixels={MACHINE}
                                palette={MACHINE_PALETTE}
                                cell={4}
                            />
                            <div className={spinning ? 'gacha-balls mixing' : 'gacha-balls'}>
                                {DOME_BALLS.map((ball, index) => (
                                    <span
                                        key={index}
                                        className='gacha-ball'
                                        style={{
                                            left: ball.left,
                                            top: ball.top,
                                            animationDelay: `${-index * 0.06}s`,
                                        }}
                                    >
                                        <PixelArt
                                            pixels={BALL_SPRITE}
                                            palette={ballPalette(ball.color)}
                                            cell={2}
                                        />
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className='gacha-points'>🪙 {score}pt</div>
                <button
                    type='button'
                    className='pbtn'
                    onClick={handleSpin}
                    disabled={!canSpin}
                >
                    {spinning ? '섞는 중…' : `🎲 뽑기 (${GACHA_COST}pt)`}
                </button>
            </div>
        </div>
    )
}
