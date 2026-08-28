import { BrowserWindow, ipcMain } from 'electron'

// 캐릭터 위 말풍선을 모든 창에 broadcast한다. 실제로는 캐릭터 창만 구독해 머리 위에 띄운다.
// main 내부 트리거(예: 할일 완료 보상 안내)와 renderer의 'character:say' 둘 다 이걸 쓴다.
// sticky=true면 자동으로 사라지지 않고 사용자가 닫을 때까지 유지된다(알림용).
export const broadcastCharacterSpeech = (
    text: string,
    options?: { sticky?: boolean },
): void => {
    if (typeof text !== 'string' || text === '') {
        return
    }
    const payload = { text, sticky: options?.sticky ?? false }
    for (const targetWindow of BrowserWindow.getAllWindows()) {
        if (!targetWindow.isDestroyed()) {
            targetWindow.webContents.send('character:speech', payload)
        }
    }
}

// 의존성 주입 — sticky 알림이 뜰 때/닫힐 때 캐릭터 창 z-order 제어는 index.ts에서 조립한다.
type CharacterIpcDeps = {
    // sticky 멘트가 떴을 때 — 캐릭터 창을 최상단으로 끌어올려 유지한다.
    onStickySpeech?: () => void
    // sticky 알림 말풍선을 사용자가 닫았을 때 — 최상단 고정을 해제한다.
    onDismiss?: () => void
}

// 다른 창(통합 메뉴 등)에서 'character:say'로 보낸 멘트를 중계한다.
// 일시적 UI 신호라 도메인 SSOT가 아닌 fire-and-forget 채널.
export const registerCharacterIpc = (deps: CharacterIpcDeps = {}): void => {
    ipcMain.on('character:say', (_event, text: string, options?: { sticky?: boolean }) => {
        broadcastCharacterSpeech(text, options)
        if (options?.sticky) {
            deps.onStickySpeech?.()
        }
    })
    ipcMain.on('character:dismissNotification', () => {
        deps.onDismiss?.()
    })
}
