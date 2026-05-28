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
//
// 드래그 정책:
// - 컨테이너 전체에 onMouseDown을 바인딩 — 핸들/리스트 padding/아이템 사이 gap 어디서든 드래그.
// - LinkMiniButton 내부는 자체 onMouseDown에서 stopPropagation으로 드래그 시작을 막아
//   짧은 클릭이 외부 열기로 정상 발화한다.
// - 자율 행동이 없는 윈도우라 useWindowDrag에 콜백 미주입 — hook이 인터랙션 ref/walking 정책을 모르게 한다.
export const LinkBarPage = () => {
    const links = useLinks()
    const { openLink } = useLinkActions()

    const { handleMouseDown } = useWindowDrag()

    return (
        <>
            <Global styles={pageGlobalStyles} />
            <div
                css={containerStyle}
                onMouseDown={handleMouseDown}
            >
                <div
                    css={dragHandleStyle}
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
