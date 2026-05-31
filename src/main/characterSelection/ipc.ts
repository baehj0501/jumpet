import { BrowserWindow, ipcMain } from 'electron'
import type {
    CharacterSelectionEvent,
    CharacterSelectionState,
} from '@shared/contracts/characterEvents'
import { reduceCharacterSelectionState } from './characterSelectionState'
import { readCharacterSelectionState, writeCharacterSelectionState } from './store'

const CHARACTER_SELECTION_CHANGED_CHANNEL = 'characterSelection:changed'

const broadcastCharacterSelectionState = (next: CharacterSelectionState): void => {
    for (const targetWindow of BrowserWindow.getAllWindows()) {
        if (!targetWindow.isDestroyed()) {
            targetWindow.webContents.send(CHARACTER_SELECTION_CHANGED_CHANNEL, next)
        }
    }
}

export const registerCharacterSelectionIpc = (): void => {
    ipcMain.handle('characterSelection:get', (): CharacterSelectionState => {
        return readCharacterSelectionState()
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
