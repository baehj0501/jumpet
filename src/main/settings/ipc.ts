import { app, BrowserWindow, ipcMain } from 'electron'
import type { SettingsEvent, SettingsState } from '@shared/contracts/settingsEvents'
import { reduceSettingsState } from './settingsState'
import { readSettingsState, writeSettingsState } from './store'

const SETTINGS_CHANGED_CHANNEL = 'settings:changed'

// 로그인 시 자동 실행을 OS에 반영. 시작 시·변경 시 모두 호출(멱등).
// dev(미서명 Electron)에선 'Operation not permitted'가 날 수 있어 무시한다 — 패키지 앱에선 정상 동작.
export const applyLaunchAtLogin = (openAtLogin: boolean): void => {
    try {
        app.setLoginItemSettings({ openAtLogin })
    } catch {
        // OS가 거부(주로 dev 환경) — 조용히 무시.
    }
}

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
        // 자동 실행 설정이 바뀌었으면 OS에 반영.
        if (next.launchAtLogin !== current.launchAtLogin) {
            applyLaunchAtLogin(next.launchAtLogin)
        }
        return next
    })
}
