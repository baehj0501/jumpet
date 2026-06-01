import { BrowserWindow, ipcMain } from 'electron'
import type { SettingsEvent, SettingsState } from '@shared/contracts/settingsEvents'
import { reduceSettingsState } from './settingsState'
import { readSettingsState, writeSettingsState } from './store'

const SETTINGS_CHANGED_CHANNEL = 'settings:changed'

const broadcastSettingsState = (next: SettingsState): void => {
    for (const targetWindow of BrowserWindow.getAllWindows()) {
        if (!targetWindow.isDestroyed()) {
            targetWindow.webContents.send(SETTINGS_CHANGED_CHANNEL, next)
        }
    }
}

export const registerSettingsIpc = (): void => {
    ipcMain.handle('settings:get', (): SettingsState => {
        return readSettingsState()
    })

    ipcMain.handle('settings:apply', (_event, eventInput: SettingsEvent): SettingsState => {
        const current = readSettingsState()
        const next = reduceSettingsState(current, eventInput)
        if (next === current) {
            return current
        }
        writeSettingsState(next)
        broadcastSettingsState(next)
        return next
    })
}
