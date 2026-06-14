import type { MouseEvent } from 'react'
import type { CharacterState } from '../model/CharacterState'
import type { CharacterId, Mood } from '../model/Character'
import { CHARACTER_ASSETS } from '../assets'
import { containerStyle, imageStyle } from './CharacterView.styles'

type CharacterViewProps = {
    characterId: CharacterId
    mood: Mood
    // 행동 상태. 시각 표현(이미지)에는 영향을 주지 않지만,
    // CSS에서 data-state로 잡거나 디버깅 시 유용해 그대로 노출.
    state: CharacterState
    // 클릭 반응 등 일시적 프레임을 강제로 보여줄 때. 없으면 mood 기본 이미지.
    overrideSrc?: string
    onMouseDown: (event: MouseEvent) => void
    onContextMenu: (event: MouseEvent) => void
}

// 캐릭터의 시각만 담당하는 dumb 컴포넌트.
// 행동/감정 로직은 hooks(behaviors)와 features에 분산되어 있다.
export const CharacterView = ({
    characterId,
    mood,
    state,
    overrideSrc,
    onMouseDown,
    onContextMenu,
}: CharacterViewProps) => {
    const imageSrc = overrideSrc ?? CHARACTER_ASSETS[characterId][mood]

    return (
        <div
            css={containerStyle}
            data-state={state}
            data-mood={mood}
            onMouseDown={onMouseDown}
            onContextMenu={onContextMenu}
        >
            <img
                css={imageStyle}
                src={imageSrc}
                alt={characterId}
                draggable={false}
            />
        </div>
    )
}
