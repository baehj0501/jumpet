import { app, shell, BrowserWindow, ipcMain, Menu, screen } from 'electron'
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
    width: 300,
    height: 300,
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

  // 자율 이동(walking 등) 용 절대 좌표 이동.
  // 드래그용 dragTo와 분리해 두는 이유: dragTo는 dragOrigin 기반 델타 계산이고,
  // 자율 이동은 매 프레임 절대 좌표로 갱신하는 게 자연스럽기 때문.
  ipcMain.on('window:moveTo', (event, x: number, y: number) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) {
      return
    }
    win.setPosition(Math.round(x), Math.round(y))
  })

  ipcMain.handle('window:getBounds', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) {
      return null
    }
    const [x, y] = win.getPosition()
    const [width, height] = win.getSize()
    return { x, y, width, height }
  })

  // 강아지가 돌아다닐 수 있는 모니터 영역(메뉴바/독 제외).
  // 다중 모니터에서도 현재 윈도우가 속한 모니터를 기준으로 반환한다.
  ipcMain.handle('window:getDisplayWorkArea', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const targetDisplay = win
      ? screen.getDisplayMatching(win.getBounds())
      : screen.getPrimaryDisplay()
    return targetDisplay.workArea
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
