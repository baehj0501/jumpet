import { useEffect } from 'react'
import type { CharacterState } from '../model/CharacterState'
import { WALK_SPEED_PX_PER_SEC } from '../model/constants'

// 자율 상태 전환 신호를 전달하기 위한 읽기 전용 ref.
// behaviors hook은 신호만 받고, write 권한은 features 계층(드래그 등)에 둔다.
type ReadonlyBooleanRef = { readonly current: boolean }

// walking 상태 동안 윈도우를 자율 이동시킨다.
// walking 진입 시 랜덤 방향을 정한 뒤, 작업 영역 경계에서 반사된다.
// 드래그 중에는 ref 신호로 이동을 일시 정지한다.
export const useWalking = (state: CharacterState, isDraggingRef: ReadonlyBooleanRef) => {
    useEffect(() => {
        if (state !== 'walking') {
            return
        }

        let cancelled = false
        let animationFrameId: number | null = null

        void (async () => {
            const [bounds, workArea] = await Promise.all([
                window.api.getWindowBounds(),
                window.api.getDisplayWorkArea(),
            ])
            if (cancelled || !bounds) {
                return
            }

            let positionX = bounds.x
            let positionY = bounds.y
            let headingRad = Math.random() * Math.PI * 2
            let lastTime = performance.now()

            const minX = workArea.x
            const maxX = workArea.x + workArea.width - bounds.width
            const minY = workArea.y
            const maxY = workArea.y + workArea.height - bounds.height

            const tick = (now: number) => {
                if (cancelled) {
                    return
                }
                // 드래그 중에도 lastTime은 갱신해야 한다.
                // 갱신하지 않으면 드래그 길이만큼 deltaSec가 누적되어
                // 드래그 종료 직후 한 프레임에 큰 점프가 발생함.
                if (isDraggingRef.current) {
                    lastTime = now
                    animationFrameId = requestAnimationFrame(tick)
                    return
                }

                const deltaSec = (now - lastTime) / 1000
                lastTime = now

                let nextX = positionX + Math.cos(headingRad) * WALK_SPEED_PX_PER_SEC * deltaSec
                let nextY = positionY + Math.sin(headingRad) * WALK_SPEED_PX_PER_SEC * deltaSec

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

                positionX = nextX
                positionY = nextY
                window.api.moveWindowTo(positionX, positionY)

                animationFrameId = requestAnimationFrame(tick)
            }

            animationFrameId = requestAnimationFrame(tick)
        })()

        return () => {
            cancelled = true
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId)
            }
        }
        // isDraggingRef는 useRef 결과로 identity가 영구히 stable이므로 deps에 넣지 않는다.
    }, [state])
}
