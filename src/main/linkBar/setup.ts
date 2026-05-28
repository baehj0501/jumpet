import type { BrowserWindow } from 'electron'
import { readLinkState } from '../link'
import { createLinkBarWindow } from './createLinkBarWindow'
import { adjustLinkBarHeight, applyLinkBarEvent, setLinkBarWindow } from './controller'
import { readLinkBarState } from './store'

// 'moved' 이벤트 → setPosition 영속화의 debounce 지연.
// 사용자가 마우스를 뗀 후 이 시간 동안 추가 movement가 없으면 그제서야 디스크에 저장한다.
const MOVED_PERSIST_DEBOUNCE_MS = 200

// 링크 미니 버튼 플로팅 창의 일괄 셋업.
// 호출 시점: app.whenReady에서 캐릭터 윈도우 생성 직후.
// - 영속화된 visibility/position을 읽어 윈도우를 그 상태로 띄운다.
// - 사용자 드래그 후 위치 자동 영속화도 여기서 binding.
// - 윈도우 ref를 controller에 주입해 이후 메뉴 토글 등이 show/hide 부수효과를 실행할 수 있게 한다.
//   (visibility 토글 시 ready-to-show 보장은 setLinkBarWindow 안에서 처리.)
export const setupLinkBar = (characterWindow: BrowserWindow): void => {
    const persisted = readLinkBarState()
    const linkBarWindow = createLinkBarWindow(characterWindow, persisted.position)
    setLinkBarWindow(linkBarWindow)

    // 시작 시점의 링크 개수에 맞춰 카드 높이 적용.
    // createLinkBarWindow는 default 사이즈로 만들어지므로 여기서 한 번 조정.
    adjustLinkBarHeight(readLinkState().links.length)

    // 사용자가 드래그로 옮긴 위치를 자동 영속화.
    //
    // 주의 — 'moved' 이벤트는 OS에 따라 동작이 다름:
    //   * 사용자가 드래그를 끝낸 시점뿐 아니라, useWindowDrag의 매 rAF setPosition 호출 시에도 발화될 수 있다.
    //   * 즉 드래그 중 60Hz로 'moved' 발화 → debounce 없으면 매 프레임 electron-store write가 일어남.
    // debounce(MOVED_PERSIST_DEBOUNCE_MS)로 마지막 movement 후 정적 상태가 되면 1회만 저장한다.
    //
    // 타이머는 윈도우 lifecycle을 넘기지 않도록 closed 이벤트에서 명시적으로 clear.
    // (lifecycle 결합 invariant를 코드 표면에 드러내 ref 누수 회귀를 차단.)
    let positionSaveTimer: NodeJS.Timeout | null = null
    const clearPositionSaveTimer = () => {
        if (positionSaveTimer !== null) {
            clearTimeout(positionSaveTimer)
            positionSaveTimer = null
        }
    }
    linkBarWindow.on('moved', () => {
        if (linkBarWindow.isDestroyed()) {
            return
        }
        clearPositionSaveTimer()
        positionSaveTimer = setTimeout(() => {
            positionSaveTimer = null
            if (linkBarWindow.isDestroyed()) {
                return
            }
            const [x, y] = linkBarWindow.getPosition()
            applyLinkBarEvent({ type: 'setPosition', x, y })
        }, MOVED_PERSIST_DEBOUNCE_MS)
    })
    linkBarWindow.on('closed', clearPositionSaveTimer)

    // 초기 visibility 적용은 setLinkBarWindow의 ready-to-show 핸들러가 syncVisibility로 처리한다.
    // (이 시점에 별도 show() 호출이 필요 없음.)
}
