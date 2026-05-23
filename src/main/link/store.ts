import Store from 'electron-store'
import {
    INITIAL_LINK_STATE,
    isLinkEmoji,
    type Link,
    type LinkState,
} from '@shared/contracts/linkEvents'

// playerState/todoState와 같은 디스크 영속 패턴.
// 별도 Store 인스턴스를 만들어도 electron-store는 같은 config.json에 키를 추가한다.
type SchemaShape = {
    link: LinkState
}

const store = new Store<SchemaShape>({
    defaults: {
        link: INITIAL_LINK_STATE,
    },
})

// isLink 가드는 emoji 필드까지 LinkEmoji union으로 좁힌다.
// 통과한 raw 값은 그대로 Link 타입으로 안전하게 다룰 수 있어 호출자가 추가 cast를 할 필요가 없다.
const isLink = (value: unknown): value is Link => {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    const candidate = value as Record<string, unknown>
    if (typeof candidate.id !== 'string') return false
    if (typeof candidate.name !== 'string') return false
    if (typeof candidate.url !== 'string') return false
    if (!isLinkEmoji(candidate.emoji)) return false
    return true
}

export const readLinkState = (): LinkState => {
    // 디스크 손상·사용자 자가 편집·LINK_EMOJIS 축소(제거된 이모지를 보유 중이던 경우 등)로
    // 깨진 값이 들어올 수 있어 항목 단위로 검증한다. 일부만 깨졌다면 살릴 수 있는 것만 살린다.
    const raw = store.get('link') as LinkState | undefined
    if (raw && Array.isArray(raw.links)) {
        const sanitized = raw.links.filter(isLink)
        return { links: sanitized }
    }
    console.warn('[linkState] hydration failed, resetting to INITIAL_LINK_STATE', raw)
    store.set('link', INITIAL_LINK_STATE)
    return INITIAL_LINK_STATE
}

export const writeLinkState = (next: LinkState): void => {
    store.set('link', next)
}
