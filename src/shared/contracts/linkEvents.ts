// 링크 영속 데이터의 IPC 계약.
// main reducer · preload bridge · renderer mirror 세 곳이 모두 이 한 파일을 import한다.

// 명세 §9.3에서 허용된 이모지 12종.
// as const tuple로 두어 LinkEmoji union 도출 + 런타임 Set 검증 양쪽에 동일 소스로 쓴다.
export const LINK_EMOJIS = [
    '🔗',
    '🌐',
    '💼',
    '📚',
    '🎮',
    '🎵',
    '📺',
    '🛒',
    '✉️',
    '📝',
    '⭐',
    '🏠',
] as const

export type LinkEmoji = (typeof LINK_EMOJIS)[number]

// 이모지 화이트리스트 검증.
// main reducer / store hydration / 필요 시 renderer까지 동일한 가드로 LinkEmoji union을 좁힌다.
// 화이트리스트(LINK_EMOJIS)가 단일 출처이므로 정책 변경 시 한 곳만 고치면 된다.
const LINK_EMOJI_SET: ReadonlySet<string> = new Set(LINK_EMOJIS)

export const isLinkEmoji = (value: unknown): value is LinkEmoji =>
    typeof value === 'string' && LINK_EMOJI_SET.has(value)

// 외부 브라우저로 열어도 안전한 URL 스킴인지 검사.
// main reducer의 normalizeUrl이 https:// 를 보장하지만, IPC 경계의 link:openExternal에서도
// 한 번 더 같은 정규식을 적용하므로 단일 헬퍼로 모아 둔다.
export const isAllowedExternalUrl = (value: unknown): value is string =>
    typeof value === 'string' && /^https?:\/\//i.test(value)

export type Link = {
    id: string
    emoji: LinkEmoji
    // 표시용 이름. main reducer가 trim + 최대 길이 슬라이스 후 저장하므로
    // 여기 들어 있는 값은 이미 정규화된 형태다.
    name: string
    // 'https://...' 또는 'http://...' 형태로 정규화된 URL.
    // 사용자가 'example.com'을 입력해도 reducer가 https:// 를 자동 prefix.
    url: string
}

export type LinkState = {
    // 0~MAX_LINKS 개. 추가 순서대로 보관 (정렬 기능은 미래 reorder 이벤트로 확장).
    links: Link[]
}

// 명세 — 최대 5개. 초과 시 'add' 이벤트는 무시.
export const MAX_LINKS = 5

// 명세 §9.3 — 이름은 최대 20자.
export const MAX_LINK_NAME_LENGTH = 20

// 의도적으로 의미 단위 이벤트만 노출한다. 자세한 정규화/검증은 main reducer 책임.
export type LinkEvent =
    | { type: 'add'; emoji: LinkEmoji; name: string; url: string }
    | { type: 'remove'; id: string }
    // 부분 업데이트. 미정의 필드는 그대로 유지한다.
    | { type: 'update'; id: string; emoji?: LinkEmoji; name?: string; url?: string }

export const INITIAL_LINK_STATE: LinkState = {
    links: [],
}
