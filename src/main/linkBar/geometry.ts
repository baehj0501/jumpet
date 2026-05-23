// 미니 버튼 창의 위치/크기 계산 헬퍼.
// createLinkBarWindow(초기 위치 결정), ipc.adjustLinkBarHeight(setSize 시 y 보정)에서 공유한다.
//
// "workArea 밖으로 창이 밀려나면 사용자 눈에 안 보임"이라는 동일 risk를 다음 경로에서 모두 방어한다:
//   1) 저장된 position 복원 — 모니터 구성이 바뀌어 이전 좌표가 무효일 수 있음
//   2) 높이 동적 조정 — 창이 화면 하단 근처일 때 height 증가로 일부가 화면 밖으로 밀릴 수 있음
//   3) computeInitialPosition default — 캐릭터가 화면 가장자리에 있을 때

import { screen, type BrowserWindow } from 'electron'

export type Rect = {
    x: number
    y: number
    width: number
    height: number
}

// 윈도우가 위치한 모니터의 workArea(메뉴바·독·태스크바 제외)를 반환한다.
// 윈도우 좌표가 어떤 디스플레이에도 속하지 않으면 가장 가까운 디스플레이를 사용한다.
export const getWorkAreaForWindow = (window: BrowserWindow) => {
    return screen.getDisplayMatching(window.getBounds()).workArea
}

// (x, y) 좌표가 어떤 디스플레이에도 속하지 않을 가능성을 대비.
// 가장 가까운 디스플레이의 workArea를 반환 — 모니터가 빠진 좌표를 받아도 어딘가 한 모니터로 끌어들인다.
export const getWorkAreaNearestPoint = (point: { x: number; y: number }) => {
    return screen.getDisplayNearestPoint(point).workArea
}

// 주어진 bounds를 workArea 안으로 clamp한 (x, y)를 반환.
// width/height는 그대로 유지 — 창 자체 크기는 변경 X.
// 창이 workArea보다 클 수도 있는데, 그 경우 좌상단을 workArea의 좌상단에 붙인다(우/하단은 잘림).
export const clampToWorkArea = (bounds: Rect, workArea: Rect): { x: number; y: number } => {
    let { x, y } = bounds

    // 우측 한계
    if (x + bounds.width > workArea.x + workArea.width) {
        x = workArea.x + workArea.width - bounds.width
    }
    // 좌측 한계
    if (x < workArea.x) {
        x = workArea.x
    }
    // 하단 한계
    if (y + bounds.height > workArea.y + workArea.height) {
        y = workArea.y + workArea.height - bounds.height
    }
    // 상단 한계
    if (y < workArea.y) {
        y = workArea.y
    }

    return { x, y }
}
