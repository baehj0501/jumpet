import type { Link, LinkEmoji } from '@renderer/entities/link'
import { LinkItem } from './LinkItem'
import { emptyStateStyle, listStyle } from './LinkList.styles'

type LinkListProps = {
    links: Link[]
    onOpen: (url: string) => void
    onRemove: (id: string) => void
    onUpdate: (id: string, patch: { emoji?: LinkEmoji; name?: string; url?: string }) => void
}

export const LinkList = ({ links, onOpen, onRemove, onUpdate }: LinkListProps) => {
    if (links.length === 0) {
        return <div css={emptyStateStyle}>아직 등록된 링크가 없어요</div>
    }

    return (
        <ul css={listStyle}>
            {links.map((link) => (
                <LinkItem
                    key={link.id}
                    link={link}
                    onOpen={onOpen}
                    onRemove={onRemove}
                    onUpdate={onUpdate}
                />
            ))}
        </ul>
    )
}
