import { BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

// 싱글톤 ref. 우클릭을 다시 해도 새 창을 만들지 않고 기존 창에 포커스한다.
let menuWindow: BrowserWindow | null = null

// 메뉴 창 최소 크기(=생성 시 minWidth/minHeight와 동일). JS 리사이즈에서 클램프에 쓴다.
const MENU_MIN_W = 320
const MENU_MIN_H = 460

// JS 드래그 리사이즈 원점(드래그 시작 시점의 창 bounds + 마우스 화면좌표).
type MenuResizeOrigin = {
    edge: string
    startX: number
    startY: number
    startW: number
    startH: number
    startMouseX: number
    startMouseY: number
}
let menuResizeOrigin: MenuResizeOrigin | null = null

// 메뉴 창 JS 리사이즈 IPC를 1회 등록한다(앱 시작 시 index.ts에서 호출).
// 네이티브 프레임리스 드래그 리사이즈는 Windows에서 새로 늘어난 영역이 잠깐 검게 보이는
// GPU 합성 버그가 있어(=사용자 리포트), 렌더러의 투명 핸들로 드래그해 main이 setBounds로
// 크기를 바꾼다. setBounds 기반 리사이즈는 Electron이 배경색을 존중해 검정이 생기지 않는다.
export const registerMenuResizeIpc = (): void => {
    ipcMain.on('menu:startResize', (event, edge: string, mouseX: number, mouseY: number) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) {
            return
        }
        const b = win.getBounds()
        menuResizeOrigin = {
            edge,
            startX: b.x,
            startY: b.y,
            startW: b.width,
            startH: b.height,
            startMouseX: mouseX,
            startMouseY: mouseY,
        }
    })
    ipcMain.on('menu:resizeTo', (event, mouseX: number, mouseY: number) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win || !menuResizeOrigin) {
            return
        }
        const o = menuResizeOrigin
        const dx = mouseX - o.startMouseX
        const dy = mouseY - o.startMouseY
        let x = o.startX
        let y = o.startY
        let width = o.startW
        let height = o.startH
        if (o.edge.includes('e')) {
            width = Math.max(MENU_MIN_W, o.startW + dx)
        }
        if (o.edge.includes('s')) {
            height = Math.max(MENU_MIN_H, o.startH + dy)
        }
        if (o.edge.includes('w')) {
            width = Math.max(MENU_MIN_W, o.startW - dx)
            x = o.startX + (o.startW - width)
        }
        if (o.edge.includes('n')) {
            height = Math.max(MENU_MIN_H, o.startH - dy)
            y = o.startY + (o.startH - height)
        }
        win.setBounds({ x, y, width: Math.round(width), height: Math.round(height) })
    })
    ipcMain.on('menu:endResize', () => {
        menuResizeOrigin = null
    })
}

// 꾸미기 모드 중에는 전체화면 데코 창 위로 메뉴를 띄워 메뉴 클릭이 가려지지 않게 한다.
// Windows에선 편집 중 오버레이도 always-on-top이라, 켤 때 메뉴를 명시적으로 위로 올려(moveTop)
// 오버레이보다 확실히 앞에 두어야 저장/취소 버튼이 항상 눌린다.
export const setMenuPanelOnTop = (flag: boolean): void => {
    if (menuWindow && !menuWindow.isDestroyed()) {
        if (flag) {
            // 편집 중엔 오버레이('normal' 레벨)보다 확실히 높은 레벨로 올려, 데코 카드·저장/취소 클릭이
            // 오버레이에 가려지지 않게 한다(z-order 경쟁 방지 → 전 화면 클릭 막힘 방지).
            menuWindow.setAlwaysOnTop(true, 'pop-up-menu')
            menuWindow.moveTop()
        } else {
            menuWindow.setAlwaysOnTop(false)
        }
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
        minWidth: MENU_MIN_W,
        minHeight: MENU_MIN_H,
        frame: false,
        // 네이티브 프레임리스 드래그 리사이즈는 Windows에서 검정 플래시를 유발한다.
        // 대신 renderer의 투명 핸들 + menu:resize IPC(setBounds)로 리사이즈한다.
        resizable: false,
        // 불투명 창은 아래로 늘릴 때 새로 생긴 바닥 영역이 '아직 안 칠해진 불투명 버퍼'라
        // Windows에서 검정으로 보인다. 투명 창으로 두면 그 영역이 (검정이 아니라) 투명→바로
        // body의 불투명 배경이 덮어 검정 플래시가 사라진다. (유튜브 창과 동일한 방식)
        // 실제 배경은 pixel-theme.css의 body(background: var(--bg))가 불투명하게 채운다.
        transparent: true,
        backgroundColor: '#00000000',
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
