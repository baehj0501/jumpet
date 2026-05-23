import { css } from '@emotion/react'

export const formStyle = (disabled: boolean) =>
    css({
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
    })

export const submitRowStyle = css({
    display: 'flex',
    justifyContent: 'flex-end',
})

export const submitButtonStyle = css({
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 500,
    border: 'none',
    borderRadius: 6,
    background: '#4a90e2',
    color: '#ffffff',
    cursor: 'pointer',
    '&:hover': {
        background: '#3a7ec8',
    },
    '&:disabled': {
        background: '#bdbdbd',
        cursor: 'not-allowed',
    },
})
