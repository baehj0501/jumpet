import { BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

// 싱글톤 ref. 메뉴를 다시 클릭하면 새 창을 만들지 않고 기존 창에 포커스한다.
let linkManagerWindow: BrowserWindow | null = null

// 링크 관리 패널 윈도우를 연다.
// 미니 버튼 플로팅 창과는 별개 — 이 창은 추가/수정/삭제용 일반 패널.
export const openLinkManagerPanel = () => {
    if (linkManagerWindow && !linkManagerWindow.isDestroyed()) {
        if (linkManagerWindow.isMinimized()) {
            linkManagerWindow.restore()
        }
        linkManagerWindow.focus()
        return
    }

    linkManagerWindow = new BrowserWindow({
        width: 400,
        height: 560,
        minWidth: 360,
        minHeight: 420,
        title: '링크 관리',
        autoHideMenuBar: true,
        // openTodoPanel과 같은 정책 — 펫의 transparent/alwaysOnTop 옵션은 일반 패널 UX에 부적합.
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
            // 패널별 storage origin 격리.
            // - openTodoPanel.ts는 'persist:todo'를 쓰며, 패널마다 고유 partition을 부여하는 정책이다.
            // - 펫 윈도우(기본 partition)와도, TODO 패널과도 storage(LocalStorage 등)를 공유하지 않는다.
            // - 의도된 차이 — 같은 값으로 통일하면 안 된다.
            partition: 'persist:link-manager',
        },
    })

    linkManagerWindow.on('closed', () => {
        linkManagerWindow = null
    })

    // 패널 안의 링크 텍스트가 새창으로 열리는 등의 경우 OS 브라우저로 위임.
    linkManagerWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        linkManagerWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/link-manager.html`)
    } else {
        linkManagerWindow.loadFile(join(__dirname, '../renderer/link-manager.html'))
    }
}
