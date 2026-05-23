// 링크 영속 데이터의 SSOT reducer.
// 타입/시드/상한/이모지 가드는 @shared/contracts에서 import해
// main·preload·renderer가 동일 정의를 공유한다 (단일 출처).

import { randomUUID } from 'node:crypto'
import {
    MAX_LINKS,
    MAX_LINK_NAME_LENGTH,
    isLinkEmoji,
    type Link,
    type LinkEvent,
    type LinkState,
} from '@shared/contracts/linkEvents'

// URL을 정규화한다.
// 'example.com' → 'https://example.com'
// 이미 http(s):// 가 붙어 있으면 그대로 둔다.
// 비어 있으면 빈 문자열을 그대로 반환 → 호출부에서 거른다.
const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim()
    if (trimmed === '') {
        return ''
    }
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed
    }
    return `https://${trimmed}`
}

const normalizeName = (raw: string): string => raw.trim().slice(0, MAX_LINK_NAME_LENGTH)

// 부분 업데이트의 패치 적용 헬퍼.
// 1) 패치가 미지정(undefined)이면 기존값 유지
// 2) 정규화 결과가 빈 문자열이면 invariant 보호 차원에서 기존값 유지
// 3) 그 외엔 정규화된 새 값으로 교체
// emoji는 화이트리스트 검증 → 통과 시 새 값, 아니면 기존값 (정규화/빈 값 개념 없음).
const applyFieldPatch = (
    patch: string | undefined,
    current: string,
    normalize: (raw: string) => string,
): string => {
    if (patch === undefined) {
        return current
    }
    const normalized = normalize(patch)
    if (normalized === '') {
        return current
    }
    return normalized
}

// id는 reducer 안에서 randomUUID로 생성 — playerState/todoState도 동일한 정책 (랜덤/시각 의존 값은
// reducer 안에서 생성해 호출자가 enrich/dispatch를 둘로 나누지 않도록 한다).
export const reduceLinkState = (state: LinkState, event: LinkEvent): LinkState => {
    switch (event.type) {
        case 'add': {
            // 5개 가득 차면 무시 (명세). UI에서도 사전에 막아주지만 reducer가 최종 안전망.
            if (state.links.length >= MAX_LINKS) {
                return state
            }
            if (!isLinkEmoji(event.emoji)) {
                return state
            }
            const name = normalizeName(event.name)
            const url = normalizeUrl(event.url)
            if (name === '' || url === '') {
                return state
            }
            const newLink: Link = {
                id: randomUUID(),
                emoji: event.emoji,
                name,
                url,
            }
            return { links: [...state.links, newLink] }
        }
        case 'remove': {
            const next = state.links.filter((link) => link.id !== event.id)
            // 동일 reference 유지 — IPC 핸들러의 'next === current' 단축 경로가 동작한다.
            if (next.length === state.links.length) {
                return state
            }
            return { links: next }
        }
        case 'update': {
            const target = state.links.find((link) => link.id === event.id)
            if (!target) {
                return state
            }
            const nextEmoji =
                event.emoji !== undefined && isLinkEmoji(event.emoji) ? event.emoji : target.emoji
            const nextName = applyFieldPatch(event.name, target.name, normalizeName)
            const nextUrl = applyFieldPatch(event.url, target.url, normalizeUrl)
            if (nextEmoji === target.emoji && nextName === target.name && nextUrl === target.url) {
                return state
            }
            return {
                links: state.links.map((link) =>
                    link.id === event.id
                        ? { ...link, emoji: nextEmoji, name: nextName, url: nextUrl }
                        : link,
                ),
            }
        }
        default: {
            // LinkEvent union이 확장되면 TS가 event를 never로 좁히지 못해
            // 여기서 컴파일 에러로 잡아준다.
            const exhaustiveCheck: never = event
            throw new Error(`Unhandled LinkEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
