import type { MouseEvent } from 'react'

// 드래그 lifecycle을 호출자에게 통지하는 콜백.
// 자율 행동 정지, 메뉴 닫힘, 인터랙션 ref 토글 등 hook 외부 부수효과는 모두 호출자가 결정한다.
// hook은 드래그 자체("윈도우 위치를 따라가게 한다")만 책임진다 — 관심사 분리.
type UseWindowDragOptions = {
    onDragStart?: () => void
    onDragEnd?: () => void
    // 거의 움직이지 않고 눌렀다 뗀 경우(드래그가 아닌 단순 클릭)에 호출된다.
    onClick?: () => void
}

// 이 거리(px) 이상 움직이면 드래그로 간주한다. 미만이면 클릭.
const DRAG_THRESHOLD_PX = 4

// 윈도우 자체를 드래그로 옮기는 기능.
// mousedown만 React에서 받고, mousemove/mouseup은 window 레벨에 등록해
// 마우스가 작은 펫 윈도우 밖으로 나가도 드래그가 끊기지 않게 한다.
// IPC는 fire-and-forget(send) + requestAnimationFrame throttle 조합이다.
export const useWindowDrag = ({ onDragStart, onDragEnd, onClick }: UseWindowDragOptions = {}) => {
    const handleMouseDown = (event: MouseEvent) => {
        if (event.button !== 0) {
            return
        }

        onDragStart?.()

        window.api.startWindowDrag(event.screenX, event.screenY)

        const startScreenX = event.screenX
        const startScreenY = event.screenY
        let moved = false
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
            if (
                !moved &&
                (Math.abs(moveEvent.screenX - startScreenX) > DRAG_THRESHOLD_PX ||
                    Math.abs(moveEvent.screenY - startScreenY) > DRAG_THRESHOLD_PX)
            ) {
                moved = true
            }
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
            onDragEnd?.()
            // 거의 안 움직였으면 단순 클릭으로 간주.
            if (!moved) {
                onClick?.()
            }
        }

        // mousemove/mouseup은 preventDefault를 호출하지 않으므로 passive로 표시.
        // 메인 스레드 부담을 줄이고 컴포지터에서 조기 처리할 수 있게 한다.
        window.addEventListener('mousemove', handleMove, { passive: true })
        window.addEventListener('mouseup', handleUp, { passive: true })
    }

    return { handleMouseDown }
}
