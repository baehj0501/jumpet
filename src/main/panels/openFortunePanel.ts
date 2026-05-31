import { BrowserWindow } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

// 싱글톤 ref. 메뉴를 다시 클릭하면 새 창을 만들지 않고 기존 창에 포커스한다.
let fortuneWindow: BrowserWindow | null = null

// 운세 팝업 별창을 연다. 이미 떠 있으면 복원 후 포커스만 옮긴다.
export const openFortunePanel = () => {
    if (fortuneWindow && !fortuneWindow.isDestroyed()) {
        if (fortuneWindow.isMinimized()) {
            fortuneWindow.restore()
        }
        fortuneWindow.focus()
        return
    }

    fortuneWindow = new BrowserWindow({
        width: 340,
        height: 320,
        resizable: false,
        title: '오늘의 운세',
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
            // 펫 윈도우와 origin 격리.
            partition: 'persist:fortune',
        },
    })

    fortuneWindow.on('closed', () => {
        fortuneWindow = null
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        fortuneWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/fortune.html`)
    } else {
        fortuneWindow.loadFile(join(__dirname, '../renderer/fortune.html'))
    }
}
