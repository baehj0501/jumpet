import { useLayoutEffect, useRef, useState } from 'react'
import { findDecor, usePlacedItems, useWorldActions, useWorldMode } from '@renderer/entities/world'

// 데스크탑 하단 월드 — 배치된 데코를 렌더한다.
// fixed: 고정(창 자체가 클릭 통과 — main이 setIgnoreMouseEvents). edit: 드래그 이동 / 우클릭 회수.
// x/y는 0~1 비율 → 창 크기가 달라도 같은 자리에 놓인다.
//
// [고정 모드 창 축소] 전체화면 투명 창은 일부 Windows에서 투명 합성에 실패해 흰색으로 굳어
// 바탕화면을 통째로 덮는다(작은 투명 창인 캐릭터·펫은 정상). 그래서 고정 모드에선 오버레이 창을
// '데코가 놓인 영역'만큼만 축소해 작은 투명 창으로 만든다. 이때 스테이지는 화면 전체 px 크기를
// 유지하고 origin만큼 음수 오프셋으로 밀어, 비율 좌표(x*화면폭)가 그대로 화면 위 같은 자리에 오게 한다.
const SCREEN_W = window.screen.width
const SCREEN_H = window.screen.height
const OVERLAY_PADDING = 8

export const WorldPage = () => {
    const placed = usePlacedItems()
    const mode = useWorldMode()
    const { move, recall } = useWorldActions()

    const stageRef = useRef<HTMLDivElement | null>(null)
    const draggingRef = useRef<string | null>(null)
    // 고정 모드에서 축소된 창의 좌상단(화면 px). null이면 전체화면(편집 모드/데코 없음).
    const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
    // 데코 이미지 로드 후 크기가 확정되면 bbox를 다시 계산하도록 하는 트리거.
    const [loadTick, setLoadTick] = useState(0)
    // 모드 전환(고정↔편집) 순간, 창 리사이즈(main)와 데코 재배치(renderer)가 프로세스 간 시차로
    // 어긋나 데코가 잠깐 이동했다 제자리로 오는 지터가 보인다. 전환 직후 잠깐 스테이지를 숨겨(opacity 0)
    // 그 리플로우를 가리고, 정착되면 부드럽게 다시 보이게 한다. (CSS opacity는 투명 창에서도 정상 동작 —
    // main의 BrowserWindow.setOpacity는 transparent 창에서 무효라 렌더러 측에서 처리한다.)
    const [settling, setSettling] = useState(false)
    const previousModeRef = useRef(mode)

    const editing = mode === 'edit'

    // useLayoutEffect로 두어 전환 직후 첫 페인트 '전에' opacity 0을 적용한다(지터 프레임 유출 방지).
    useLayoutEffect(() => {
        if (previousModeRef.current === mode) {
            return
        }
        previousModeRef.current = mode
        setSettling(true)
        const timeoutId = setTimeout(() => setSettling(false), 260)
        return () => clearTimeout(timeoutId)
    }, [mode])

    // 배치/모드/이미지로드가 바뀔 때마다 오버레이 창 크기를 갱신한다.
    useLayoutEffect(() => {
        const worldApi = window.api?.world
        // 편집 모드이거나 데코가 없으면 전체화면으로 되돌린다(어디에나 배치 가능해야 하므로).
        if (editing || placed.length === 0) {
            if (origin !== null) {
                setOrigin(null)
            }
            worldApi?.setOverlayBounds(null)
            return
        }
        const stage = stageRef.current
        if (!stage) {
            return
        }
        // 데코가 놓인 영역의 화면 px bbox = 각 아이템 중심(비율×화면) ± 렌더된 절반 크기의 합집합.
        const elements = stage.querySelectorAll<HTMLElement>('.world-item')
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        placed.forEach((item, index) => {
            const element = elements[index]
            const rect = element?.getBoundingClientRect()
            const halfWidth = rect ? rect.width / 2 : 0
            const halfHeight = rect ? rect.height / 2 : 0
            const centerX = item.x * SCREEN_W
            const centerY = item.y * SCREEN_H
            minX = Math.min(minX, centerX - halfWidth)
            maxX = Math.max(maxX, centerX + halfWidth)
            minY = Math.min(minY, centerY - halfHeight)
            maxY = Math.max(maxY, centerY + halfHeight)
        })
        if (!Number.isFinite(minX)) {
            return
        }
        const x = Math.max(0, Math.floor(minX - OVERLAY_PADDING))
        const y = Math.max(0, Math.floor(minY - OVERLAY_PADDING))
        const width = Math.min(SCREEN_W - x, Math.ceil(maxX + OVERLAY_PADDING) - x)
        const height = Math.min(SCREEN_H - y, Math.ceil(maxY + OVERLAY_PADDING) - y)
        worldApi?.setOverlayBounds({ x, y, w: width, h: height })
        setOrigin((previous) =>
            previous && previous.x === x && previous.y === y ? previous : { x, y },
        )
    }, [placed, editing, loadTick])

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

    // 고정 모드 + 데코가 있을 때만 창을 축소하므로, 스테이지를 화면 전체 크기로 유지하고 오프셋한다.
    const positionStyle =
        !editing && placed.length > 0 && origin
            ? {
                  position: 'absolute' as const,
                  width: SCREEN_W,
                  height: SCREEN_H,
                  left: -origin.x,
                  top: -origin.y,
              }
            : {}
    // 전환 중엔 즉시 숨기고(지터 은폐), 정착되면 부드럽게 나타난다.
    const stageStyle = {
        ...positionStyle,
        opacity: settling ? 0 : 1,
        transition: settling ? 'none' : 'opacity 150ms ease',
    }

    return (
        <div
            ref={stageRef}
            className={editing ? 'world-stage editing' : 'world-stage'}
            style={stageStyle}
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
                            onLoad={() => setLoadTick((tick) => tick + 1)}
                        />
                    </span>
                )
            })}
        </div>
    )
}
