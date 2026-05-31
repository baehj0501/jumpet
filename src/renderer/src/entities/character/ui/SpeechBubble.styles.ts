import { css } from '@emotion/react'

// 캐릭터 머리 위 말풍선. 창(300×300, overflow hidden) 상단 중앙에 띄운다.
// pointerEvents none — 펫 드래그/우클릭이 말풍선에 가로막히지 않게.
export const bubbleStyle = css({
    position: 'absolute',
    top: 6,
    left: '50%',
    transform: 'translateX(-50%)',
    maxWidth: 250,
    width: 'max-content',
    padding: '7px 12px',
    background: 'rgba(255, 255, 255, 0.97)',
    border: '2px solid #3a3a3a',
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.4,
    color: '#2a2a2a',
    textAlign: 'center',
    fontWeight: 600,
    boxShadow: '2px 2px 0 rgba(0, 0, 0, 0.18)',
    pointerEvents: 'none',
    zIndex: 10,
    whiteSpace: 'pre-wrap',
    // 말풍선 꼬리(아래쪽 삼각형).
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: -8,
        left: '50%',
        transform: 'translateX(-50%)',
        borderLeft: '7px solid transparent',
        borderRight: '7px solid transparent',
        borderTop: '8px solid #3a3a3a',
    },
})
