import { BrowserWindow, ipcMain, screen } from 'electron'

type DragOrigin = {
    startWinX: number
    startWinY: number
    startMouseX: number
    startMouseY: number
}

// 드래그 시작 시점의 윈도우/마우스 좌표를 main에 캐싱.
// renderer는 이후 mousemove마다 현재 마우스 좌표만 보내고, main이 델타 계산 후 setPosition.
const dragOrigins = new WeakMap<BrowserWindow, DragOrigin>()

// window 도메인의 IPC 핸들러를 한 번에 등록.
// 창 위치/크기 조작과 모니터 영역 조회가 같은 모듈에 응집한다.
export const registerWindowIpc = (): void => {
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
            startMouseY: mouseY,
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

    // 캐릭터 크기(petScale) 반영용 — 창 크기를 바꾸되 현재 중심을 고정해 제자리에서 커지게 한다.
    // resizable:false 창도 프로그램적 setBounds는 동작한다.
    ipcMain.on('window:setSize', (event, width: number, height: number) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) {
            return
        }
        const [currentX, currentY] = win.getPosition()
        const [currentWidth, currentHeight] = win.getSize()
        const nextWidth = Math.round(width)
        const nextHeight = Math.round(height)
        const nextX = Math.round(currentX + (currentWidth - nextWidth) / 2)
        const nextY = Math.round(currentY + (currentHeight - nextHeight) / 2)
        win.setBounds({ x: nextX, y: nextY, width: nextWidth, height: nextHeight })
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
        if (!win) {
            return screen.getPrimaryDisplay().workArea
        }
        return screen.getDisplayMatching(win.getBounds()).workArea
    })
}
