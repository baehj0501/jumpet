import { useState } from 'react'
import {
    CONSUMABLE_ITEMS,
    type ConsumableCategory,
    useItemActions,
    useItemCounts,
} from '@renderer/entities/item'
import { usePlayerStore } from '@renderer/entities/player'
import { CHARACTER_ASSETS } from '@renderer/entities/character'
import { PixelIcon } from '../PixelIcon'

// 돌봄 액션 픽셀 아이콘(7×7).
const ACTION_ICON_PIXELS: Record<string, string[]> = {
    feed: ['.......', '.......', '#######', '.#####.', '.#####.', '..###..', '.......'], // 밥그릇
    play: ['..###..', '.#####.', '#######', '#######', '.#####.', '..###..', '.......'], // 공
    pet: ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'], // 하트
    rest: ['#####..', '....#..', '...#...', '..#....', '.#.....', '#####..', '.......'], // Z(잠)
}

// 4개 돌봄 액션. category가 있으면 해당 소모 아이템 1개를 쓰고(없으면 비활성),
// null이면 아이템 없이 항상 가능한 무료 상호작용.
const ACTIONS: {
    key: string
    category: ConsumableCategory | null
    emoji: string
    label: string
    speech: string
}[] = [
    { key: 'feed', category: 'food', emoji: '🍚', label: '밥 주기', speech: '냠냠! 🍖' },
    { key: 'play', category: 'toy', emoji: '🎮', label: '놀아주기', speech: '신난다! ⚡' },
    { key: 'pet', category: null, emoji: '🤗', label: '쓰다듬기', speech: '좋아 ✨' },
    { key: 'rest', category: null, emoji: '🛋️', label: '눕기', speech: '편안해~ 🛋️' },
]

// 메뉴 창 localStorage에 저장되는 편집 가능 텍스트.
// (단일 창 표시라 임시로 localStorage 사용 — 추후 설정 도메인 SSOT로 이관 가능.)
const usePersistedText = (key: string, initial: string): [string, (value: string) => void] => {
    const [value, setValue] = useState<string>(() => {
        try {
            return localStorage.getItem(key) ?? initial
        } catch {
            return initial
        }
    })
    const update = (next: string) => {
        setValue(next)
        try {
            localStorage.setItem(key, next)
        } catch {
            // localStorage 접근 불가 시 무시(메모리 상태만 유지).
        }
    }
    return [value, update]
}

// 라벨(헤딩) + 클릭하면 인라인 편집되는 디스플레이 텍스트.
const ProfileField = ({
    label,
    value,
    onChange,
}: {
    label: string
    value: string
    onChange: (value: string) => void
}) => {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(value)

    const startEdit = () => {
        setDraft(value)
        setEditing(true)
    }
    const commit = () => {
        const trimmed = draft.trim()
        if (trimmed !== '') {
            onChange(trimmed)
        }
        setEditing(false)
    }

    return (
        <div className='profile-field'>
            <div className='profile-head'>
                <span className='section-title-2'>{label}</span>
                {!editing && (
                    <button
                        type='button'
                        className='edit-btn'
                        onClick={startEdit}
                        title='수정'
                    >
                        ✎
                    </button>
                )}
            </div>
            {editing ? (
                <input
                    className='fi'
                    autoFocus
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={commit}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                            commit()
                        } else if (event.key === 'Escape') {
                            setEditing(false)
                        }
                    }}
                />
            ) : (
                <div className='profile-value'>{value}</div>
            )}
        </div>
    )
}

export const CareTab = () => {
    const counts = useItemCounts()
    const { consume } = useItemActions()
    const score = usePlayerStore((state) => state.player.score)

    const [characterName, setCharacterName] = usePersistedText('jumpet.profile.characterName', '웰시코기')
    const [petName, setPetName] = usePersistedText('jumpet.profile.petName', '조조')
    const [birthday, setBirthday] = usePersistedText('jumpet.profile.birthday', '5월 31일')

    const say = (text: string) => {
        window.api.character.say(text)
    }

    const availableCount = (category: ConsumableCategory): number =>
        CONSUMABLE_ITEMS.filter((item) => item.category === category).reduce(
            (sum, item) => sum + (counts[item.id] ?? 0),
            0,
        )

    const handleAction = (action: (typeof ACTIONS)[number]) => {
        if (action.category === null) {
            say(action.speech)
            return
        }
        const item = CONSUMABLE_ITEMS.find(
            (candidate) => candidate.category === action.category && (counts[candidate.id] ?? 0) > 0,
        )
        if (!item) {
            return
        }
        void consume(item.id)
        say(action.speech)
    }

    return (
        <div className='panel'>
            <img
                className='home-character'
                src={CHARACTER_ASSETS.dog.default}
                alt='캐릭터'
                draggable={false}
            />

            <div className='section-title-1'>정보</div>
            <div className='profile'>
                <ProfileField
                    label='캐릭터 이름'
                    value={characterName}
                    onChange={setCharacterName}
                />
                <ProfileField
                    label='이름'
                    value={petName}
                    onChange={setPetName}
                />
                <ProfileField
                    label='생일'
                    value={birthday}
                    onChange={setBirthday}
                />
            </div>

            <div className='divider' />

            <div className='section-title-1'>돌봄</div>
            <div className='agrid'>
                {ACTIONS.map((action) => {
                    const available = action.category === null ? null : availableCount(action.category)
                    const disabled = available === 0
                    return (
                        <div
                            key={action.key}
                            className={disabled ? 'ac disabled' : 'ac'}
                            onClick={() => {
                                if (!disabled) {
                                    handleAction(action)
                                }
                            }}
                        >
                            <div className='ic'>
                                <PixelIcon
                                    pixels={ACTION_ICON_PIXELS[action.key]}
                                    size={24}
                                />
                            </div>
                            <div className='nm'>{action.label}</div>
                            {available !== null && <div className='ct'>×{available}</div>}
                        </div>
                    )
                })}
            </div>

            <div className='points-bar'>🪙 총 포인트: {score}pt</div>
        </div>
    )
}
