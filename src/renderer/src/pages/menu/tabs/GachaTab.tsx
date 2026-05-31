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
    { left: 41, top: 23, color: '#f29b9b' },
    { left: 63, top: 25, color: '#f7df85' },
    { left: 33, top: 39, color: '#93c8ee' },
    { left: 51, top: 33, color: '#c7a0e6' },
    { left: 69, top: 41, color: '#a8e2c4' },
    { left: 41, top: 51, color: '#f4a6c8' },
    { left: 63, top: 51, color: '#93c8ee' },
    { left: 51, top: 55, color: '#f7df85' },
]

// 머신 바닥에 떨어져 있는 알사탕(정적). stage(120×132px) 기준.
const FLOOR_BALLS: { left: number; top: number; color: string }[] = [
    { left: 2, top: 116, color: '#f29b9b' },
    { left: 16, top: 124, color: '#f7df85' },
    { left: 30, top: 128, color: '#c7a0e6' },
    { left: 84, top: 128, color: '#a8e2c4' },
    { left: 98, top: 116, color: '#93c8ee' },
    { left: 110, top: 124, color: '#f7df85' },
]

// 알사탕 픽셀 스프라이트(9×9, 계단식 라운드, 외곽선 2칸 두께). o=테두리 c=알사탕색 w=하이라이트.
const BALL_SPRITE = [
    '...ooo...',
    '.ooooooo.',
    '.oowccoo.',
    'oocccccoo',
    'oocccccoo',
    'oocccccoo',
    '.oocccoo.',
    '.ooooooo.',
    '...ooo...',
]
// 색의 채도를 올린(더 선명한) 톤 — 테두리용.
const saturateTone = (hex: string, satMul = 1.6, lightMul = 0.82): string => {
    const n = parseInt(hex.slice(1), 16)
    const r = ((n >> 16) & 255) / 255
    const g = ((n >> 8) & 255) / 255
    const b = (n & 255) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    const l = (max + min) / 2
    let h = 0
    let s = 0
    if (delta !== 0) {
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
        if (max === r) h = ((g - b) / delta) % 6
        else if (max === g) h = (b - r) / delta + 2
        else h = (r - g) / delta + 4
        h *= 60
        if (h < 0) h += 360
    }
    s = Math.min(1, s * satMul)
    const L = Math.max(0, Math.min(1, l * lightMul))
    const c = (1 - Math.abs(2 * L - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = L - c / 2
    let rr = 0
    let gg = 0
    let bb = 0
    if (h < 60) [rr, gg, bb] = [c, x, 0]
    else if (h < 120) [rr, gg, bb] = [x, c, 0]
    else if (h < 180) [rr, gg, bb] = [0, c, x]
    else if (h < 240) [rr, gg, bb] = [0, x, c]
    else if (h < 300) [rr, gg, bb] = [x, 0, c]
    else [rr, gg, bb] = [c, 0, x]
    const toHex = (v: number) =>
        Math.round((v + m) * 255)
            .toString(16)
            .padStart(2, '0')
    return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`
}
// 알사탕 색 + 그 색의 채도를 올린 테두리.
const ballPalette = (color: string): Record<string, string> => ({
    c: color,
    w: '#ffffff',
    o: saturateTone(color),
})

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
                            {FLOOR_BALLS.map((ball, index) => (
                                <span
                                    key={`floor-${index}`}
                                    className='gacha-floor-ball'
                                    style={{ left: ball.left, top: ball.top }}
                                >
                                    <PixelArt
                                        pixels={BALL_SPRITE}
                                        palette={ballPalette(ball.color)}
                                        cell={1.6}
                                    />
                                </span>
                            ))}
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
                <button
                    type='button'
                    className='pbtn'
                    onClick={handleSpin}
                    disabled={!canSpin}
                >
                    {spinning ? '섞는 중…' : `🎲 뽑기 (${GACHA_COST}pt)`}
                </button>
                <div className='gacha-points'>내 포인트: {score}pt</div>
            </div>
        </div>
    )
}
