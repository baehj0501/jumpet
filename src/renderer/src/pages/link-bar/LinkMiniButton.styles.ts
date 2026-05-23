import { css } from '@emotion/react'

export const buttonStyle = css({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
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
