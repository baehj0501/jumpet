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
import type { ProfileEvent, ProfileState } from '@shared/contracts/profileEvents'
import type { PetSelectionEvent, PetSelectionState } from '@shared/contracts/petEvents'
import type { SettingsEvent, SettingsState } from '@shared/contracts/settingsEvents'
import type { WorldEvent, WorldState } from '@shared/contracts/worldEvents'

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
    // 캐릭터 윈도우 크기 조절(petScale) — 중심 고정으로 제자리에서 커진다.
    setWindowSize: (width: number, height: number): void => {
        ipcRenderer.send('window:setSize', width, height)
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
        say: (text: string, options?: { sticky?: boolean }): void => {
            ipcRenderer.send('character:say', text, options)
        },
        onSpeech: (
            handler: (payload: { text: string; sticky?: boolean }) => void,
        ): (() => void) => {
            const listener = (_event: unknown, payload: { text: string; sticky?: boolean }) => {
                // 구버전 호환 — payload가 문자열로 올 수도 있으니 정규화.
                handler(typeof payload === 'string' ? { text: payload } : payload)
            }
            ipcRenderer.on('character:speech', listener)
            const unsubscribe = () => {
                ipcRenderer.removeListener('character:speech', listener)
            }
            return unsubscribe
        },
        // sticky 알림 말풍선을 사용자가 닫았을 때 — 캐릭터 창의 최상단 고정을 해제하라고 main에 알린다.
        dismissNotification: (): void => {
            ipcRenderer.send('character:dismissNotification')
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
    // 홈 프로필(캐릭터 이름·이름·생일) API. 메뉴 창·펫 창이 같은 값을 공유(SSOT).
    profile: {
        get: (): Promise<ProfileState> => ipcRenderer.invoke('profile:get'),
        apply: (event: ProfileEvent): Promise<ProfileState> =>
            ipcRenderer.invoke('profile:apply', event),
        onChange: (handler: (state: ProfileState) => void): (() => void) => {
            const listener = (_event: unknown, state: ProfileState) => {
                handler(state)
            }
            ipcRenderer.on('profile:changed', listener)
            const unsubscribe = () => {
                ipcRenderer.removeListener('profile:changed', listener)
            }
            return unsubscribe
        },
    },
    // 동반 펫 장착 API. 펫 탭에서 장착하면 펫 창이 구독해 캐릭터 옆에 렌더한다.
    petSelection: {
        get: (): Promise<PetSelectionState> => ipcRenderer.invoke('petSelection:get'),
        apply: (event: PetSelectionEvent): Promise<PetSelectionState> =>
            ipcRenderer.invoke('petSelection:apply', event),
        onChange: (handler: (state: PetSelectionState) => void): (() => void) => {
            const listener = (_event: unknown, state: PetSelectionState) => {
                handler(state)
            }
            ipcRenderer.on('petSelection:changed', listener)
            const unsubscribe = () => {
                ipcRenderer.removeListener('petSelection:changed', listener)
            }
            return unsubscribe
        },
    },
    // 환경설정(테마·캐릭터 크기) API. 설정 탭에서 바꾸면 메뉴(테마)·캐릭터(크기) 창이 구독.
    settings: {
        get: (): Promise<SettingsState> => ipcRenderer.invoke('settings:get'),
        apply: (event: SettingsEvent): Promise<SettingsState> =>
            ipcRenderer.invoke('settings:apply', event),
        onChange: (handler: (state: SettingsState) => void): (() => void) => {
            const listener = (_event: unknown, state: SettingsState) => {
                handler(state)
            }
            ipcRenderer.on('settings:changed', listener)
            const unsubscribe = () => {
                ipcRenderer.removeListener('settings:changed', listener)
            }
            return unsubscribe
        },
    },
    // 앱 유틸 — 버전 표시 + 전체 데이터 초기화(영속 데이터 삭제 후 재시작).
    app: {
        getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
        resetAll: (): Promise<void> => ipcRenderer.invoke('app:resetAll'),
        quit: (): Promise<void> => ipcRenderer.invoke('app:quit'),
    },
    // 데스크탑 월드(아이템 꾸미기) API. 보유/배치 상태를 메뉴 창·월드 창이 공유(SSOT).
    world: {
        get: (): Promise<WorldState> => ipcRenderer.invoke('world:get'),
        apply: (event: WorldEvent): Promise<WorldState> => ipcRenderer.invoke('world:apply', event),
        // 가챠 비용 차감(원자적). 데코 추첨은 renderer가 한다.
        gacha: (): Promise<{ success: boolean }> => ipcRenderer.invoke('world:gacha'),
        onChange: (handler: (state: WorldState) => void): (() => void) => {
            const listener = (_event: unknown, state: WorldState) => {
                handler(state)
            }
            ipcRenderer.on('world:changed', listener)
            const unsubscribe = () => {
                ipcRenderer.removeListener('world:changed', listener)
            }
            return unsubscribe
        },
    },
    // 유튜브 별창 — 열기(메뉴) + 창 제어(유튜브 창 자체). fire-and-forget.
    youtube: {
        open: (options?: { theme?: number; url?: string }): void =>
            ipcRenderer.send('youtube:open', options ?? {}),
        move: (dx: number, dy: number): void => ipcRenderer.send('youtube:move', { dx, dy }),
        resize: (width: number, height: number): void =>
            ipcRenderer.send('youtube:resize', { width, height }),
        // 가장자리/모서리 드래그 리사이즈 — edge 방향 + 화면 좌표 델타.
        resizeEdge: (edge: string, dx: number, dy: number): void =>
            ipcRenderer.send('youtube:resizeEdge', { edge, dx, dy }),
        // 항상 위(true) / 일반 z-order(false) 토글.
        setAlwaysOnTop: (value: boolean): void =>
            ipcRenderer.send('youtube:setAlwaysOnTop', value),
        // 우클릭 시 OS 네이티브 컨텍스트 메뉴를 main에 요청(현재 상태를 넘겨 체크 표시).
        openContextMenu: (state: {
            theme: number
            sizeStep: number
            alwaysOnTop: boolean
            sizeCount: number
            themes: { id: number; name: string }[]
        }): void => ipcRenderer.send('youtube:openContextMenu', state),
        // 팝업 메뉴에서 항목을 고르면 호출 — main이 뷰어로 relay하고 팝업을 닫는다.
        selectMenu: (action: { type: string; value?: number | boolean }): void =>
            ipcRenderer.send('youtube:menuSelect', action),
        // 메뉴에서 고른 결과를 뷰어가 받는다.
        onMenuAction: (
            handler: (action: { type: string; value?: number | boolean }) => void,
        ): (() => void) => {
            const listener = (_event: unknown, action: { type: string; value?: number | boolean }) =>
                handler(action)
            ipcRenderer.on('youtube:menuAction', listener)
            return () => ipcRenderer.removeListener('youtube:menuAction', listener)
        },
        close: (): void => ipcRenderer.send('youtube:close'),
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
