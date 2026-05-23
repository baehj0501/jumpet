import { memo } from 'react'
import type { Link } from '@renderer/entities/link'
import { buttonStyle, emojiStyle, nameStyle } from './LinkMiniButton.styles'

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
                css={buttonStyle}
                onClick={handleClick}
                aria-label={`${link.name} 열기`}
                title={link.url}
            >
                <span
                    css={emojiStyle}
                    aria-hidden='true'
                >
                    {link.emoji}
                </span>
                <span css={nameStyle}>{link.name}</span>
            </button>
        </li>
    )
})
