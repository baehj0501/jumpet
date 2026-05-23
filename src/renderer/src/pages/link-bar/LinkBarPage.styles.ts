import { css } from '@emotion/react'

// 펫 윈도우와 동일하게 :root, body 배경을 transparent로 둬 미니 버튼만 보이게 한다.
// 관리 패널(LinkManagerPage)의 light theme과 격리하기 위해 페이지 단위 <Global>로 주입.
export const pageGlobalStyles = css`
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

export const containerStyle = css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
})

// 드래그 핸들 영역.
// 기본 alpha 0, 컨테이너 hover 시 0.3 — 사용자가 미니 버튼 창의 존재/드래그 가능성을 인지하는 단서.
// height 상수도 함께 export — LinkBarPage가 핸들 영역 크기를 의미 단위로 참조할 수 있게.
export const DRAG_HANDLE_HEIGHT = 10

export const dragHandleStyle = css({
    height: DRAG_HANDLE_HEIGHT,
    flexShrink: 0,
    cursor: 'move',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.12s ease',
    'div:hover > &': {
        opacity: 0.3,
    },
})

export const dragHandleIndicatorStyle = css({
    width: 36,
    height: 3,
    borderRadius: 2,
    background: '#999999',
})

export const listStyle = css({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '4px 6px 8px',
    listStyle: 'none',
    overflow: 'hidden',
})
