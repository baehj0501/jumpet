import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
    startWindowDrag: (mouseX: number, mouseY: number): void => {
        ipcRenderer.send('window:startDrag', mouseX, mouseY)
    },
    dragWindowTo: (mouseX: number, mouseY: number): void => {
        ipcRenderer.send('window:dragTo', mouseX, mouseY)
    },
    endWindowDrag: (): void => {
        ipcRenderer.send('window:endDrag')
    },
    moveWindowTo: (x: number, y: number): void => {
        ipcRenderer.send('window:moveTo', x, y)
    },
    getWindowBounds: (): Promise<{ x: number; y: number; width: number; height: number } | null> =>
        ipcRenderer.invoke('window:getBounds'),
    getDisplayWorkArea: (): Promise<{ x: number; y: number; width: number; height: number }> =>
        ipcRenderer.invoke('window:getDisplayWorkArea'),
    showContextMenu: (): void => {
        ipcRenderer.send('window:showContextMenu')
    },
}

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-expect-error fallback when context isolation is disabled
    window.electron = electronAPI
    // @ts-expect-error fallback when context isolation is disabled
    window.api = api
}
