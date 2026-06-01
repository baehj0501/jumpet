import { BrowserWindow, ipcMain } from 'electron'
import { GACHA_COST } from '@shared/contracts/itemEvents'
import type { WorldEvent, WorldMode, WorldState } from '@shared/contracts/worldEvents'
import { reduceWorldState } from './worldState'
import { readWorldState, writeWorldState } from './store'

const WORLD_CHANGED_CHANNEL = 'world:changed'

const broadcastWorldState = (next: WorldState): void => {
    for (const targetWindow of BrowserWindow.getAllWindows()) {
        if (!targetWindow.isDestroyed()) {
            targetWindow.webContents.send(WORLD_CHANGED_CHANNEL, next)
        }
    }
}

type WorldIpcHooks = {
    // 꾸미기 모드가 바뀌면 호출 — main이 월드 창의 클릭통과/포커스를 토글한다.
    onModeChange?: (mode: WorldMode) => void
    // 가챠 — 점수 확인·차감(player)을 main/index.ts에서 주입. 데코 추첨은 renderer가 한다.
    getScore?: () => number
    spendForGacha?: () => void
}

export const registerWorldIpc = (hooks: WorldIpcHooks = {}): void => {
    ipcMain.handle('world:get', (): WorldState => {
        return readWorldState()
    })

    // 가챠 비용 차감만 담당(원자적). 성공 시 renderer가 데코를 추첨해 acquire한다.
    ipcMain.handle('world:gacha', (): { success: boolean } => {
        if (!hooks.getScore || !hooks.spendForGacha) {
            return { success: false }
        }
        if (hooks.getScore() < GACHA_COST) {
            return { success: false }
        }
        hooks.spendForGacha()
        return { success: true }
    })

    ipcMain.handle('world:apply', (_event, eventInput: WorldEvent): WorldState => {
        const current = readWorldState()
        const next = reduceWorldState(current, eventInput)
        if (next === current) {
            return current
        }
        writeWorldState(next)
        broadcastWorldState(next)
        if (next.mode !== current.mode) {
            hooks.onModeChange?.(next.mode)
        }
        return next
    })
}
