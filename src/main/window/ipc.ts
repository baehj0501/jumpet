import { BrowserWindow, ipcMain, screen } from 'electron'

type DragOrigin = {
    startWinX: number
    startWinY: number
    startMouseX: number
    startMouseY: number
}

// 드래그 시작 시점의 윈도우/마우스 좌표를 main에 캐싱.
// renderer는 이후 mousemove마다 현재 마우스 좌표만 보내고, main이 델타 계산 후 setBounds.
const dragOrigins = new WeakMap<BrowserWindow, DragOrigin>()

// 창별 '고정 크기'. Windows에선 transparent+frameless 창을 setPosition으로 옮길 때마다
// 창이 ~1px씩 커지는 Electron 버그가 있다(드래그 1회에 setPosition이 수십 번 호출되므로 누적되어
// 캐릭터가 눈에 띄게 커진다). 그래서 이동은 setPosition이 아니라 '크기를 매번 명시하는' setBounds로 하고,
// 그 크기를 여기 고정해 둔다. petScale 반영(window:setSize) 시 이 값을 갱신한다.
const lockedSizes = new WeakMap<BrowserWindow, { width: number; height: number }>()

// 창의 고정 크기를 반환한다. 아직 없으면(=petScale 반영 전) 현재 콘텐츠 크기를 기준으로 잡아 둔다.
// getContentSize를 쓰는 이유: transparent 창은 getSize가 프레임 아티팩트로 1px 부풀 수 있어,
// 콘텐츠(=실제 캐릭터가 채우는 영역) 크기를 기준으로 잡는 게 드리프트가 적다.
const resolveLockedSize = (win: BrowserWindow): { width: number; height: number } => {
    const locked = lockedSizes.get(win)
    if (locked) {
        return locked
    }
    const [width, height] = win.getContentSize()
    const size = { width, height }
    lockedSizes.set(win, size)
    return size
}

// 창을 (x, y)로 옮기되 크기는 고정 크기로 매번 다시 못박는다.
// setPosition을 쓰지 않는 것이 핵심 — 위 lockedSizes 주석의 Windows 버그 회피.
const moveKeepingSize = (win: BrowserWindow, x: number, y: number): void => {
    const { width, height } = resolveLockedSize(win)
    win.setBounds({ x: Math.round(x), y: Math.round(y), width, height })
}

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
        moveKeepingSize(win, nextX, nextY)
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
        moveKeepingSize(win, x, y)
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
        // 이후 이동(dragTo/moveTo)이 이 크기로 매번 못박도록 고정 크기를 갱신한다.
        // 이렇게 하면 그간 쌓인 드리프트도 크기 변경 시 원래 의도한 크기로 교정된다.
        lockedSizes.set(win, { width: nextWidth, height: nextHeight })
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
