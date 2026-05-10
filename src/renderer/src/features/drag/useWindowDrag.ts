import type { MouseEvent, RefObject } from 'react'

type UseWindowDragOptions = {
  // 드래그 진행 여부를 외부 hook(useWalking 등)에 전파하기 위한 ref.
  isDraggingRef: RefObject<boolean>
  // 드래그 시작 시 자율 행동을 즉시 멈추는 등의 부수효과를 위한 콜백.
  onDragStart?: () => void
}

// 윈도우 자체를 드래그로 옮기는 기능.
// mousedown만 React에서 받고, mousemove/mouseup은 window 레벨에 등록해
// 마우스가 작은 펫 윈도우 밖으로 나가도 드래그가 끊기지 않게 한다.
// IPC는 fire-and-forget(send) + requestAnimationFrame throttle 조합이다.
export const useWindowDrag = ({ isDraggingRef, onDragStart }: UseWindowDragOptions) => {
  const handleMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) {
      return
    }

    isDraggingRef.current = true
    onDragStart?.()

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

    const handleMove = (moveEvent: globalThis.MouseEvent) => {
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
      // 마지막 좌표가 아직 flush되지 않았다면 한 번 더 반영.
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

  return { handleMouseDown }
}
