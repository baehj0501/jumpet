import { useState } from 'react'
import {
    CONSUMABLE_ITEMS,
    type ConsumableCategory,
    useItemActions,
    useItemCounts,
} from '@renderer/entities/item'
import { usePlayerStore } from '@renderer/entities/player'
import {
    CHARACTER_ASSETS,
    CHARACTER_DISPLAY_NAMES,
    type CharacterId,
    useSelectedCharacterId,
    useSelectCharacter,
} from '@renderer/entities/character'
import { useProfile, useProfileActions } from '@renderer/entities/profile'
import { PixelIcon } from '../PixelIcon'

// 카탈로그에 등록된 캐릭터 ID 목록(좌우 전환 대상).
const CHARACTER_IDS = Object.keys(CHARACTER_ASSETS) as CharacterId[]

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

// 라벨(헤딩) + 클릭하면 인라인 편집되는 디스플레이 텍스트.
const ProfileField = ({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    // 입력을 비웠을 때 흐리게(30%) 보여줄 기본값.
    placeholder?: string
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
                    className='fi profile-edit'
                    autoFocus
                    placeholder={placeholder}
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

    // 홈 프로필(SSOT) — 메뉴 창·펫 창이 공유. 좌클릭 멘트의 '이름'도 이 값을 쓴다.
    const profile = useProfile()
    const { setField } = useProfileActions()

    // 표시 중인 캐릭터 — main SSOT에서 읽는다. 좌우 버튼이 select하면 펫 윈도우도 함께 바뀐다.
    const currentCharacterId = useSelectedCharacterId()
    const selectCharacter = useSelectCharacter()

    // '캐릭터 이름' — profile.characterName이 ''이면 선택된 캐릭터의 기본명을 따라가고,
    // 한 번 수정하면 그 값으로 고정.
    const characterName =
        profile.characterName !== ''
            ? profile.characterName
            : (CHARACTER_DISPLAY_NAMES[currentCharacterId] ?? currentCharacterId)
    const setCharacterName = (value: string) => void setField('characterName', value)
    const petName = profile.petName
    const setPetName = (value: string) => void setField('petName', value)
    const birthday = profile.birthday
    const setBirthday = (value: string) => void setField('birthday', value)
    const currentCharacterIndex = Math.max(0, CHARACTER_IDS.indexOf(currentCharacterId))
    const cycleCharacter = (delta: number) => {
        const nextIndex =
            (currentCharacterIndex + delta + CHARACTER_IDS.length) % CHARACTER_IDS.length
        void selectCharacter(CHARACTER_IDS[nextIndex])
    }

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
            <div className='home-character-row'>
                <button
                    type='button'
                    className='char-nav'
                    onClick={() => cycleCharacter(-1)}
                    disabled={CHARACTER_IDS.length <= 1}
                    title='이전 캐릭터'
                >
                    ‹
                </button>
                <img
                    className='home-character'
                    src={CHARACTER_ASSETS[CHARACTER_IDS[currentCharacterIndex]].default}
                    alt='캐릭터'
                    draggable={false}
                />
                <button
                    type='button'
                    className='char-nav'
                    onClick={() => cycleCharacter(1)}
                    disabled={CHARACTER_IDS.length <= 1}
                    title='다음 캐릭터'
                >
                    ›
                </button>
            </div>

            <div className='section-title-1'>정보</div>
            <div className='profile'>
                <ProfileField
                    label='캐릭터 이름'
                    value={characterName}
                    onChange={setCharacterName}
                    placeholder={CHARACTER_DISPLAY_NAMES[currentCharacterId] ?? currentCharacterId}
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
