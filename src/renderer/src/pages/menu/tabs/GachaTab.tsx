import { useState } from 'react'
import { usePlayerStore } from '@renderer/entities/player'
import { CONSUMABLE_ITEMS, GACHA_COST, useItemActions } from '@renderer/entities/item'

export const GachaTab = () => {
    const score = usePlayerStore((state) => state.player.score)
    const { gacha } = useItemActions()
    // 뽑은 아이템(또는 실패 멘트)을 보여주는 결과 슬롯. 안내 멘트와 분리.
    const [result, setResult] = useState('')
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
            setResult('포인트가 부족해요')
            return
        }
        const wonItem = CONSUMABLE_ITEMS.find((item) => item.id === outcome.wonItemId)
        if (wonItem) {
            setResult(`${wonItem.emoji} ${wonItem.name}`)
        }
    }

    return (
        <div className='panel'>
            <div className='section-title gacha-title'>🎰 돌봄 아이템 뽑기</div>
            <div className='gacha-wrap'>
                <div className='gacha-msg'>{'포인트를 모아\n돌봄 아이템을 뽑아 보세요'}</div>
                <div className='gacha-points'>🪙 {score}pt</div>
                {/* 포인트와 뽑기 버튼 사이 여백 + 뽑은 아이템 표시 슬롯 */}
                <div className='gacha-result-slot'>{result}</div>
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
