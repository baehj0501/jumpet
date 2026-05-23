import { memo } from 'react'
import type { MouseEvent } from 'react'
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

    // 부모 컨테이너(LinkBarPage)가 onMouseDown으로 윈도우 드래그를 시작하기 때문에,
    // 미니 버튼 위에서 mousedown 이벤트가 컨테이너로 버블링되면 클릭 의도가 드래그로 새어 나간다.
    // stopPropagation으로 끊어 미니 버튼은 onClick 본연의 의미(외부 열기)만 수행하게 한다.
    const handleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
    }

    return (
        <li>
            <button
                type='button'
                css={buttonStyle}
                onMouseDown={handleMouseDown}
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
