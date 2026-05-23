import { useRef } from 'react'
import { Global } from '@emotion/react'
import { useLinkActions, useLinks } from '@renderer/entities/link'
import { useWindowDrag } from '@renderer/features/drag'
import { LinkMiniButton } from './LinkMiniButton'
import {
    containerStyle,
    dragHandleIndicatorStyle,
    dragHandleStyle,
    listStyle,
    pageGlobalStyles,
} from './LinkBarPage.styles'

// 미니 버튼 플로팅 창의 루트.
// 펫 윈도우와 동일하게 :root, body 배경을 transparent로 둬 미니 버튼만 보이게 한다.
export const LinkBarPage = () => {
    const links = useLinks()
    const { openLink } = useLinkActions()

    // 미니 버튼 창에는 자율 행동(walking)이 없다.
    // useWindowDrag는 isInteractingRef를 required로 받지만 여기선 의미가 없어 noop ref를 주입.
    // false ↔ true 토글이 일어나도 구독자가 없으므로 무해.
    const noopInteractingRef = useRef(false)
    const { handleMouseDown } = useWindowDrag({ isInteractingRef: noopInteractingRef })

    return (
        <>
            <Global styles={pageGlobalStyles} />
            <div css={containerStyle}>
                <div
                    css={dragHandleStyle}
                    onMouseDown={handleMouseDown}
                    aria-label='드래그 핸들'
                    role='separator'
                >
                    <div css={dragHandleIndicatorStyle} />
                </div>
                <ul css={listStyle}>
                    {links.map((link) => (
                        <LinkMiniButton
                            key={link.id}
                            link={link}
                            onOpen={openLink}
                        />
                    ))}
                </ul>
            </div>
        </>
    )
}
