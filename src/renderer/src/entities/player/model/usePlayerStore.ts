import { create } from 'zustand'
import { INITIAL_PLAYER_STATE, type PlayerEvent, type PlayerState } from './PlayerState'

// 플레이어 데이터의 renderer 측 글로벌 store.
// main이 SSOT이고, 이 store는 main 데이터의 read-only 미러 + apply 액션의 진입점이다.
//
// store가 처음 모듈 로드될 때 한 번 main에 초기 상태를 요청하고,
// 'player:changed' broadcast를 구독해 자동 동기화한다.
// → 어느 BrowserWindow든 store를 가져오기만 하면 같은 값이 들어와 있다.

type PlayerStore = {
    player: PlayerState
    apply: (event: PlayerEvent) => Promise<void>
}

export const usePlayerStore = create<PlayerStore>((set) => ({
    player: INITIAL_PLAYER_STATE,
    apply: async (event: PlayerEvent) => {
        // main이 reduce + 영속화 + broadcast까지 처리하므로,
        // 여기서는 응답값을 그대로 store에 반영해 두면 onChange 도착 전에도 즉시 UI가 갱신된다.
        const next = await window.api.player.apply(event)
        set({ player: next })
    },
}))

// 모듈 단위 초기화 가드.
// 모듈은 정상 흐름에서 한 번만 평가되지만 Vite HMR이 켜진 dev 환경에서는 재평가될 수 있다.
// 그때 listener가 누적되지 않도록 guard + dispose를 같이 둔다.
let isInitialized = false
let unsubscribeFromChanges: (() => void) | null = null

const initializePlayerSync = (): void => {
    if (isInitialized) {
        return
    }
    isInitialized = true

    void window.api.player.get().then((state) => {
        usePlayerStore.setState({ player: state })
    })
    unsubscribeFromChanges = window.api.player.onChange((state) => {
        usePlayerStore.setState({ player: state })
    })
}

if (import.meta.hot) {
    // dev HMR: 모듈이 다음 번 평가될 때 이전 listener를 정리하고 guard도 풀어준다.
    import.meta.hot.dispose(() => {
        unsubscribeFromChanges?.()
        unsubscribeFromChanges = null
        isInitialized = false
    })
}

initializePlayerSync()
