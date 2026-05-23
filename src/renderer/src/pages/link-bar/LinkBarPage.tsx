import { useRef } from 'react'
import { Global, css } from '@emotion/react'
import { useLinkActions, useLinks } from '@renderer/entities/link'
import { useWindowDrag } from '@renderer/features/drag'
import { LinkMiniButton } from './LinkMiniButton'

// 미니 버튼 플로팅 창의 루트.
// 펫 윈도우와 동일하게 :root, body 배경을 transparent로 둬 미니 버튼만 보이게 한다.
// 관리 패널(LinkManagerPage)의 light theme과 격리하기 위해 페이지 단위 <Global>로 주입.
const pageGlobalStyles = css`
    :root {
        background-color: transparent;
        color-scheme: light;
    }

    html,
    body,
    #root {
        background: transparent;
        overflow: hidden;
    }
`

// 드래그 핸들 영역 높이. 너무 좁으면 마우스로 잡기 어렵고, 너무 넓으면 미니 버튼 영역을 잠식.
const DRAG_HANDLE_HEIGHT = 10

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
            <div
                css={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                }}
            >
                {/* 드래그 핸들. 기본은 거의 invisible, 컨테이너 hover 시 옅게 노출. */}
                <div
                    css={{
                        height: DRAG_HANDLE_HEIGHT,
                        flexShrink: 0,
                        cursor: 'move',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.12s ease',
                        // 부모 컨테이너에 hover가 걸리면 핸들이 살짝 보인다.
                        // 사용자가 미니 버튼 창의 존재/드래그 가능성을 인지할 수 있게 하는 단서.
                        'div:hover > &': {
                            opacity: 0.3,
                        },
                    }}
                    onMouseDown={handleMouseDown}
                    aria-label='드래그 핸들'
                    role='separator'
                >
                    <div
                        css={{
                            width: 36,
                            height: 3,
                            borderRadius: 2,
                            background: '#999999',
                        }}
                    />
                </div>
                <ul
                    css={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        padding: '4px 6px 8px',
                        listStyle: 'none',
                        overflow: 'hidden',
                    }}
                >
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
