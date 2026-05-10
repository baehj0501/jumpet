import { useEffect, useRef, useState } from 'react'
import dogImage from '@renderer/assets/dog.jpeg'

type CharacterState = 'idle' | 'walking'

// 상태 전환 검토 주기.
const STATE_TICK_INTERVAL_MS = 2000
// walking 중 윈도우 위치 갱신 주기 (~30 FPS).
const WALK_FRAME_INTERVAL_MS = 33
// walking 속도 (px / 초).
const WALK_SPEED_PX_PER_SEC = 60
// 매 tick에서 idle → walking으로 넘어갈 확률.
const WALK_START_PROBABILITY = 0.3
// 매 tick에서 walking → idle로 멈출 확률.
const WALK_STOP_PROBABILITY = 0.4

export const App = () => {
  const [characterState, setCharacterState] = useState<CharacterState>('idle')
  // 드래그 중에는 자율 이동을 멈춰야 윈도우가 흔들리지 않음.
  // setState로 즉시 반영되지 않을 수 있으니 ref로도 같이 추적.
  const isDraggingRef = useRef(false)

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isDraggingRef.current) {
        return
      }
      setCharacterState((prev) => {
        if (prev === 'idle') {
          return Math.random() < WALK_START_PROBABILITY ? 'walking' : 'idle'
        }
        return Math.random() < WALK_STOP_PROBABILITY ? 'idle' : 'walking'
      })
    }, STATE_TICK_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (characterState !== 'walking') {
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
  }, [characterState])

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0) {
      return
    }

    isDraggingRef.current = true
    setCharacterState('idle')

    window.api.startWindowDrag(event.screenX, event.screenY)

    let pendingPosition: { x: number; y: number } | null = null
    let rafId: number | null = null

    const flushDrag = () => {
      rafId = null
      if (!pendingPosition) {
        return
      }
      window.api.dragWindowTo(pendingPosition.x, pendingPosition.y)
      pendingPosition = null
    }

    const handleMove = (moveEvent: MouseEvent) => {
      pendingPosition = { x: moveEvent.screenX, y: moveEvent.screenY }
      if (rafId === null) {
        rafId = requestAnimationFrame(flushDrag)
      }
    }

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      if (pendingPosition) {
        window.api.dragWindowTo(pendingPosition.x, pendingPosition.y)
        pendingPosition = null
      }
      window.api.endWindowDrag()
      isDraggingRef.current = false
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    window.api.showContextMenu()
  }

  return (
    <div
      className="pet"
      data-state={characterState}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <img src={dogImage} alt="강아지" draggable={false} />
    </div>
  )
}
