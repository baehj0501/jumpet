import { useCallback, useEffect, useRef, useState } from 'react'
import {
    CONSUMABLE_ITEMS,
    type ConsumableCategory,
    useItemActions,
    useItemCounts,
} from '@renderer/entities/item'
import { usePlayerStore } from '@renderer/entities/player'
import type { TabId } from '../MenuPage'

const ITEM_SECTIONS: { category: ConsumableCategory; emoji: string; title: string; feedback: string }[] = [
    { category: 'food', emoji: '🍚', title: '밥 주기', feedback: '냠냠! 🍖' },
    { category: 'toy', emoji: '🎮', title: '놀아주기', feedback: '신난다! ⚡' },
]

const FREE_ACTIONS: { key: string; emoji: string; label: string; feedback: string }[] = [
    { key: 'pet', emoji: '🤗', label: '쓰다듬기', feedback: '좋아 ✨' },
    { key: 'rest', emoji: '🛋️', label: '눕기', feedback: '편안해~ 🛋️' },
]

const FEEDBACK_DURATION_MS = 2500

type CareTabProps = {
    onSwitchTab: (tab: TabId) => void
}

export const CareTab = ({ onSwitchTab }: CareTabProps) => {
    const counts = useItemCounts()
    const { consume } = useItemActions()
    const score = usePlayerStore((state) => state.player.score)
    const [feedback, setFeedback] = useState('오늘도 함께 놀아요!')
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const flash = useCallback((message: string) => {
        setFeedback(message)
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
            setFeedback('오늘도 함께 놀아요!')
            timeoutRef.current = null
        }, FEEDBACK_DURATION_MS)
    }, [])

    useEffect(() => {
        return () => {
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return (
        <div className='panel'>
            <div className='fr'>{feedback}</div>

            {ITEM_SECTIONS.map((section) => {
                const owned = CONSUMABLE_ITEMS.filter(
                    (item) => item.category === section.category && (counts[item.id] ?? 0) > 0,
                )
                return (
                    <div key={section.category}>
                        <div className='section-title'>
                            {section.emoji} {section.title}
                        </div>
                        {owned.length > 0 ? (
                            <div className='agrid'>
                                {owned.map((item) => (
                                    <div
                                        key={item.id}
                                        className='ac'
                                        onClick={() => {
                                            void consume(item.id)
                                            flash(section.feedback)
                                        }}
                                    >
                                        <div className='ic'>{item.emoji}</div>
                                        <div className='nm'>{item.name}</div>
                                        <div className='ct'>×{counts[item.id]}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='empty-hint'>아이템이 없어요 — 🎰 가챠에서 뽑아보세요!</div>
                        )}
                    </div>
                )
            })}

            <div className='section-title'>✋ 함께하기</div>
            <div className='agrid'>
                {FREE_ACTIONS.map((action) => (
                    <div
                        key={action.key}
                        className='ac'
                        onClick={() => flash(action.feedback)}
                    >
                        <div className='ic'>{action.emoji}</div>
                        <div className='nm'>{action.label}</div>
                    </div>
                ))}
            </div>

            <button
                type='button'
                className='pbtn ghost'
                onClick={() => onSwitchTab('fortune')}
            >
                🌸 오늘의 운세 보기
            </button>

            <div className='points-bar'>🪙 총 포인트: {score}pt</div>
        </div>
    )
}
