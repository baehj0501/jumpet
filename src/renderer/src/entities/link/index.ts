// Public API of the link entity.
// 외부 layer는 이 barrel을 통해서만 import한다.
export type { Link, LinkEmoji, LinkEvent, LinkState } from '@shared/contracts/linkEvents'
export { LINK_EMOJIS, MAX_LINKS, MAX_LINK_NAME_LENGTH } from '@shared/contracts/linkEvents'
export { useLinks, useLinkActions, initializeLinkSync } from './model/useLinkStore'
export type { LinkUpdatePatch } from './model/useLinkStore'
