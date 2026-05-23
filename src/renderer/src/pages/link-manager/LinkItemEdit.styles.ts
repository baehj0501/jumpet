import { css } from '@emotion/react'

export const itemStyle = css({
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 6,
    background: '#f7faff',
    border: '1px solid #cfe0f5',
})

export const actionsRowStyle = css({
    display: 'flex',
    gap: 6,
    justifyContent: 'flex-end',
})

export const cancelButtonStyle = css({
    padding: '4px 10px',
    fontSize: 12,
    border: '1px solid #dcdcdc',
    borderRadius: 4,
    background: '#ffffff',
    color: '#555555',
    cursor: 'pointer',
})

// 저장 버튼 — 빈 값 가드(isSubmittable)에 따라 색/cursor 변경.
export const saveButtonStyle = (isSubmittable: boolean) =>
    css({
        padding: '4px 10px',
        fontSize: 12,
        border: 'none',
        borderRadius: 4,
        background: isSubmittable ? '#4a90e2' : '#bdbdbd',
        color: '#ffffff',
        cursor: isSubmittable ? 'pointer' : 'not-allowed',
    })
