import { useEffect } from 'react'
import type { RefObject } from 'react'
import type { CharacterState } from '../model/CharacterState'
import { WALK_FRAME_INTERVAL_MS, WALK_SPEED_PX_PER_SEC } from '../model/constants'

// walking 상태 동안 윈도우를 자율 이동시킨다.
// walking 진입 시 랜덤 방향을 정한 뒤, 작업 영역 경계에서 반사된다.
// 드래그 중에는 ref 신호로 이동을 일시 정지한다.
export const useWalking = (state: CharacterState, isDraggingRef: RefObject<boolean>) => {
  useEffect(() => {
    if (state !== 'walking') {
      return
    }

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    void (async () => {
      const [bounds, workArea] = await Promise.all([
        window.api.getWindowBounds(),
        window.api.getDisplayWorkArea()
      ])
      if (cancelled || !bounds) {
        return
      }

      let posX = bounds.x
      let posY = bounds.y
      let headingRad = Math.random() * Math.PI * 2
      let lastTime = performance.now()

      const minX = workArea.x
      const maxX = workArea.x + workArea.width - bounds.width
      const minY = workArea.y
      const maxY = workArea.y + workArea.height - bounds.height

      intervalId = setInterval(() => {
        if (isDraggingRef.current) {
          return
        }
        const now = performance.now()
        const deltaSec = (now - lastTime) / 1000
        lastTime = now

        let nextX = posX + Math.cos(headingRad) * WALK_SPEED_PX_PER_SEC * deltaSec
        let nextY = posY + Math.sin(headingRad) * WALK_SPEED_PX_PER_SEC * deltaSec

        // 작업 영역 경계에 닿으면 해당 축으로 반사.
        if (nextX < minX) {
          nextX = minX
          headingRad = Math.PI - headingRad
        } else if (nextX > maxX) {
          nextX = maxX
          headingRad = Math.PI - headingRad
        }
        if (nextY < minY) {
          nextY = minY
          headingRad = -headingRad
        } else if (nextY > maxY) {
          nextY = maxY
          headingRad = -headingRad
        }

        posX = nextX
        posY = nextY
        window.api.moveWindowTo(posX, posY)
      }, WALK_FRAME_INTERVAL_MS)
    })()

    return () => {
      cancelled = true
      if (intervalId !== null) {
        clearInterval(intervalId)
      }
    }
  }, [state, isDraggingRef])
}
