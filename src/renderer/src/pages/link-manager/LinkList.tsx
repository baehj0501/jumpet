import type { Link, LinkEmoji } from '@renderer/entities/link'
import { LinkItem } from './LinkItem'

type LinkListProps = {
    links: Link[]
    onOpen: (url: string) => void
    onRemove: (id: string) => void
    onUpdate: (id: string, patch: { emoji?: LinkEmoji; name?: string; url?: string }) => void
}

export const LinkList = ({ links, onOpen, onRemove, onUpdate }: LinkListProps) => {
    if (links.length === 0) {
        return (
            <div
                css={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#aaaaaa',
                    fontSize: 13,
                }}
            >
                아직 등록된 링크가 없어요
            </div>
        )
    }

    return (
        <ul
            css={{
                flex: 1,
                overflowY: 'auto',
                padding: '6px 4px',
                listStyle: 'none',
            }}
        >
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
