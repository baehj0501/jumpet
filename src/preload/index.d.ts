import type { ElectronAPI } from '@electron-toolkit/preload'
import type { PlayerEvent, PlayerState } from '@shared/contracts/playerEvents'
import type { Todo, TodoEvent, TodoState } from '@shared/contracts/todoEvents'
import type { FortuneEvent, FortuneState } from '@shared/contracts/fortuneEvents'
import type { GachaResult, ItemEvent, ItemState } from '@shared/contracts/itemEvents'

// renderer 전용 외부 타입 보강. window.api 시그니처는 src/preload/index.ts와 한 쌍.

type Rect = {
    x: number
    y: number
    width: number
    height: number
}

// renderer가 직접 참조하지 않더라도 entities barrel을 통해 노출되는 도메인 타입은
// 이 import의 부작용으로 함께 평가되므로 export 형태로 명시한다.
export type {
    PlayerEvent,
    PlayerState,
    Todo,
    TodoEvent,
    TodoState,
    FortuneEvent,
    FortuneState,
    ItemEvent,
    ItemState,
    GachaResult,
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
            todo: {
                get: () => Promise<TodoState>
                apply: (event: TodoEvent) => Promise<TodoState>
                onChange: (handler: (state: TodoState) => void) => () => void
                // 100개 한도 초과로 자동 정리된 todo 목록 구독.
                onEvicted: (handler: (todos: Todo[]) => void) => () => void
            }
            fortune: {
                get: () => Promise<FortuneState>
                apply: (event: FortuneEvent) => Promise<FortuneState>
                onChange: (handler: (state: FortuneState) => void) => () => void
            }
            item: {
                get: () => Promise<ItemState>
                apply: (event: ItemEvent) => Promise<ItemState>
                gacha: () => Promise<GachaResult>
                onChange: (handler: (state: ItemState) => void) => () => void
            }
        }
    }
}
