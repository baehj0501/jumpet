import { BrowserWindow, ipcMain } from 'electron'
import { reducePlayerState, type PlayerEvent, type PlayerState } from './playerState'
import { readPlayerState, writePlayerState } from './store'

// 모든 renderer에 변경 사항을 알리기 위한 채널.
// 어느 한 윈도우에서 apply가 일어나도 다른 윈도우들이 같은 시각에 갱신된다.
const PLAYER_CHANGED_CHANNEL = 'player:changed'

const broadcastPlayerState = (next: PlayerState): void => {
    const allWindows = BrowserWindow.getAllWindows()
    for (const targetWindow of allWindows) {
        if (targetWindow.isDestroyed()) {
            continue
        }
        targetWindow.webContents.send(PLAYER_CHANGED_CHANNEL, next)
    }
}

export const registerPlayerStateIpc = (): void => {
    ipcMain.handle('player:get', (): PlayerState => {
        return readPlayerState()
    })

    ipcMain.handle('player:apply', (_event, eventInput: PlayerEvent): PlayerState => {
        // 혼자 개발하는 로컬 게임이라 IPC payload는 신뢰 가능.
        // 다만 delta가 NaN/Infinity면 score 산술이 회복 불가하게 깨지므로 그것만 차단.
        if (!Number.isFinite(eventInput.delta)) {
            return readPlayerState()
        }
        const current = readPlayerState()
        const next = reducePlayerState(current, eventInput)
        writePlayerState(next)
        broadcastPlayerState(next)
        return next
    })
}
