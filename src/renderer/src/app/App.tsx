import { useRef } from 'react'
import {
    CHARACTER_DISPLAY_NAMES,
    CharacterView,
    SpeechBubble,
    pickRandomClickMessage,
    useCharacterSpeech,
    useSelectedCharacterId,
    useStateMachine,
    useWalking,
    withSubjectParticle,
    withVocativeParticle,
} from '@renderer/entities/character'
import type { Mood } from '@renderer/entities/character'
import { getProfileSnapshot } from '@renderer/entities/profile'
import { useWindowDrag } from '@renderer/features/drag'
import { useContextMenu } from '@renderer/features/context-menu'

// 감정 전환 UI는 Phase 1B 이후 인터랙션에서 결정 — 지금은 default 고정.
// 캐릭터(펫) 종류는 홈 탭 좌우 버튼이 바꾸는 SSOT(useSelectedCharacterId)에서 읽는다.
const CURRENT_MOOD: Mood = 'default'

export const App = () => {
    // 사용자 인터랙션(드래그, 메뉴 열림) 동안 자율 이동(walking)을 멈추기 위한 공유 신호.
    // features 계층(드래그, 컨텍스트 메뉴)이 write하고 entities 계층(behaviors)이 read한다.
    // 드래그와 메뉴는 시간상 거의 겹치지 않으므로 단일 ref OR set으로 충분하다.
    const isInteractingRef = useRef(false)

    // 캐릭터의 상태 머신을 초기화하고 현재 상태를 가져온다.
    const [characterState, { interrupt: interruptAutonomousState }] = useStateMachine(isInteractingRef)

    // 캐릭터의 현재 상태에 따라 걷기 애니메이션을 적용한다.
    useWalking(characterState, isInteractingRef)

    // 홈 탭에서 선택한 캐릭터(SSOT) — 바뀌면 펫도 즉시 교체된다.
    const selectedCharacterId = useSelectedCharacterId()

    // 말풍선 상태 — 다른 창(메뉴 돌봄 등)의 멘트 구독 + 같은 창(좌클릭) 멘트는 showSpeech로 즉시 표시.
    const { speech, showSpeech } = useCharacterSpeech()

    // useWindowDrag는 자율 행동 정책을 모른다 — 호출자가 콜백에서 ref를 토글하고 자율 상태도 멈춘다.
    const { handleMouseDown } = useWindowDrag({
        onDragStart: () => {
            isInteractingRef.current = true
            interruptAutonomousState()
        },
        onDragEnd: () => {
            isInteractingRef.current = false
        },
        // 드래그가 아닌 단순 좌클릭 → 랜덤 멘트를 머리 위 말풍선으로.
        // 클릭 시점의 최신 프로필(SSOT)을 읽는다.
        // 50% 확률 우측 정렬 태그 "(캐릭터 이름)이/가" — 정보의 '캐릭터 이름'(비우면 캐릭터 기본명).
        // 10% 확률 제일 윗줄 "(이름)아/야" — 정보의 '이름'.
        onClick: () => {
            const profile = getProfileSnapshot()
            const characterName =
                profile.characterName !== ''
                    ? profile.characterName
                    : (CHARACTER_DISPLAY_NAMES[selectedCharacterId] ?? selectedCharacterId)
            let message = pickRandomClickMessage()
            if (Math.random() < 0.1) {
                message = `${withVocativeParticle(profile.petName)}\n${message}`
            }
            const tag = Math.random() < 0.5 ? withSubjectParticle(characterName) : undefined
            showSpeech(message, tag)
        },
    })
    const { handleContextMenu } = useContextMenu({ isInteractingRef })

    return (
        <>
            <SpeechBubble
                text={speech.text}
                tag={speech.tag}
            />
            <CharacterView
                characterId={selectedCharacterId}
                mood={CURRENT_MOOD}
                state={characterState}
                onMouseDown={handleMouseDown}
                onContextMenu={handleContextMenu}
            />
        </>
    )
}
