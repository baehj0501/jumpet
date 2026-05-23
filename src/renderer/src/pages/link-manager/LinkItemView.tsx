import { memo } from 'react'
import type { MouseEvent } from 'react'
import type { Link } from '@renderer/entities/link'
import {
    actionsAreaStyle,
    editButtonStyle,
    emojiStyle,
    itemStyle,
    nameStyle,
    removeButtonStyle,
    textColumnStyle,
    urlStyle,
} from './LinkItemView.styles'

type LinkItemViewProps = {
    link: Link
    onOpen: (url: string) => void
    onRequestEdit: () => void
    onRemove: (id: string) => void
}

// 링크 항목 보기 모드.
// li 전체가 클릭 가능 = 외부 열기. 호버 시 노출되는 편집/삭제 버튼은 액션 분리를 위해
// 클릭 시 stopPropagation. 단일 wrapper(div) 한 곳에서 stopPropagation을 모아 다음 두 가지를 보장:
//   1) 호버 액션 버튼이 li의 외부 열기와 충돌하지 않는다.
//   2) "버튼마다 stopPropagation을 잊으면 URL이 열리는" 함정을 없앤다.
export const LinkItemView = memo(({ link, onOpen, onRequestEdit, onRemove }: LinkItemViewProps) => {
    const handleOpen = () => {
        onOpen(link.url)
    }

    const handleRemove = () => {
        onRemove(link.id)
    }

    // 호버 액션 영역 클릭은 항상 외부 열기 핸들러로 전파되지 않게 한다.
    // 안쪽 버튼들은 자체 onClick에서 stopPropagation을 다시 호출할 필요가 없다.
    const handleActionsClick = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
    }

    return (
        <li
            css={itemStyle}
            onClick={handleOpen}
        >
            <span
                css={emojiStyle}
                aria-hidden='true'
            >
                {link.emoji}
            </span>
            <div css={textColumnStyle}>
                <span css={nameStyle}>{link.name}</span>
                <span css={urlStyle}>{link.url}</span>
            </div>
            <div
                css={actionsAreaStyle}
                onClick={handleActionsClick}
            >
                <button
                    type='button'
                    css={editButtonStyle}
                    onClick={onRequestEdit}
                    aria-label='편집'
                >
                    ✎
                </button>
                <button
                    type='button'
                    css={removeButtonStyle}
                    onClick={handleRemove}
                    aria-label='삭제'
                >
                    ×
                </button>
            </div>
        </li>
    )
})
