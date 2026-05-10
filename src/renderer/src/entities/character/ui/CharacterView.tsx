import type { MouseEvent } from 'react'
import type { CharacterState } from '../model/CharacterState'
import dogImage from '../assets/dog.jpeg'

type CharacterViewProps = {
  state: CharacterState
  onMouseDown: (event: MouseEvent) => void
  onContextMenu: (event: MouseEvent) => void
}

// 캐릭터의 시각만 담당하는 dumb 컴포넌트.
// 행동/상태 로직은 hooks(behaviors)와 features에 분산되어 있다.
export const CharacterView = ({ state, onMouseDown, onContextMenu }: CharacterViewProps) => {
  return (
    <div
      className="pet"
      data-state={state}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
    >
      <img src={dogImage} alt="강아지" draggable={false} />
    </div>
  )
}
