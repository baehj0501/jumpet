// 미니 버튼 창의 *컨트롤러* — 윈도우 ref 단일 보유 + visibility/높이 부수효과 + applyEvent 진입점.
// ipcMain 등록은 없다 (window 토글은 우클릭 메뉴 콜백으로, link state 동기화는 link/ipc.ts).
// 자매 도메인의 ipc.ts와 달리 이 모듈은 'controller'로 명명해 책임을 명확히 드러낸다.

import type { BrowserWindow } from 'electron'
import { computeLinkBarHeight } from '@shared/contracts/linkBarLayout'
import { clampToWorkArea, getWorkAreaForWindow } from './geometry'
import { reduceLinkBarState, type LinkBarEvent, type LinkBarState } from './linkBarState'
import { readLinkBarState, writeLinkBarState } from './store'

// 윈도우 ref + ready 상태를 한 객체로 묶어 "윈도우 lifecycle = ready 상태 lifecycle" invariant를
// 코드 구조로 표현한다 — ref 갈아끼울 때 ready 리셋 누락이 구조적으로 불가능.
type LinkBarWindowEntry = {
    window: BrowserWindow
    // 첫 ready-to-show 이후 true. show()를 그 이전에 호출하면 빈 창/깜빡임이 발생할 수 있어
    // 사용자 토글이 ready 이전에 들어와도 즉시 show하지 않고 ready 후 syncVisibility가 처리한다.
    isReady: boolean
}

let entry: LinkBarWindowEntry | null = null

export const setLinkBarWindow = (window: BrowserWindow): void => {
    entry = { window, isReady: false }

    window.on('closed', () => {
        // 다른 윈도우로 entry가 교체되었을 가능성을 방어 — closed가 늦게 도착해도 새 entry를 지우지 않는다.
        if (entry && entry.window === window) {
            entry = null
        }
    })

    // ready-to-show 이후로는 show가 안전. 현재 state.visible과 윈도우 상태를 한 번 동기화 —
    // 사용자가 ready 전에 토글로 ON했더라도 여기서 정상 show된다.
    window.once('ready-to-show', () => {
        if (entry && entry.window === window) {
            entry.isReady = true
            syncVisibility(readLinkBarState().visible)
        }
    })
}

// 다음 visible 의도와 실제 윈도우의 isVisible()을 동기화한다.
// applyLinkBarEvent의 visibility 부수효과 + ready-to-show 시점의 초기 동기화 양쪽에서 호출된다.
// isReady=false면 (contents 로드 전) no-op — ready 시점에 자동으로 다시 호출된다.
//
// visible 인자를 받는 이유: applyLinkBarEvent가 writeLinkBarState 직후 호출되는 hot path에서
// 디스크 read를 중복하지 않도록 next state의 값을 그대로 전달.
const syncVisibility = (visible: boolean): void => {
    if (!entry || !entry.isReady || entry.window.isDestroyed()) {
        return
    }
    const { window } = entry
    if (visible && !window.isVisible()) {
        window.show()
    } else if (!visible && window.isVisible()) {
        window.hide()
    }
}

// 링크 개수에 맞춰 윈도우 높이를 조정한다.
// link 도메인의 onLinksChanged 콜백으로 트리거되고, setup에서 초기에도 한 번 호출된다.
// 너비는 그대로, 높이는 새 목표값.
//
// 단순 setSize면 창이 화면 하단 근처일 때 높이가 늘어나면서 일부가 화면 밖으로 밀린다.
// → setBounds로 (x, y, width, targetHeight)를 한 번에 적용하고, 새 height 기준으로
//   workArea 안에 들어오도록 y를 clamp한다.
export const adjustLinkBarHeight = (linkCount: number): void => {
    if (!entry || entry.window.isDestroyed()) {
        return
    }
    const { window } = entry
    const targetHeight = computeLinkBarHeight(linkCount)
    const [width, currentHeight] = window.getSize()
    if (currentHeight === targetHeight) {
        return
    }
    const [x, y] = window.getPosition()
    const workArea = getWorkAreaForWindow(window)
    const clamped = clampToWorkArea({ x, y, width, height: targetHeight }, workArea)
    window.setBounds({
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
        syncVisibility(next.visible)
    }

    return next
}
