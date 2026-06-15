import { BrowserWindow } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

// 싱글톤 ref. 우클릭을 다시 해도 새 창을 만들지 않고 기존 창에 포커스한다.
let menuWindow: BrowserWindow | null = null

// 꾸미기 모드 중에는 전체화면 데코 창 위로 메뉴를 띄워 메뉴 클릭이 가려지지 않게 한다.
export const setMenuPanelOnTop = (flag: boolean): void => {
    if (menuWindow && !menuWindow.isDestroyed()) {
        menuWindow.setAlwaysOnTop(flag)
    }
}

// 통합 메뉴 창을 연다(우클릭 진입점). 네이티브 드롭다운을 대체하는 탭형 창.
// frameless — 자체 픽셀 타이틀바(-webkit-app-region:drag)로 이동/닫기를 처리한다.
export const openMenuPanel = () => {
    if (menuWindow && !menuWindow.isDestroyed()) {
        if (menuWindow.isMinimized()) {
            menuWindow.restore()
        }
        menuWindow.focus()
        return
    }

    menuWindow = new BrowserWindow({
        width: 360,
        height: 560,
        minWidth: 320,
        minHeight: 460,
        frame: false,
        resizable: true,
        title: '루프프 데스크메이트',
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
            partition: 'persist:menu',
            // 창이 다른 창에 가려져도(occluded) 타이머(setInterval)가 throttle/중지되지 않게 한다.
            // 포모도로 타이머가 백그라운드에서도 계속 돌아야 하므로 필수.
            backgroundThrottling: false,
        },
    })

    menuWindow.on('closed', () => {
        menuWindow = null
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        menuWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/menu.html`)
    } else {
        menuWindow.loadFile(join(__dirname, '../renderer/menu.html'))
    }
}
