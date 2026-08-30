import type { ElectronAPI } from '@electron-toolkit/preload'
import type { PlayerEvent, PlayerState } from '@shared/contracts/playerEvents'
import type { Todo, TodoEvent, TodoState } from '@shared/contracts/todoEvents'
import type { FortuneEvent, FortuneState } from '@shared/contracts/fortuneEvents'
import type { GachaResult, ItemEvent, ItemState } from '@shared/contracts/itemEvents'
import type { ScheduleEvent, ScheduleState } from '@shared/contracts/scheduleEvents'
import type {
    CharacterSelectionEvent,
    CharacterSelectionState,
} from '@shared/contracts/characterEvents'
import type { ProfileEvent, ProfileState } from '@shared/contracts/profileEvents'
import type { PetSelectionEvent, PetSelectionState } from '@shared/contracts/petEvents'
import type { SettingsEvent, SettingsState } from '@shared/contracts/settingsEvents'
import type { WorldEvent, WorldState } from '@shared/contracts/worldEvents'

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
            setWindowSize: (width: number, height: number) => void
            getWindowBounds: () => Promise<Rect | null>
            getDisplayWorkArea: () => Promise<Rect>
            showContextMenu: () => void
            onMenuStateChange: (handler: (state: 'opened' | 'closed') => void) => () => void
            menu: {
                startResize: (edge: string, mouseX: number, mouseY: number) => void
                resizeTo: (mouseX: number, mouseY: number) => void
                endResize: () => void
                hide: () => void
            }
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
            schedule: {
                get: () => Promise<ScheduleState>
                apply: (event: ScheduleEvent) => Promise<ScheduleState>
                onChange: (handler: (state: ScheduleState) => void) => () => void
            }
            characterSelection: {
                get: () => Promise<CharacterSelectionState>
                apply: (event: CharacterSelectionEvent) => Promise<CharacterSelectionState>
                gacha: () => Promise<{ success: boolean }>
                onChange: (handler: (state: CharacterSelectionState) => void) => () => void
            }
            profile: {
                get: () => Promise<ProfileState>
                apply: (event: ProfileEvent) => Promise<ProfileState>
                onChange: (handler: (state: ProfileState) => void) => () => void
            }
            petSelection: {
                get: () => Promise<PetSelectionState>
                apply: (event: PetSelectionEvent) => Promise<PetSelectionState>
                gacha: () => Promise<{ success: boolean }>
                onChange: (handler: (state: PetSelectionState) => void) => () => void
            }
            settings: {
                get: () => Promise<SettingsState>
                apply: (event: SettingsEvent) => Promise<SettingsState>
                onChange: (handler: (state: SettingsState) => void) => () => void
            }
            app: {
                getVersion: () => Promise<string>
                resetAll: () => Promise<void>
                quit: () => Promise<void>
            }
            world: {
                get: () => Promise<WorldState>
                apply: (event: WorldEvent) => Promise<WorldState>
                gacha: () => Promise<{ success: boolean }>
                setOverlayBounds: (
                    bounds: { x: number; y: number; w: number; h: number } | null,
                ) => void
                onChange: (handler: (state: WorldState) => void) => () => void
            }
            youtube: {
                open: (options?: { theme?: number; url?: string }) => void
                move: (dx: number, dy: number) => void
                resize: (width: number, height: number) => void
                resizeEdge: (edge: string, dx: number, dy: number) => void
                setAlwaysOnTop: (value: boolean) => void
                openContextMenu: (state: {
                    theme: number
                    sizeStep: number
                    alwaysOnTop: boolean
                    sizeCount: number
                    themes: { id: number; name: string }[]
                }) => void
                selectMenu: (action: { type: string; value?: number | boolean }) => void
                onMenuAction: (
                    handler: (action: { type: string; value?: number | boolean }) => void,
                ) => () => void
                onOpenMenuRequest: (handler: (point: { x: number; y: number }) => void) => () => void
                close: () => void
            }
            character: {
                say: (text: string, options?: { sticky?: boolean }) => void
                onSpeech: (
                    handler: (payload: { text: string; sticky?: boolean }) => void,
                ) => () => void
                dismissNotification: () => void
            }
        }
    }
}
