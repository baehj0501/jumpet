import { useCallback, useEffect, useState } from 'react'
import type { CharacterState } from '../model/CharacterState'
import {
  STATE_TICK_INTERVAL_MS,
  WALK_START_PROBABILITY,
  WALK_STOP_PROBABILITY
} from '../model/constants'

// 자율 상태 전환 신호를 전달하기 위한 읽기 전용 ref.
// behaviors hook은 신호만 받고, write 권한은 features 계층(드래그 등)에 둔다.
type ReadonlyBooleanRef = { readonly current: boolean }

// 캐릭터의 자율 상태 전환을 관리한다.
// 일정 주기마다 확률 기반으로 idle ↔ walking을 오간다.
// 드래그 중에는 외부에서 ref로 신호를 주면 전환을 보류한다.
//
// 외부에는 현재 상태와 interrupt 액션만 노출한다.
// raw setState를 노출하면 확률 기반 전이 규칙을 우회한 임의 전환이 가능해져
// 상태 머신의 추상화가 깨지므로, 의미 단위 액션으로 좁힌다.
export const useStateMachine = (isDraggingRef: ReadonlyBooleanRef) => {
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

  // 외부 인터랙션(예: 드래그 시작)에서 자율 행동을 즉시 멈추고 idle로 되돌릴 때 사용.
  const interrupt = useCallback(() => {
    setState('idle')
  }, [])

  return [state, { interrupt }] as const
}
