import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { Link, LinkEmoji, LinkEvent } from '@shared/contracts/linkEvents'

// 링크 데이터의 renderer 측 글로벌 store.
// main이 SSOT이고, 이 store는 main 데이터의 read-only 미러 + 의미 단위 액션의 진입점이다.
// usePlayerStore / useTodoStore와 같은 패턴 — entrypoint가 initializeLinkSync()를 1회 호출.

// update 이벤트의 patch 모양을 contracts에서 도출한다 — 단일 출처.
type LinkUpdatePatch = Omit<Extract<LinkEvent, { type: 'update' }>, 'type' | 'id'>

type LinkActions = {
    addLink: (emoji: LinkEmoji, name: string, url: string) => Promise<void>
    removeLink: (id: string) => Promise<void>
    updateLink: (id: string, patch: LinkUpdatePatch) => Promise<void>
    // 외부 브라우저로 열기. main이 prefix 검증 후 shell.openExternal.
    openLink: (url: string) => void
}

type LinkStore = {
    links: Link[]
} & LinkActions

// 액션이 IPC apply 후 즉시 setState하는 것은 *낙관적 갱신*이다.
// - 같은 윈도우에서 발신한 액션을 broadcast 도착을 기다리지 않고 곧바로 반영해 UI 지연을 없앤다.
// - main이 SSOT이므로 broadcast가 도착하면 같은 데이터로 한 번 더 set되지만,
//   reducer가 같은 객체 reference를 반환하지 않는 한 short-circuit은 안 걸린다.
//   현 도메인 규모(최대 5개 링크)에서 추가 1회 리렌더 비용은 무시 가능.
// - 일관성: usePlayerStore / useTodoStore도 동일 정책.
const useLinkStoreInternal = create<LinkStore>((set) => ({
    links: [],
    addLink: async (emoji, name, url) => {
        const next = await window.api.link.apply({ type: 'add', emoji, name, url })
        set({ links: next.links })
    },
    removeLink: async (id) => {
        const next = await window.api.link.apply({ type: 'remove', id })
        set({ links: next.links })
    },
    updateLink: async (id, patch) => {
        const next = await window.api.link.apply({ type: 'update', id, ...patch })
        set({ links: next.links })
    },
    openLink: (url) => {
        window.api.link.openExternal(url)
    },
}))

// 모듈 단위 초기화 가드. HMR 재평가 시 listener가 누적되지 않게 dispose도 같이 둔다.
let isInitialized = false
let unsubscribeFromChanges: (() => void) | null = null

export const initializeLinkSync = (): void => {
    if (isInitialized) {
        return
    }
    isInitialized = true

    void window.api.link
        .get()
        .then((state) => {
            useLinkStoreInternal.setState({ links: state.links })
        })
        .catch(() => {
            // 패널 창이 닫히는 타이밍 등으로 IPC가 단절되면 조용히 무시.
        })
    unsubscribeFromChanges = window.api.link.onChange((state) => {
        useLinkStoreInternal.setState({ links: state.links })
    })
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        unsubscribeFromChanges?.()
        unsubscribeFromChanges = null
        isInitialized = false
    })
}

// 분할 selector — links 변경 시 액션-only 구독자는 재렌더되지 않는다.
export const useLinks = () => useLinkStoreInternal((state) => state.links)
export const useLinkActions = (): LinkActions =>
    useLinkStoreInternal(
        useShallow((state) => ({
            addLink: state.addLink,
            removeLink: state.removeLink,
            updateLink: state.updateLink,
            openLink: state.openLink,
        })),
    )

export type { LinkUpdatePatch }
