import { css } from '@emotion/react'

// 항목 높이는 명시 — main의 BrowserWindow 높이 계산이 이 값을 기준으로 한다.
// padding은 좌우만, 수직은 align-items: center로 emoji/이름을 가운데 정렬.
export const LINK_MINI_BUTTON_HEIGHT = 36

export const buttonStyle = css({
    width: '100%',
    height: LINK_MINI_BUTTON_HEIGHT,
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
