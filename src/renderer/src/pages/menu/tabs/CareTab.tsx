import { useState } from 'react'
import { usePlayerStore } from '@renderer/entities/player'
import {
    CHARACTER_ASSETS,
    CHARACTER_DISPLAY_NAMES,
    type CharacterId,
    useOwnedCharacters,
    useSelectedCharacterId,
    useSelectCharacter,
} from '@renderer/entities/character'
import { getBirthdayCooldown, useProfile, useProfileActions } from '@renderer/entities/profile'
import { ProfileRow } from '../ProfileRow'

// ‹ › 로 둘러볼 전체 캐릭터 목록.
const ALL_CHARACTER_IDS = Object.keys(CHARACTER_ASSETS) as CharacterId[]

// 홈 탭 캐릭터 표시 배율 — 슈피는 기준(1), 나머지는 20% 작게. (발끝 기준 축소)
const HOME_FIGURE_SCALE: Record<CharacterId, number> = {
    piyoo: 0.85,
    qupee: 0.8,
    suupee: 1,
    wingpee: 0.85,
}

export const CareTab = () => {
    const score = usePlayerStore((state) => state.player.score)

    // 홈 프로필(SSOT) — 메뉴 창·펫 창이 공유. 좌클릭 멘트의 '이름'도 이 값을 쓴다.
    const profile = useProfile()
    const { setField } = useProfileActions()

    // 활성(장착) 캐릭터 — main SSOT. 잠긴 캐릭터를 둘러봐도 활성은 바뀌지 않는다.
    const currentCharacterId = useSelectedCharacterId()
    const selectCharacter = useSelectCharacter()
    const ownedCharacterIds = useOwnedCharacters()
    // ‹ ›는 전체 캐릭터를 둘러본다(로컬 index). 보유 캐릭터로 넘어가면 즉시 장착되고,
    // 잠긴 캐릭터는 미리보기(잠금 표시)만 하고 장착은 그대로다.
    const [browseIndex, setBrowseIndex] = useState(() =>
        Math.max(0, ALL_CHARACTER_IDS.indexOf(currentCharacterId)),
    )
    const browsedId = ALL_CHARACTER_IDS[browseIndex] ?? currentCharacterId
    const browsedOwned = ownedCharacterIds.includes(browsedId)

    // '캐릭터 이름' — 둘러보는 캐릭터의 고정 종류명(슈피/피요/쿠피/윙피). 수정 불가.
    const characterName = CHARACTER_DISPLAY_NAMES[browsedId] ?? browsedId
    const petName = profile.petName
    const setPetName = (value: string) => void setField('petName', value)
    const birthday = profile.birthday
    const setBirthday = (value: string) => void setField('birthday', value)
    // 생일은 변경 후 1달 쿨타임 — 잠금 중엔 수정 불가(연필 숨김).
    const birthdayCooldown = getBirthdayCooldown(profile)
    const cycleCharacter = (delta: number) => {
        const nextIndex =
            (browseIndex + delta + ALL_CHARACTER_IDS.length) % ALL_CHARACTER_IDS.length
        setBrowseIndex(nextIndex)
        const nextId = ALL_CHARACTER_IDS[nextIndex]
        // 보유한 캐릭터면 즉시 장착(펫도 전환). 잠긴 캐릭터는 미리보기만.
        if (ownedCharacterIds.includes(nextId)) {
            void selectCharacter(nextId)
        }
    }

    return (
        <div className='panel'>
            <div className='home-scene'>
                <span className='home-sparkle s1'>✦</span>
                <span className='home-sparkle s2'>✦</span>
                <span className='home-sparkle s3'>✦</span>
                <span className='home-sparkle s4'>✦</span>
                <span className='home-sparkle s5'>✦</span>
                <span className='home-sparkle s6'>✦</span>
                <span className='home-sparkle s7'>✦</span>
                <span className='home-sparkle s8'>✦</span>

                <div className='home-bubble'>{petName} 안녕! 💗</div>
                <span className='home-bubble-tail' />

                <button
                    type='button'
                    className='char-nav'
                    onClick={() => cycleCharacter(-1)}
                    disabled={ALL_CHARACTER_IDS.length <= 1}
                    title='이전 캐릭터'
                >
                    ‹
                </button>
                <img
                    className='home-figure'
                    src={CHARACTER_ASSETS[browsedId].default}
                    alt='캐릭터'
                    draggable={false}
                    style={{
                        transform: `translateX(-50%) scale(${HOME_FIGURE_SCALE[browsedId] ?? 1})`,
                        transformOrigin: 'bottom center',
                        // 잠긴 캐릭터는 흐리게 미리보기.
                        filter: browsedOwned ? undefined : 'grayscale(1) brightness(1.1)',
                        opacity: browsedOwned ? 1 : 0.35,
                    }}
                />
                {!browsedOwned && (
                    <div className='home-lock'>
                        <span className='home-lock-icon'>🔒</span>
                        <span className='home-lock-text'>뽑기로 해제</span>
                    </div>
                )}
                <button
                    type='button'
                    className='char-nav'
                    onClick={() => cycleCharacter(1)}
                    disabled={ALL_CHARACTER_IDS.length <= 1}
                    title='다음 캐릭터'
                >
                    ›
                </button>
            </div>

            <div className='profile-rows'>
                <ProfileRow
                    label='캐릭터 이름'
                    value={characterName}
                />
                <ProfileRow
                    label='내 이름'
                    value={petName}
                    onChange={setPetName}
                />
                <ProfileRow
                    label='생일'
                    value={birthday}
                    onChange={birthdayCooldown.locked ? undefined : setBirthday}
                />
                <div className='profile-row'>
                    <span className='profile-row-label'>포인트</span>
                    <span className='profile-row-value points'>{score}P</span>
                    <span className='profile-row-edit-placeholder' />
                </div>
            </div>
            {birthdayCooldown.locked && (
                <div className='hint'>
                    생일은 한 달에 한 번만 바꿀 수 있어요 (D-{birthdayCooldown.remainingDays})
                </div>
            )}
        </div>
    )
}
