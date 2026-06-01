import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import {
    INITIAL_PROFILE_STATE,
    type ProfileField,
    type ProfileState,
} from '@shared/contracts/profileEvents'

// 홈 프로필(캐릭터 이름·이름·생일)의 renderer 측 글로벌 store.
// main이 SSOT — 메뉴 창(CareTab)·펫 창(App)이 같은 값을 구독한다.
// usePlayerStore와 같은 패턴 — entrypoint(menu/main.tsx, app/main.tsx)가 sync를 1회 호출.

type ProfileActions = {
    setField: (field: ProfileField, value: string) => Promise<void>
}

type ProfileStore = {
    profile: ProfileState
} & ProfileActions

const useProfileStoreInternal = create<ProfileStore>((set) => ({
    profile: INITIAL_PROFILE_STATE,
    setField: async (field, value) => {
        const next = await window.api.profile.apply({ type: 'set', field, value })
        set({ profile: next })
    },
}))

let isInitialized = false
let unsubscribeFromChanges: (() => void) | null = null

export const initializeProfileSync = (): void => {
    if (isInitialized) {
        return
    }
    isInitialized = true

    void window.api.profile
        .get()
        .then((state) => {
            useProfileStoreInternal.setState({ profile: state })
        })
        .catch(() => {
            // 창이 닫히는 타이밍 등으로 IPC가 단절되면 조용히 무시.
        })
    unsubscribeFromChanges = window.api.profile.onChange((state) => {
        useProfileStoreInternal.setState({ profile: state })
    })
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        unsubscribeFromChanges?.()
        unsubscribeFromChanges = null
        isInitialized = false
    })
}

export const useProfile = () => useProfileStoreInternal((state) => state.profile)
export const useProfileActions = (): ProfileActions =>
    useProfileStoreInternal(
        useShallow((state) => ({
            setField: state.setField,
        })),
    )
// 훅 밖(이벤트 핸들러 등)에서 최신 프로필을 읽을 때.
export const getProfileSnapshot = (): ProfileState => useProfileStoreInternal.getState().profile
