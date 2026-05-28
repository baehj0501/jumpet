import { css } from '@emotion/react'
import { LINK_BAR_LAYOUT } from '@shared/contracts/linkBarLayout'

// 항목 높이는 main의 BrowserWindow 높이 계산과 동기화돼야 하므로 shared contracts의 상수를 사용.
// padding은 좌우만, 수직은 align-items: center로 emoji/이름을 가운데 정렬.
export const buttonStyle = css({
    width: '100%',
    height: LINK_BAR_LAYOUT.itemHeight,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 10px',
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
})

export const emojiStyle = css({
    fontSize: 18,
    lineHeight: 1,
    flexShrink: 0,
})

export const nameStyle = css({
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: 500,
    color: '#1a1a1a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
})
