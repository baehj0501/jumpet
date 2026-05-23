import Store from 'electron-store'
import { INITIAL_LINK_BAR_STATE, type LinkBarPosition, type LinkBarState } from './linkBarState'

// linkBar의 UI 상태(visibility, position)만 영속화한다.
// 링크 데이터 자체는 별도 link 도메인의 store.
type SchemaShape = {
    linkBar: LinkBarState
}

const store = new Store<SchemaShape>({
    defaults: {
        linkBar: INITIAL_LINK_BAR_STATE,
    },
})

const isPosition = (value: unknown): value is LinkBarPosition => {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    const candidate = value as Record<string, unknown>
    return (
        typeof candidate.x === 'number' &&
        Number.isFinite(candidate.x) &&
        typeof candidate.y === 'number' &&
        Number.isFinite(candidate.y)
    )
}

export const readLinkBarState = (): LinkBarState => {
    const raw = store.get('linkBar') as LinkBarState | undefined
    if (raw && typeof raw.visible === 'boolean') {
        // position은 null 허용 — 첫 실행 시 default.
        const safePosition = raw.position && isPosition(raw.position) ? raw.position : null
        return { visible: raw.visible, position: safePosition }
    }
    console.warn('[linkBarState] hydration failed, resetting to INITIAL_LINK_BAR_STATE', raw)
    store.set('linkBar', INITIAL_LINK_BAR_STATE)
    return INITIAL_LINK_BAR_STATE
}

export const writeLinkBarState = (next: LinkBarState): void => {
    store.set('linkBar', next)
}
