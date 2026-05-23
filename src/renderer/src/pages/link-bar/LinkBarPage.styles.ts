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

// 컨테이너 전체가 드래그 가능 영역. 미니 버튼 위에서만 cursor가 'pointer'로 덮인다.
// 빈 영역(아이템 사이 gap, padding, 핸들)을 잡아 자유롭게 옮길 수 있다.
//
// 반투명 카드 — macOS의 transparent BrowserWindow는 *완전 투명 픽셀*에서 mouse 이벤트를
// 뒷창으로 통과시킨다(click-through). 컨테이너에 반투명 background를 줘서 위젯 전체 영역이
// mouse 이벤트를 잡게 한다. 시각적으로도 "이게 옮길 수 있는 위젯"이라는 신호가 자연스럽게 전해진다.
export const containerStyle = css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    cursor: 'move',
    background: 'rgba(248, 248, 248, 0.92)',
    borderRadius: 10,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
    // 자식이 borderRadius를 넘지 않게.
    overflow: 'hidden',
})

// 드래그 핸들 영역.
// 카드 위에 얹혀 있어 click-through 문제 없음. 막대 indicator는 시각 단서로 유지.
// height 상수도 함께 export — LinkBarPage가 핸들 영역 크기를 의미 단위로 참조할 수 있게.
export const DRAG_HANDLE_HEIGHT = 16

export const dragHandleStyle = css({
    height: DRAG_HANDLE_HEIGHT,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
    transition: 'opacity 0.12s ease',
    '&:hover': {
        opacity: 0.85,
    },
})

// 핸들 시각 — 가로 막대. 사이즈/색을 충분히 잡아 작은 핸들에서도 잘 보이게.
export const dragHandleIndicatorStyle = css({
    width: 40,
    height: 4,
    borderRadius: 2,
    background: '#666666',
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
