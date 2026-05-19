import { BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

// 싱글톤 ref. 메뉴를 다시 클릭하면 새 창을 만들지 않고 기존 창에 포커스한다.
let todoWindow: BrowserWindow | null = null

// TODO 패널 윈도우를 연다. 이미 떠 있으면 복원 후 포커스만 옮긴다.
export const openTodoPanel = () => {
    if (todoWindow && !todoWindow.isDestroyed()) {
        if (todoWindow.isMinimized()) {
            todoWindow.restore()
        }
        todoWindow.focus()
        return
    }

    todoWindow = new BrowserWindow({
        width: 360,
        height: 520,
        minWidth: 320,
        minHeight: 400,
        title: '할 일',
        autoHideMenuBar: true,
        // 펫의 transparent/alwaysOnTop/focusable/skipTaskbar는 일반 앱 UX에 부적합 → 기본값 사용.
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
            // 펫 윈도우와 origin 격리. file:// 스킴의 storage 공유 동작 모호성을 회피.
            partition: 'persist:todo',
        },
    })

    todoWindow.on('closed', () => {
        todoWindow = null
    })

    // 사용자가 todo 텍스트의 링크를 클릭하면 OS 브라우저로 연다 (펫과 동일 정책).
    todoWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        todoWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/todo.html`)
    } else {
        todoWindow.loadFile(join(__dirname, '../renderer/todo.html'))
    }
}
