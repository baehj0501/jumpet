import { css } from '@emotion/react'

export const footerStyle = css({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderTop: '1px solid #eeeeee',
    fontSize: 12,
    color: '#666666',
})

export const countLabelStyle = css({
    flexShrink: 0,
})

export const filterGroupStyle = css({
    display: 'flex',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-end',
})

// 필터 버튼. data-active 셀렉터로 선택 상태 강조.
export const filterButtonStyle = css({
    background: 'transparent',
    border: '1px solid transparent',
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
    color: 'inherit',
    '&:hover': {
        borderColor: '#dcdcdc',
    },
    '&[data-active="true"]': {
        borderColor: '#4a90e2',
        color: '#4a90e2',
    },
})
