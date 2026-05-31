import { create } from 'zustand'
import { INITIAL_CHARACTER_SELECTION_STATE } from '@shared/contracts/characterEvents'
import type { CharacterId } from './Character'

// 선택된 캐릭터(펫)의 renderer 측 글로벌 store.
// main이 SSOT — 펫 윈도우(App)와 메뉴 창(홈 탭)이 같은 값을 구독한다.
// usePlayerStore와 같은 패턴 — entrypoint(app/main.tsx, menu/main.tsx)가 sync를 1회 호출.

type CharacterSelectionStore = {
    characterId: CharacterId
    // 캐릭터 선택. main을 거쳐 영속화 + 모든 창에 broadcast된다.
    select: (characterId: CharacterId) => Promise<void>
}

const useCharacterSelectionStoreInternal = create<CharacterSelectionStore>((set) => ({
    characterId: INITIAL_CHARACTER_SELECTION_STATE.characterId as CharacterId,
    select: async (characterId) => {
        const next = await window.api.characterSelection.apply({ type: 'select', characterId })
        set({ characterId: next.characterId as CharacterId })
    },
}))

let isInitialized = false
let unsubscribeFromChanges: (() => void) | null = null

export const initializeCharacterSelectionSync = (): void => {
    if (isInitialized) {
        return
    }
    isInitialized = true

    void window.api.characterSelection
        .get()
        .then((state) => {
            useCharacterSelectionStoreInternal.setState({
                characterId: state.characterId as CharacterId,
            })
        })
        .catch(() => {
            // 창이 닫히는 타이밍 등으로 IPC가 단절되면 조용히 무시.
        })
    unsubscribeFromChanges = window.api.characterSelection.onChange((state) => {
        useCharacterSelectionStoreInternal.setState({
            characterId: state.characterId as CharacterId,
        })
    })
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        unsubscribeFromChanges?.()
        unsubscribeFromChanges = null
        isInitialized = false
    })
}

export const useSelectedCharacterId = (): CharacterId =>
    useCharacterSelectionStoreInternal((state) => state.characterId)
export const useSelectCharacter = (): ((characterId: CharacterId) => Promise<void>) =>
    useCharacterSelectionStoreInternal((state) => state.select)
