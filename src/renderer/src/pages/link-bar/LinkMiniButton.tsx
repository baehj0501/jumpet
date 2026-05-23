import { memo } from 'react'
import type { Link } from '@renderer/entities/link'

type LinkMiniButtonProps = {
    link: Link
    onOpen: (url: string) => void
}

// 미니 버튼 1개. 클릭 = 외부 브라우저 열기.
// memo로 감싸 부모(LinkBarPage)의 links 배열 안 다른 항목이 바뀌어도 reconcile 스킵.
// reducer가 변경 없는 link reference를 유지하므로 strict-equal로 충분.
export const LinkMiniButton = memo(({ link, onOpen }: LinkMiniButtonProps) => {
    const handleClick = () => {
        onOpen(link.url)
    }

    return (
        <li>
            <button
                type='button'
                css={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    border: '1px solid #e6e6e6',
                    borderRadius: 8,
                    background: '#ffffff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'background 0.12s ease, transform 0.06s ease',
                    '&:hover': {
                        background: '#f3f6fb',
                    },
                    '&:active': {
                        transform: 'scale(0.98)',
                    },
                }}
                onClick={handleClick}
                aria-label={`${link.name} 열기`}
                title={link.url}
            >
                <span
                    css={{
                        fontSize: 18,
                        lineHeight: 1,
                        flexShrink: 0,
                    }}
                    aria-hidden='true'
                >
                    {link.emoji}
                </span>
                <span
                    css={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#1a1a1a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {link.name}
                </span>
            </button>
        </li>
    )
})
