import { useRef } from 'react'
import { CharacterView, useStateMachine, useWalking } from '@renderer/entities/character'
import type { CharacterId, Mood } from '@renderer/entities/character'
import { useWindowDrag } from '@renderer/features/drag'
import { useContextMenu } from '@renderer/features/context-menu'

// 캐릭터 선택 / 감정 전환 UI는 Phase 1B 이후 인터랙션에서 결정.
// 지금은 고정값으로 진행해 카탈로그 구조만 동작시킨다.
const CURRENT_CHARACTER_ID: CharacterId = 'dog'
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

    const { handleMouseDown } = useWindowDrag({
        isInteractingRef,
        onDragStart: interruptAutonomousState,
    })
    const { handleContextMenu } = useContextMenu({ isInteractingRef })

    return (
        <CharacterView
            characterId={CURRENT_CHARACTER_ID}
            mood={CURRENT_MOOD}
            state={characterState}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
        />
    )
}
