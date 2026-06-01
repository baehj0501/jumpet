import { BrowserWindow, ipcMain } from 'electron'
import type { ProfileEvent, ProfileState } from '@shared/contracts/profileEvents'
import { reduceProfileState } from './profileState'
import { readProfileState, writeProfileState } from './store'

const PROFILE_CHANGED_CHANNEL = 'profile:changed'

const broadcastProfileState = (next: ProfileState): void => {
    for (const targetWindow of BrowserWindow.getAllWindows()) {
        if (!targetWindow.isDestroyed()) {
            targetWindow.webContents.send(PROFILE_CHANGED_CHANNEL, next)
        }
    }
}

export const registerProfileIpc = (): void => {
    ipcMain.handle('profile:get', (): ProfileState => {
        return readProfileState()
    })

    ipcMain.handle('profile:apply', (_event, eventInput: ProfileEvent): ProfileState => {
        const current = readProfileState()
        const next = reduceProfileState(current, eventInput)
        if (next === current) {
            return current
        }
        writeProfileState(next)
        broadcastProfileState(next)
        return next
    })
}
