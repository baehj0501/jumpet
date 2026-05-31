import { useState } from 'react'
import { usePlayerStore } from '@renderer/entities/player'
import { CONSUMABLE_ITEMS, GACHA_COST, useItemActions } from '@renderer/entities/item'

type SpinResult = { emoji: string; name: string } | null

export const GachaTab = () => {
    const score = usePlayerStore((state) => state.player.score)
    const { gacha } = useItemActions()
    const [result, setResult] = useState<SpinResult>(null)
    const [message, setMessage] = useState('포인트를 모아 돌봄 아이템을 뽑아보세요!')
    const [spinning, setSpinning] = useState(false)

    const canSpin = !spinning && score >= GACHA_COST

    const handleSpin = async () => {
        if (!canSpin) {
            return
        }
        setSpinning(true)
        const outcome = await gacha()
        setSpinning(false)

        if (!outcome.success) {
            setResult(null)
            setMessage('포인트가 부족해요')
            return
        }
        const wonItem = CONSUMABLE_ITEMS.find((item) => item.id === outcome.wonItemId)
        if (wonItem) {
            setResult({ emoji: wonItem.emoji, name: wonItem.name })
            setMessage(`${wonItem.name} 획득!`)
        }
    }

    return (
        <div className='panel'>
            <div className='gacha-wrap'>
                <div className='section-title'>🎰 돌봄 아이템 뽑기</div>
                <div className='points-bar'>🪙 {score}pt</div>

                <div className='gacha-result'>
                    {result ? (
                        <>
                            <span className='big'>{result.emoji}</span>
                            <span>{message}</span>
                        </>
                    ) : (
                        <span>{message}</span>
                    )}
                </div>

                <button
                    type='button'
                    className='pbtn'
                    onClick={handleSpin}
                    disabled={!canSpin}
                >
                    {spinning ? '뽑는 중…' : `🎲 뽑기 (${GACHA_COST}pt)`}
                </button>
            </div>
        </div>
    )
}
