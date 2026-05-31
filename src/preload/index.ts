import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { PlayerEvent, PlayerState } from '@shared/contracts/playerEvents'
import type { Todo, TodoEvent, TodoState } from '@shared/contracts/todoEvents'
import type { FortuneEvent, FortuneState } from '@shared/contracts/fortuneEvents'
import type { GachaResult, ItemEvent, ItemState } from '@shared/contracts/itemEvents'
import type { ScheduleEvent, ScheduleState } from '@shared/contracts/scheduleEvents'
import type {
    CharacterSelectionEvent,
    CharacterSelectionState,
} from '@shared/contracts/characterEvents'

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
        // 100개 한도 초과로 자동 정리(FIFO)된 todo 목록. 사용자 명시적 삭제와 구분되는 신호.
        onEvicted: (handler: (todos: Todo[]) => void): (() => void) => {
            const listener = (_event: unknown, todos: Todo[]) => {
                handler(todos)
            }
            ipcRenderer.on('todo:evicted', listener)
            const unsubscribe = () => {
                ipcRenderer.removeListener('todo:evicted', listener)
            }
            return unsubscribe
        },
    },
    // 운세 영속 데이터 API. player/todo와 같은 패턴.
    fortune: {
        get: (): Promise<FortuneState> => ipcRenderer.invoke('fortune:get'),
        apply: (event: FortuneEvent): Promise<FortuneState> =>
            ipcRenderer.invoke('fortune:apply', event),
        onChange: (handler: (state: FortuneState) => void): (() => void) => {
            const listener = (_event: unknown, state: FortuneState) => {
                handler(state)
            }
            ipcRenderer.on('fortune:changed', listener)
            const unsubscribe = () => {
                ipcRenderer.removeListener('fortune:changed', listener)
            }
            return unsubscribe
        },
    },
    // 캐릭터 위 말풍선. 다른 창(메뉴 등)에서 say로 멘트를 보내면 캐릭터 창이 onSpeech로 받아 띄운다.
    // 영속 데이터가 아니라 일시적 UI 신호 — fire-and-forget(send) + 구독(on).
    character: {
        say: (text: string): void => {
            ipcRenderer.send('character:say', text)
        },
        onSpeech: (handler: (text: string) => void): (() => void) => {
            const listener = (_event: unknown, text: string) => {
                handler(text)
            }
            ipcRenderer.on('character:speech', listener)
            const unsubscribe = () => {
                ipcRenderer.removeListener('character:speech', listener)
            }
            return unsubscribe
        },
    },
    // 소모성 아이템 인벤토리 API. consume은 apply, 뽑기는 결과를 반환하는 별도 invoke.
    item: {
        get: (): Promise<ItemState> => ipcRenderer.invoke('item:get'),
        apply: (event: ItemEvent): Promise<ItemState> => ipcRenderer.invoke('item:apply', event),
        gacha: (): Promise<GachaResult> => ipcRenderer.invoke('item:gacha'),
        onChange: (handler: (state: ItemState) => void): (() => void) => {
            const listener = (_event: unknown, state: ItemState) => {
                handler(state)
            }
            ipcRenderer.on('item:changed', listener)
            const unsubscribe = () => {
                ipcRenderer.removeListener('item:changed', listener)
            }
            return unsubscribe
        },
    },
    // 일정 영속 데이터 API. player/todo와 같은 패턴.
    schedule: {
        get: (): Promise<ScheduleState> => ipcRenderer.invoke('schedule:get'),
        apply: (event: ScheduleEvent): Promise<ScheduleState> =>
            ipcRenderer.invoke('schedule:apply', event),
        onChange: (handler: (state: ScheduleState) => void): (() => void) => {
            const listener = (_event: unknown, state: ScheduleState) => {
                handler(state)
            }
            ipcRenderer.on('schedule:changed', listener)
            const unsubscribe = () => {
                ipcRenderer.removeListener('schedule:changed', listener)
            }
            return unsubscribe
        },
    },
    // 선택된 캐릭터(펫) API. 홈 탭에서 바꾸면 펫 윈도우도 같은 값을 구독해 함께 바뀐다.
    characterSelection: {
        get: (): Promise<CharacterSelectionState> => ipcRenderer.invoke('characterSelection:get'),
        apply: (event: CharacterSelectionEvent): Promise<CharacterSelectionState> =>
            ipcRenderer.invoke('characterSelection:apply', event),
        onChange: (handler: (state: CharacterSelectionState) => void): (() => void) => {
            const listener = (_event: unknown, state: CharacterSelectionState) => {
                handler(state)
            }
            ipcRenderer.on('characterSelection:changed', listener)
            const unsubscribe = () => {
                ipcRenderer.removeListener('characterSelection:changed', listener)
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
