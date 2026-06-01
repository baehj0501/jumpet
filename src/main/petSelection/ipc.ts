import { BrowserWindow, ipcMain } from 'electron'
import type { PetSelectionEvent, PetSelectionState } from '@shared/contracts/petEvents'
import { reducePetSelectionState } from './petSelectionState'
import { readPetSelectionState, writePetSelectionState } from './store'

const PET_SELECTION_CHANGED_CHANNEL = 'petSelection:changed'

const broadcastPetSelectionState = (next: PetSelectionState): void => {
    for (const targetWindow of BrowserWindow.getAllWindows()) {
        if (!targetWindow.isDestroyed()) {
            targetWindow.webContents.send(PET_SELECTION_CHANGED_CHANNEL, next)
        }
    }
}

export const registerPetSelectionIpc = (): void => {
    ipcMain.handle('petSelection:get', (): PetSelectionState => {
        return readPetSelectionState()
    })

    ipcMain.handle(
        'petSelection:apply',
        (_event, eventInput: PetSelectionEvent): PetSelectionState => {
            const current = readPetSelectionState()
            const next = reducePetSelectionState(current, eventInput)
            if (next === current) {
                return current
            }
            writePetSelectionState(next)
            broadcastPetSelectionState(next)
            return next
        },
    )
}
