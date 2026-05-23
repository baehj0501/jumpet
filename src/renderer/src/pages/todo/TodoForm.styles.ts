import { css } from '@emotion/react'

export const formStyle = css({
    display: 'flex',
})

export const inputStyle = css({
    flex: 1,
    padding: '9px 12px',
    fontSize: 14,
    border: '1px solid #dcdcdc',
    borderRadius: 6,
    outline: 'none',
    background: '#ffffff',
    color: 'inherit',
    '&:focus': {
        borderColor: '#4a90e2',
    },
})
