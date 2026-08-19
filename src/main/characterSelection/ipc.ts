import { BrowserWindow, ipcMain } from 'electron'
import {
    CHARACTER_GACHA_COST,
    type CharacterSelectionEvent,
    type CharacterSelectionState,
} from '@shared/contracts/characterEvents'
import { reduceCharacterSelectionState } from './characterSelectionState'
import { readCharacterSelectionState, writeCharacterSelectionState } from './store'

type CharacterSelectionIpcHooks = {
    // 캐릭터 뽑기 — 점수 확인·차감(player)을 main/index.ts에서 주입. 추첨은 renderer가 한다.
    getScore?: () => number
    spendForGacha?: () => void
}

const CHARACTER_SELECTION_CHANGED_CHANNEL = 'characterSelection:changed'

const broadcastCharacterSelectionState = (next: CharacterSelectionState): void => {
    for (const targetWindow of BrowserWindow.getAllWindows()) {
        if (!targetWindow.isDestroyed()) {
            targetWindow.webContents.send(CHARACTER_SELECTION_CHANGED_CHANNEL, next)
        }
    }
}

export const registerCharacterSelectionIpc = (hooks: CharacterSelectionIpcHooks = {}): void => {
    ipcMain.handle('characterSelection:get', (): CharacterSelectionState => {
        return readCharacterSelectionState()
    })

    // 캐릭터 뽑기 비용 차감만 담당(원자적). 성공 시 renderer가 미보유 캐릭터를 추첨해 unlock한다.
    ipcMain.handle('characterSelection:gacha', (): { success: boolean } => {
        if (!hooks.getScore || !hooks.spendForGacha) {
            return { success: false }
        }
        if (hooks.getScore() < CHARACTER_GACHA_COST) {
            return { success: false }
        }
        hooks.spendForGacha()
        return { success: true }
    })

    ipcMain.handle(
        'characterSelection:apply',
        (_event, eventInput: CharacterSelectionEvent): CharacterSelectionState => {
            const current = readCharacterSelectionState()
            const next = reduceCharacterSelectionState(current, eventInput)
            if (next === current) {
                return current
            }
            writeCharacterSelectionState(next)
            broadcastCharacterSelectionState(next)
            return next
        },
    )
}
