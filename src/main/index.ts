import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

type DragOrigin = {
  startWinX: number
  startWinY: number
  startMouseX: number
  startMouseY: number
}

// 드래그 시작 시점의 윈도우/마우스 좌표를 main에 캐싱.
// renderer는 이후 mousemove마다 현재 마우스 좌표만 보내고, main이 델타 계산 후 setPosition.
const dragOrigins = new WeakMap<BrowserWindow, DragOrigin>()

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 200,
    height: 200,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.center()

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.rapportlabs.game')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('window:startDrag', (event, mouseX: number, mouseY: number) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) {
      return
    }
    const [winX, winY] = win.getPosition()
    dragOrigins.set(win, {
      startWinX: winX,
      startWinY: winY,
      startMouseX: mouseX,
      startMouseY: mouseY
    })
  })

  ipcMain.on('window:dragTo', (event, mouseX: number, mouseY: number) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) {
      return
    }
    const origin = dragOrigins.get(win)
    if (!origin) {
      return
    }
    const nextX = origin.startWinX + (mouseX - origin.startMouseX)
    const nextY = origin.startWinY + (mouseY - origin.startMouseY)
    win.setPosition(Math.round(nextX), Math.round(nextY))
  })

  ipcMain.on('window:endDrag', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) {
      return
    }
    dragOrigins.delete(win)
  })

  ipcMain.on('window:showContextMenu', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) {
      return
    }
    const menu = Menu.buildFromTemplate([
      { label: '종료', click: () => app.quit() }
    ])
    menu.popup({ window: win })
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
