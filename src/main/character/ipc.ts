import { BrowserWindow, ipcMain } from 'electron'

// 캐릭터 위 말풍선을 모든 창에 broadcast한다. 실제로는 캐릭터 창만 구독해 머리 위에 띄운다.
// main 내부 트리거(예: 할일 완료 보상 안내)와 renderer의 'character:say' 둘 다 이걸 쓴다.
export const broadcastCharacterSpeech = (text: string): void => {
    if (typeof text !== 'string' || text === '') {
        return
    }
    for (const targetWindow of BrowserWindow.getAllWindows()) {
        if (!targetWindow.isDestroyed()) {
            targetWindow.webContents.send('character:speech', text)
        }
    }
}

// 다른 창(통합 메뉴 등)에서 'character:say'로 보낸 멘트를 중계한다.
// 일시적 UI 신호라 도메인 SSOT가 아닌 fire-and-forget 채널.
export const registerCharacterIpc = (): void => {
    ipcMain.on('character:say', (_event, text: string) => {
        broadcastCharacterSpeech(text)
    })
}
