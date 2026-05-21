import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { PlayerEvent, PlayerState } from '../main/playerState'
import type { TodoEvent, TodoState } from '../main/todo'

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
    // 메뉴 열림/닫힘을 구독한다. 반환 함수는 cleanup 시 호출해 리스너를 제거한다.
    onMenuStateChange: (handler: (state: 'opened' | 'closed') => void): (() => void) => {
        const listener = (_event: unknown, state: 'opened' | 'closed') => {
            handler(state)
        }
        ipcRenderer.on('menu:state', listener)
        const unsubscribe = () => {
            ipcRenderer.removeListener('menu:state', listener)
        }
        return unsubscribe
    },
    // 플레이어 영속 데이터(점수 등) API.
    // main이 SSOT이므로 get/apply는 main을 거치고, onChange로 broadcast를 구독한다.
    player: {
        get: (): Promise<PlayerState> => ipcRenderer.invoke('player:get'),
        apply: (event: PlayerEvent): Promise<PlayerState> => ipcRenderer.invoke('player:apply', event),
        onChange: (handler: (state: PlayerState) => void): (() => void) => {
            const listener = (_event: unknown, state: PlayerState) => {
                handler(state)
            }
            ipcRenderer.on('player:changed', listener)
            const unsubscribe = () => {
                ipcRenderer.removeListener('player:changed', listener)
            }
            return unsubscribe
        },
    },
    // TODO 영속 데이터 API. player와 같은 패턴.
    todo: {
        get: (): Promise<TodoState> => ipcRenderer.invoke('todo:get'),
        apply: (event: TodoEvent): Promise<TodoState> => ipcRenderer.invoke('todo:apply', event),
        onChange: (handler: (state: TodoState) => void): (() => void) => {
            const listener = (_event: unknown, state: TodoState) => {
                handler(state)
            }
            ipcRenderer.on('todo:changed', listener)
            const unsubscribe = () => {
                ipcRenderer.removeListener('todo:changed', listener)
            }
            return unsubscribe
        },
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
