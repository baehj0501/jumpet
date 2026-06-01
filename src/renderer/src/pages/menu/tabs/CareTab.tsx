import { useState } from 'react'
import { usePlayerStore } from '@renderer/entities/player'
import {
    CHARACTER_ASSETS,
    CHARACTER_DISPLAY_NAMES,
    HOME_SCENE_ASSETS,
    type CharacterId,
    useSelectedCharacterId,
    useSelectCharacter,
} from '@renderer/entities/character'
import { useProfile, useProfileActions } from '@renderer/entities/profile'
import homeCloud from '../assets/home_cloud2.png'

// 카탈로그에 등록된 캐릭터 ID 목록(좌우 전환 대상).
const CHARACTER_IDS = Object.keys(CHARACTER_ASSETS) as CharacterId[]

// 프로필 한 줄 — 아이콘 + 라벨 + 값 박스 + 연필(클릭 시 인라인 편집).
const ProfileRow = ({
    icon,
    label,
    value,
    onChange,
    placeholder,
}: {
    icon: string
    label: string
    value: string
    onChange: (value: string) => void
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
        <div className='profile-row'>
            <span className='profile-row-icon'>{icon}</span>
            <span className='profile-row-label'>{label}</span>
            {editing ? (
                <input
                    className='fi profile-row-input'
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
                <span className='profile-row-value'>{value}</span>
            )}
            <button
                type='button'
                className='profile-row-edit'
                onClick={startEdit}
                title='수정'
            >
                ✎
            </button>
        </div>
    )
}

export const CareTab = () => {
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

    return (
        <div className='panel'>
            <div className='home-scene'>
                <img
                    className='home-cloud c1'
                    src={homeCloud}
                    alt=''
                    draggable={false}
                />
                <img
                    className='home-cloud c2'
                    src={homeCloud}
                    alt=''
                    draggable={false}
                />
                <span className='home-sparkle s1'>✦</span>
                <span className='home-sparkle s2'>✦</span>
                <span className='home-sparkle s3'>✦</span>
                <span className='home-sparkle s4'>✦</span>

                <div className='home-bubble'>{petName} 안녕! 💗</div>
                <span className='home-bubble-tail' />

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
                    className='home-figure'
                    src={HOME_SCENE_ASSETS[CHARACTER_IDS[currentCharacterIndex]]}
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

            <div className='profile-rows'>
                <ProfileRow
                    icon='🌿'
                    label='캐릭터 이름'
                    value={characterName}
                    onChange={setCharacterName}
                    placeholder={CHARACTER_DISPLAY_NAMES[currentCharacterId] ?? currentCharacterId}
                />
                <ProfileRow
                    icon='💗'
                    label='내 이름'
                    value={petName}
                    onChange={setPetName}
                />
                <ProfileRow
                    icon='🎂'
                    label='생일'
                    value={birthday}
                    onChange={setBirthday}
                />
                <div className='profile-row'>
                    <span className='profile-row-icon'>⭐</span>
                    <span className='profile-row-label'>포인트</span>
                    <span className='profile-row-value points'>{score}P</span>
                    <span className='profile-row-edit-placeholder' />
                </div>
            </div>
        </div>
    )
}
