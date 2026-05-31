import { BrowserWindow, ipcMain } from 'electron'

// 캐릭터 위 말풍선 중계.
// 다른 창(통합 메뉴 등)에서 'character:say'로 멘트를 보내면 모든 창에 'character:speech'로
// broadcast한다. 실제로는 캐릭터 창만 구독해 머리 위에 말풍선을 띄운다.
// 일시적 UI 신호라 도메인 SSOT가 아닌 fire-and-forget 채널.
export const registerCharacterIpc = (): void => {
    ipcMain.on('character:say', (_event, text: string) => {
        if (typeof text !== 'string' || text === '') {
            return
        }
        for (const targetWindow of BrowserWindow.getAllWindows()) {
            if (!targetWindow.isDestroyed()) {
                targetWindow.webContents.send('character:speech', text)
            }
        }
    })
}
