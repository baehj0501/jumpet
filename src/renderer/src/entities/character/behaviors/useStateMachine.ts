import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { CharacterState } from '../model/CharacterState'
import {
  STATE_TICK_INTERVAL_MS,
  WALK_START_PROBABILITY,
  WALK_STOP_PROBABILITY
} from '../model/constants'

// 캐릭터의 자율 상태 전환을 관리한다.
// 일정 주기마다 확률 기반으로 idle ↔ walking을 오간다.
// 드래그 중에는 외부에서 ref로 신호를 주면 전환을 보류한다.
export const useStateMachine = (isDraggingRef: RefObject<boolean>) => {
  const [state, setState] = useState<CharacterState>('idle')

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isDraggingRef.current) {
        return
      }
      setState((prev) => {
        if (prev === 'idle') {
          return Math.random() < WALK_START_PROBABILITY ? 'walking' : 'idle'
        }
        return Math.random() < WALK_STOP_PROBABILITY ? 'idle' : 'walking'
      })
    }, STATE_TICK_INTERVAL_MS)
    return () => clearInterval(intervalId)
    // isDraggingRef는 useRef 결과로 identity가 영구히 stable이므로 deps에 넣지 않는다.
  }, [])

  return [state, setState] as const
}
