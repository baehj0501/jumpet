import dogImage from '@renderer/assets/dog.jpeg'

export const App = () => {
  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0) {
      return
    }

    // 시작 시점의 마우스 화면 좌표를 main에 전달.
    // 이후 main이 자체적으로 윈도우 시작 좌표를 기억하므로 await가 필요 없음.
    window.api.startWindowDrag(event.screenX, event.screenY)

    // window 레벨에서 mousemove/mouseup을 받아야 마우스가 작은 펫 윈도우 밖으로
    // 빠르게 빠져나가도 드래그가 끊기지 않는다.
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
      // mousemove는 1프레임에 여러 번 발생할 수 있으므로 rAF로 묶어
      // 디스플레이 리프레시 주기에 맞춰 한 번만 IPC를 보낸다.
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
      // 이동 중 마지막 좌표가 아직 flush되지 않았다면 한 번 더 반영.
      if (pendingPosition) {
        window.api.dragWindowTo(pendingPosition.x, pendingPosition.y)
        pendingPosition = null
      }
      window.api.endWindowDrag()
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    window.api.showContextMenu()
  }

  return (
    <div className="pet" onMouseDown={handleMouseDown} onContextMenu={handleContextMenu}>
      <img src={dogImage} alt="강아지" draggable={false} />
    </div>
  )
}
