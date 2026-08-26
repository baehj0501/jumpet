import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

// 유튜브 뷰어 우클릭 메뉴 팝업 — 별도 창이라 뷰어가 아무리 작아도 메뉴가 잘리지 않는다.
// 커스텀(썸네일) 메뉴를 유지하려고 youtube.html?menu=1 을 재사용해 렌더한다. 싱글톤.
let menuWindow: BrowserWindow | null = null

const MENU_W = 200
const MENU_H = 360

export const closeYoutubeMenuPanel = (): void => {
    if (menuWindow && !menuWindow.isDestroyed()) {
        menuWindow.close()
    }
    menuWindow = null
}

type MenuState = {
    theme: number
    sizeStep: number
    alwaysOnTop: boolean
    sizeCount: number
}

export const openYoutubeMenuPanel = (state: MenuState): void => {
    closeYoutubeMenuPanel()

    // 커서 위치에 띄우되 화면 작업영역 밖으로 나가지 않게 보정.
    const cursor = screen.getCursorScreenPoint()
    const area = screen.getDisplayNearestPoint(cursor).workArea
    const x = Math.min(cursor.x, area.x + area.width - MENU_W)
    const y = Math.min(cursor.y, area.y + area.height - MENU_H)

    menuWindow = new BrowserWindow({
        width: MENU_W,
        height: MENU_H,
        x: Math.max(area.x, x),
        y: Math.max(area.y, y),
        show: false,
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        hasShadow: false,
        skipTaskbar: true,
        fullscreenable: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
            partition: 'persist:youtube',
        },
    })

    menuWindow.on('closed', () => {
        menuWindow = null
    })
    // 바깥 클릭(포커스 상실) 시 닫되, '뜨자마자' 닫히는 것을 막는다.
    // Windows에선 항상-위 뷰어 위에 팝업을 띄우면 포커스가 뷰어로 되돌아가며 즉시 blur가 나
    // 메뉴가 안 뜬 것처럼 보였다. 팝업이 자리잡은 뒤(약간의 지연)부터 바깥클릭-닫기를 활성화한다.
    let closeOnBlur = false
    menuWindow.on('blur', () => {
        if (closeOnBlur) {
            closeYoutubeMenuPanel()
        }
    })
    // 유튜브 뷰어가 '항상 위'(기본값)면 팝업이 그 뒤로 가려질 수 있다. 뷰어보다 높은 레벨로 올려
    // 항상 앞에 뜨게 한다.
    menuWindow.setAlwaysOnTop(true, 'pop-up-menu')
    menuWindow.on('ready-to-show', () => {
        menuWindow?.show()
        menuWindow?.focus()
        menuWindow?.moveTop()
        setTimeout(() => {
            closeOnBlur = true
        }, 300)
    })

    const params = new URLSearchParams({
        menu: '1',
        theme: String(state.theme),
        size: String(state.sizeStep),
        aot: state.alwaysOnTop ? '1' : '0',
        sizeCount: String(state.sizeCount),
    })
    const query = `?${params.toString()}`
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        menuWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/youtube.html${query}`)
    } else {
        menuWindow.loadFile(join(__dirname, '../renderer/youtube.html'), {
            search: query.slice(1),
        })
    }
}
