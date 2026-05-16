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
    // 드래그와 자율 이동(walking) 사이의 경합을 막기 위한 공유 신호.
    const isDraggingRef = useRef(false)

    // 캐릭터의 상태 머신을 초기화하고 현재 상태를 가져온다.
    const [characterState, { interrupt: interruptAutonomousState }] = useStateMachine(isDraggingRef)

    // 캐릭터의 현재 상태에 따라 걷기 애니메이션을 적용한다.
    useWalking(characterState, isDraggingRef)

    const { handleMouseDown } = useWindowDrag({
        isDraggingRef,
        onDragStart: interruptAutonomousState,
    })
    const { handleContextMenu } = useContextMenu()

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
