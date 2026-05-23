import { css } from '@emotion/react'

export const itemStyle = css({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    '&:hover': {
        background: '#f3f6fb',
    },
})

export const emojiStyle = css({
    fontSize: 18,
    lineHeight: 1,
    flexShrink: 0,
})

export const textColumnStyle = css({
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
})

export const nameStyle = css({
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.3,
    color: '#1a1a1a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
})

export const urlStyle = css({
    fontSize: 11,
    color: '#888888',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
})

// 호버 액션 영역. 부모 li:hover 시 opacity 0 → 1.
// 자식 버튼들의 stopPropagation 책임을 wrapper 한 곳에 모으는 단일 클릭 컨테이너.
export const actionsAreaStyle = css({
    display: 'flex',
    gap: 2,
    flexShrink: 0,
    opacity: 0,
    transition: 'opacity 0.12s ease',
    'li:hover > &': {
        opacity: 1,
    },
})

export const editButtonStyle = css({
    background: 'transparent',
    border: 'none',
    padding: '4px 8px',
    cursor: 'pointer',
    color: '#888888',
    fontSize: 13,
    borderRadius: 4,
    '&:hover': {
        color: '#4a90e2',
        background: '#eaf2fc',
    },
})

export const removeButtonStyle = css({
    background: 'transparent',
    border: 'none',
    padding: '4px 8px',
    cursor: 'pointer',
    color: '#cccccc',
    fontSize: 16,
    lineHeight: 1,
    borderRadius: 4,
    '&:hover': {
        color: '#e25b5b',
        background: '#ffefef',
    },
})
