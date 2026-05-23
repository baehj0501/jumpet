import type { BrowserWindow } from 'electron'
import { clampToWorkArea, getWorkAreaForWindow } from './geometry'
import { reduceLinkBarState, type LinkBarEvent, type LinkBarState } from './linkBarState'
import { readLinkBarState, writeLinkBarState } from './store'

// linkBar 윈도우 ref — setupLinkBar가 createLinkBarWindow 호출 직후 주입한다.
// 모듈 ref인 이유: applyLinkBarEvent가 외부(메뉴 콜백 등)에서 호출될 때 윈도우 ref를 인자로
// 매번 받지 않게 한다. 윈도우는 앱 lifecycle 동안 1개로 고정이라 모듈 ref가 단순.
let linkBarWindowRef: BrowserWindow | null = null

// 윈도우의 첫 ready-to-show 이후 true. show()를 그 이전에 호출하면 빈 창/깜빡임이 발생할 수 있어
// 사용자 토글이 ready-to-show 이전에 들어와도 즉시 show하지 않고 ready 후 syncVisibility가 처리한다.
let isWindowReady = false

export const setLinkBarWindow = (window: BrowserWindow): void => {
    linkBarWindowRef = window
    isWindowReady = false

    window.on('closed', () => {
        linkBarWindowRef = null
        isWindowReady = false
    })

    // ready-to-show 이후로는 show가 안전. 현재 state.visible과 윈도우 상태를 한 번 동기화한다 —
    // 사용자가 ready 전에 토글로 ON했더라도 여기서 정상 show된다.
    window.once('ready-to-show', () => {
        isWindowReady = true
        syncVisibility()
    })
}

// 현재 state.visible과 실제 윈도우의 isVisible()을 동기화한다.
// applyLinkBarEvent의 visibility 부수효과 + ready-to-show 시점의 초기 동기화 양쪽에서 호출된다.
// isWindowReady가 false면 (contents 로드 전) no-op — ready 시점에 자동으로 다시 호출된다.
const syncVisibility = (): void => {
    if (!isWindowReady || !linkBarWindowRef || linkBarWindowRef.isDestroyed()) {
        return
    }
    const { visible } = readLinkBarState()
    if (visible && !linkBarWindowRef.isVisible()) {
        linkBarWindowRef.show()
    } else if (!visible && linkBarWindowRef.isVisible()) {
        linkBarWindowRef.hide()
    }
}

// 미니 버튼 창 높이 계산용 상수.
// LinkMiniButton.styles.ts의 LINK_MINI_BUTTON_HEIGHT와 LinkBarPage.styles.ts의 핸들/패딩 값을 그대로 따라간다.
// 양쪽 모두 main/renderer를 가로지르지 않는 작은 상수이므로 main에 사본을 둔다 — 변경 시 두 곳을 같이 손봐야 한다.
const HANDLE_HEIGHT = 16
const LIST_PADDING_TOP = 4
const LIST_PADDING_BOTTOM = 8
const ITEM_HEIGHT = 36
const ITEM_GAP = 6
// 0개일 때 카드 자체는 작게 — 핸들 + 약간의 여유.
const EMPTY_STATE_PADDING = 12

const computeBarHeight = (linkCount: number): number => {
    if (linkCount === 0) {
        return HANDLE_HEIGHT + EMPTY_STATE_PADDING * 2
    }
    const itemsTotal = ITEM_HEIGHT * linkCount + ITEM_GAP * Math.max(linkCount - 1, 0)
    return HANDLE_HEIGHT + LIST_PADDING_TOP + itemsTotal + LIST_PADDING_BOTTOM
}

// 링크 개수에 맞춰 윈도우 높이를 조정한다.
// link 도메인의 onLinksChanged 콜백으로 트리거되고, setup에서 초기에도 한 번 호출된다.
// 너비는 그대로, 높이는 새 목표값.
//
// 단순 setSize면 창이 화면 하단 근처일 때 높이가 늘어나면서 일부가 화면 밖으로 밀린다.
// → setBounds로 (x, y, width, targetHeight)를 한 번에 적용하고, 새 height 기준으로
//   workArea 안에 들어오도록 y를 clamp한다.
export const adjustLinkBarHeight = (linkCount: number): void => {
    if (!linkBarWindowRef || linkBarWindowRef.isDestroyed()) {
        return
    }
    const targetHeight = computeBarHeight(linkCount)
    const [width, currentHeight] = linkBarWindowRef.getSize()
    if (currentHeight === targetHeight) {
        return
    }
    const [x, y] = linkBarWindowRef.getPosition()
    const workArea = getWorkAreaForWindow(linkBarWindowRef)
    const clamped = clampToWorkArea({ x, y, width, height: targetHeight }, workArea)
    linkBarWindowRef.setBounds({
        x: clamped.x,
        y: clamped.y,
        width,
        height: targetHeight,
    })
}

// 영속화 + 윈도우 show/hide 부수효과를 한 함수에 응집.
// 호출자(메뉴 콜백, 'moved' 핸들러 등)는 의미 단위 이벤트만 발신한다.
export const applyLinkBarEvent = (event: LinkBarEvent): LinkBarState => {
    const before = readLinkBarState()
    const next = reduceLinkBarState(before, event)
    if (next === before) {
        return before
    }
    writeLinkBarState(next)

    // visibility 변화 시 윈도우 표시를 동기화.
    // ready-to-show 이전이면 syncVisibility가 no-op이고, ready 시점에 자동으로 다시 호출된다.
    // 위치 변화는 사용자 드래그 결과라 윈도우에 다시 setPosition할 필요 없음.
    if (before.visible !== next.visible) {
        syncVisibility()
    }

    return next
}
