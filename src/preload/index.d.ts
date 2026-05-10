import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      startWindowDrag: (mouseX: number, mouseY: number) => void
      dragWindowTo: (mouseX: number, mouseY: number) => void
      endWindowDrag: () => void
      showContextMenu: () => void
    }
  }
}

export {}
