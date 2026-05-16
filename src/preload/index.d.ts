import { ElectronAPI } from '@electron-toolkit/preload'

type Rect = {
    x: number
    y: number
    width: number
    height: number
}

declare global {
    interface Window {
        electron: ElectronAPI
        api: {
            startWindowDrag: (mouseX: number, mouseY: number) => void
            dragWindowTo: (mouseX: number, mouseY: number) => void
            endWindowDrag: () => void
            moveWindowTo: (x: number, y: number) => void
            getWindowBounds: () => Promise<Rect | null>
            getDisplayWorkArea: () => Promise<Rect>
            showContextMenu: () => void
            onMenuStateChange: (handler: (state: 'opened' | 'closed') => void) => () => void
        }
    }
}

export {}
