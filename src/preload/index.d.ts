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

// TODO 영속 데이터 타입.
// main의 src/main/todo/todoState.ts와 모양을 일치시켜야 한다.
type Todo = {
    id: string
    text: string
    completed: boolean
    createdAt: number
}

type TodoState = {
    todos: Todo[]
}

type TodoEvent =
    | { type: 'add'; text: string }
    | { type: 'toggle'; id: string }
    | { type: 'remove'; id: string }
    | { type: 'updateText'; id: string; text: string }
    | { type: 'clearCompleted' }

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
            todo: {
                get: () => Promise<TodoState>
                apply: (event: TodoEvent) => Promise<TodoState>
                onChange: (handler: (state: TodoState) => void) => () => void
            }
        }
    }
}

export {}
