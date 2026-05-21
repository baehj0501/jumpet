import { ElectronAPI } from '@electron-toolkit/preload'

type Rect = {
    x: number
    y: number
    width: number
    height: number
}

// 플레이어 영속 데이터 타입.
// main의 src/main/playerState/playerState.ts와 모양을 일치시켜야 한다.
// (renderer tsconfig가 src/main을 include하지 않아 cross-import 불가하여 별도 선언)
type PlayerState = {
    score: number
}

type PlayerEvent = {
    type: 'manual'
    delta: number
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
            player: {
                get: () => Promise<PlayerState>
                apply: (event: PlayerEvent) => Promise<PlayerState>
                onChange: (handler: (state: PlayerState) => void) => () => void
            }
        }
    }
}

export {}
