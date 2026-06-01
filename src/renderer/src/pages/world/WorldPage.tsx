import { useRef } from 'react'
import { findDecor, usePlacedItems, useWorldActions, useWorldMode } from '@renderer/entities/world'

// 데스크탑 하단 월드 — 배치된 데코를 렌더한다.
// fixed: 고정(창 자체가 클릭 통과 — main이 setIgnoreMouseEvents). edit: 드래그 이동 / 우클릭 회수.
// x/y는 0~1 비율 → 창 크기가 달라도 같은 자리에 놓인다.
export const WorldPage = () => {
    const placed = usePlacedItems()
    const mode = useWorldMode()
    const { move, recall } = useWorldActions()

    const stageRef = useRef<HTMLDivElement | null>(null)
    const draggingRef = useRef<string | null>(null)

    const editing = mode === 'edit'

    const updatePosition = (clientX: number, clientY: number) => {
        const instanceId = draggingRef.current
        const stage = stageRef.current
        if (!instanceId || !stage) {
            return
        }
        const rect = stage.getBoundingClientRect()
        const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
        const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
        void move(instanceId, x, y)
    }

    return (
        <div
            ref={stageRef}
            className={editing ? 'world-stage editing' : 'world-stage'}
            onPointerMove={(event) => {
                if (draggingRef.current) {
                    updatePosition(event.clientX, event.clientY)
                }
            }}
            onPointerUp={() => {
                draggingRef.current = null
            }}
            onPointerLeave={() => {
                draggingRef.current = null
            }}
        >
            {placed.map((item) => {
                const decor = findDecor(item.itemId)
                if (!decor) {
                    return null
                }
                return (
                    <span
                        key={item.instanceId}
                        className='world-item'
                        style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%` }}
                        onPointerDown={(event) => {
                            if (!editing) {
                                return
                            }
                            event.preventDefault()
                            draggingRef.current = item.instanceId
                        }}
                        onContextMenu={(event) => {
                            if (!editing) {
                                return
                            }
                            // 꾸미기 모드에서 우클릭 → 보관함으로 회수.
                            event.preventDefault()
                            void recall(item.instanceId)
                        }}
                    >
                        <img
                            src={decor.src}
                            alt={decor.name}
                            draggable={false}
                        />
                    </span>
                )
            })}
        </div>
    )
}
