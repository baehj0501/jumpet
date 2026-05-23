import { BrowserWindow, screen, shell } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

// 링크 미니 버튼 플로팅 창은 앱 시작 시 캐릭터 윈도우와 함께 1회 생성된다.
// 캐릭터 윈도우와 동일한 *상시 표시* 정책을 따르되, 데이터는 link 도메인 store에서 read-only로 구독.
//
// 위치 결정 (사용자 컨펌 (b)): 시작 시 캐릭터 오른쪽 default. 이후엔 두 창 독립 — 캐릭터가 움직여도 따라가지 않음.
// 위치 영속화는 하지 않으므로 매 시작 시 캐릭터 오른쪽으로 리셋된다.

const LINK_BAR_SIZE = {
    width: 160,
    // 미니 버튼 ~36px × 5개(MAX_LINKS) + 상단 핸들 영역 + 패딩 여유.
    height: 220,
}

// 캐릭터 윈도우와의 시각적 간격 (px).
const GAP_TO_CHARACTER = 10

// 싱글톤 ref. 캐릭터 윈도우와 같은 lifecycle을 가지므로 외부에서 명시적으로 다시 생성할 일은 거의 없지만,
// HMR/맥OS activate 케이스에서 안전하게 동작하도록 노출한다.
let linkBarWindow: BrowserWindow | null = null

// 캐릭터 윈도우 위치 + 크기 + 작업 영역을 종합해 미니 버튼 창의 시작 위치를 정한다.
// 우측 공간이 부족하면 좌측으로 fallback. 하단도 동일하게 clamp.
const computeInitialPosition = (
    characterWindow: BrowserWindow,
): { x: number; y: number } => {
    const [charX, charY] = characterWindow.getPosition()
    const [charWidth] = characterWindow.getSize()
    const workArea = screen.getDisplayMatching(characterWindow.getBounds()).workArea

    let x = charX + charWidth + GAP_TO_CHARACTER
    let y = charY

    // 캐릭터 오른쪽 공간 부족 시 왼쪽으로.
    if (x + LINK_BAR_SIZE.width > workArea.x + workArea.width) {
        x = charX - LINK_BAR_SIZE.width - GAP_TO_CHARACTER
    }

    // workArea 좌측도 넘는 극단적 경우(예: 캐릭터가 좌측 가장자리)는 workArea 안으로 clamp.
    if (x < workArea.x) {
        x = workArea.x
    }

    // 하단 한계.
    if (y + LINK_BAR_SIZE.height > workArea.y + workArea.height) {
        y = workArea.y + workArea.height - LINK_BAR_SIZE.height
    }
    if (y < workArea.y) {
        y = workArea.y
    }

    return { x, y }
}

// 미니 버튼 창 생성.
// 캐릭터 윈도우(`src/main/index.ts`의 createWindow)와 거의 동일한 옵션 — 상시 표시 + frameless + transparent.
// preload는 캐릭터/패널과 공유한다 (window.api.link.* 그대로 사용).
export const createLinkBarWindow = (characterWindow: BrowserWindow): BrowserWindow => {
    if (linkBarWindow && !linkBarWindow.isDestroyed()) {
        linkBarWindow.focus()
        return linkBarWindow
    }

    const { x, y } = computeInitialPosition(characterWindow)

    linkBarWindow = new BrowserWindow({
        x,
        y,
        width: LINK_BAR_SIZE.width,
        height: LINK_BAR_SIZE.height,
        show: false,
        frame: false,
        transparent: true,
        resizable: false,
        hasShadow: false,
        alwaysOnTop: true,
        // 캐릭터 윈도우와 동일 — 미니 버튼 클릭이 뒷창 포커스를 빼앗지 않는다.
        focusable: false,
        fullscreenable: false,
        skipTaskbar: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    // macOS 풀스크린 앱/모든 Space에서도 미니 버튼이 보이도록 캐릭터와 동일 정책 적용.
    linkBarWindow.setAlwaysOnTop(true, 'screen-saver')
    linkBarWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

    linkBarWindow.on('closed', () => {
        linkBarWindow = null
    })

    linkBarWindow.on('ready-to-show', () => {
        linkBarWindow?.show()
    })

    // 패널/캐릭터와 동일 — 새창 요청은 OS 브라우저로 위임.
    linkBarWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        linkBarWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/link-bar.html`)
    } else {
        linkBarWindow.loadFile(join(__dirname, '../renderer/link-bar.html'))
    }

    return linkBarWindow
}
