import { create } from 'zustand'
import { INITIAL_CHARACTER_SELECTION_STATE } from '@shared/contracts/characterEvents'
import { CHARACTER_ASSETS } from '../assets'
import type { CharacterId } from './Character'

// 뽑기 추첨 대상 — 카탈로그의 모든 캐릭터.
const ALL_CHARACTER_IDS = Object.keys(CHARACTER_ASSETS) as CharacterId[]

// 선택된 캐릭터(펫) + 보유의 renderer 측 글로벌 store.
// main이 SSOT — 펫 윈도우(App)와 메뉴 창(홈 탭)이 같은 값을 구독한다.
// 온보딩에서 고른 스타터 1개만 보유하고, 홈 탭 ‹ ›는 보유한 캐릭터만 순환한다.
// usePlayerStore와 같은 패턴 — entrypoint(app/main.tsx, menu/main.tsx)가 sync를 1회 호출.

type CharacterSelectionStore = {
    characterId: CharacterId
    // 사용자가 첫 실행 온보딩에서 캐릭터를 골랐는지. false면 캐릭터 창에 선택 오버레이를 띄운다.
    chosen: boolean
    // 보유(해제)한 캐릭터 목록 — 이 중에서만 전환 가능.
    ownedCharacters: CharacterId[]
    // 보유한 캐릭터로 전환(홈 탭 ‹ ›). main을 거쳐 영속화 + 모든 창에 broadcast.
    select: (characterId: CharacterId) => Promise<void>
    // 온보딩 최초 선택 — 스타터 확정(chosen=true, 이 캐릭터만 보유).
    choose: (characterId: CharacterId) => Promise<void>
    // 캐릭터 뽑기 — main이 비용 차감 후, renderer가 미보유 캐릭터를 추첨해 보유에 적립. 획득 id 반환(실패 시 null).
    rollCharacterGacha: () => Promise<CharacterId | null>
}

const useCharacterSelectionStoreInternal = create<CharacterSelectionStore>((set, get) => ({
    characterId: INITIAL_CHARACTER_SELECTION_STATE.characterId as CharacterId,
    chosen: INITIAL_CHARACTER_SELECTION_STATE.chosen,
    ownedCharacters: INITIAL_CHARACTER_SELECTION_STATE.ownedCharacters as CharacterId[],
    select: async (characterId) => {
        const next = await window.api.characterSelection.apply({ type: 'select', characterId })
        set({
            characterId: next.characterId as CharacterId,
            chosen: next.chosen,
            ownedCharacters: next.ownedCharacters as CharacterId[],
        })
    },
    choose: async (characterId) => {
        const next = await window.api.characterSelection.apply({ type: 'choose', characterId })
        set({
            characterId: next.characterId as CharacterId,
            chosen: next.chosen,
            ownedCharacters: next.ownedCharacters as CharacterId[],
        })
    },
    rollCharacterGacha: async () => {
        // 미보유 캐릭터가 없으면(모두 보유) 비용을 쓰지 않고 종료.
        const locked = ALL_CHARACTER_IDS.filter((id) => !get().ownedCharacters.includes(id))
        if (locked.length === 0) {
            return null
        }
        const result = await window.api.characterSelection.gacha()
        if (!result.success) {
            return null
        }
        const pick = locked[Math.floor(Math.random() * locked.length)]
        const next = await window.api.characterSelection.apply({
            type: 'unlock',
            characterId: pick,
        })
        set({
            characterId: next.characterId as CharacterId,
            chosen: next.chosen,
            ownedCharacters: next.ownedCharacters as CharacterId[],
        })
        return pick
    },
}))

let isInitialized = false
let unsubscribeFromChanges: (() => void) | null = null

const applyState = (state: {
    characterId: string
    chosen: boolean
    ownedCharacters: string[]
}): void => {
    useCharacterSelectionStoreInternal.setState({
        characterId: state.characterId as CharacterId,
        chosen: state.chosen,
        ownedCharacters: state.ownedCharacters as CharacterId[],
    })
}

export const initializeCharacterSelectionSync = (): void => {
    if (isInitialized) {
        return
    }
    isInitialized = true

    void window.api.characterSelection
        .get()
        .then((state) => {
            applyState(state)
        })
        .catch(() => {
            // 창이 닫히는 타이밍 등으로 IPC가 단절되면 조용히 무시.
        })
    unsubscribeFromChanges = window.api.characterSelection.onChange((state) => {
        applyState(state)
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
export const useChooseCharacter = (): ((characterId: CharacterId) => Promise<void>) =>
    useCharacterSelectionStoreInternal((state) => state.choose)
// 첫 실행 온보딩 완료 여부 — false면 캐릭터 창이 선택 오버레이를 띄운다.
export const useHasChosenCharacter = (): boolean =>
    useCharacterSelectionStoreInternal((state) => state.chosen)
// 보유한 캐릭터 목록 — 홈 탭 ‹ › 순환 대상.
export const useOwnedCharacters = (): CharacterId[] =>
    useCharacterSelectionStoreInternal((state) => state.ownedCharacters)
// 캐릭터 뽑기 — 뽑기 탭에서 호출.
export const useRollCharacterGacha = (): (() => Promise<CharacterId | null>) =>
    useCharacterSelectionStoreInternal((state) => state.rollCharacterGacha)
