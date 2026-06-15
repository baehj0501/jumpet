import { usePlayerStore } from '@renderer/entities/player'
import {
    CHARACTER_ASSETS,
    CHARACTER_DISPLAY_NAMES,
    HOME_SCENE_ASSETS,
    type CharacterId,
    useSelectedCharacterId,
    useSelectCharacter,
} from '@renderer/entities/character'
import { getBirthdayCooldown, useProfile, useProfileActions } from '@renderer/entities/profile'
import { ProfileRow } from '../ProfileRow'
import homeCloud from '../assets/home_cloud2.png'

// 카탈로그에 등록된 캐릭터 ID 목록(좌우 전환 대상).
const CHARACTER_IDS = Object.keys(CHARACTER_ASSETS) as CharacterId[]

export const CareTab = () => {
    const score = usePlayerStore((state) => state.player.score)

    // 홈 프로필(SSOT) — 메뉴 창·펫 창이 공유. 좌클릭 멘트의 '이름'도 이 값을 쓴다.
    const profile = useProfile()
    const { setField } = useProfileActions()

    // 표시 중인 캐릭터 — main SSOT에서 읽는다. 좌우 버튼이 select하면 펫 윈도우도 함께 바뀐다.
    const currentCharacterId = useSelectedCharacterId()
    const selectCharacter = useSelectCharacter()

    // '캐릭터 이름' — 선택된 캐릭터의 고정 종류명(슈피/피요/쿠피/윙피). 수정 불가.
    const characterName = CHARACTER_DISPLAY_NAMES[currentCharacterId] ?? currentCharacterId
    const petName = profile.petName
    const setPetName = (value: string) => void setField('petName', value)
    const birthday = profile.birthday
    const setBirthday = (value: string) => void setField('birthday', value)
    // 생일은 변경 후 1달 쿨타임 — 잠금 중엔 수정 불가(연필 숨김).
    const birthdayCooldown = getBirthdayCooldown(profile)
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
