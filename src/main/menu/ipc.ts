import { BrowserWindow, ipcMain } from 'electron'
import { showCharacterContextMenu, type CharacterContextMenuDeps } from './characterContextMenu'

// menu 도메인의 IPC 핸들러를 한 번에 등록.
// 우클릭 컨텍스트 메뉴 표시 + 메뉴 열림/닫힘 동안 renderer가 자율 행동을 멈추도록
// 양 끝에서 menu:state 신호를 send한다.
// deps는 다른 도메인(linkBar 등)에 대한 호출 콜백 — main/index.ts에서 조립해서 주입한다.
export const registerMenuIpc = (deps: CharacterContextMenuDeps): void => {
    ipcMain.on('window:showContextMenu', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) {
            return
        }
        win.webContents.send('menu:state', 'opened')
        showCharacterContextMenu(
            win,
            () => {
                win.webContents.send('menu:state', 'closed')
            },
            deps,
        )
    })
}
