import { css } from '@emotion/react'

// 행 컨테이너. data-completed 셀렉터는 외부에서 텍스트 취소선 등에 활용 가능 (현재는 별도 분기).
// li:hover 셀렉터로 자식 삭제 버튼 노출.
export const itemStyle = css({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 14px',
    borderRadius: 6,
    cursor: 'default',
    '&:hover': {
        background: '#f3f6fb',
    },
})

// 토글 버튼(원/체크). 완료된 항목은 disabled — 단방향 정책.
export const toggleButtonStyle = (completed: boolean) =>
    css({
        background: 'transparent',
        border: 'none',
        padding: 0,
        fontSize: 16,
        lineHeight: 1,
        flexShrink: 0,
        cursor: completed ? 'default' : 'pointer',
        '&:disabled': {
            cursor: 'default',
        },
    })

// 편집 모드 input.
export const editInputStyle = css({
    flex: 1,
    padding: '4px 6px',
    fontSize: 14,
    border: '1px solid #4a90e2',
    borderRadius: 4,
    outline: 'none',
    background: '#ffffff',
    color: 'inherit',
    fontFamily: 'inherit',
})

// 텍스트 라벨. 완료 시 취소선 + 흐림.
export const labelStyle = (completed: boolean) =>
    css({
        flex: 1,
        fontSize: 14,
        lineHeight: 1.4,
        overflowWrap: 'anywhere',
        userSelect: 'none',
        cursor: 'text',
        ...(completed && {
            textDecoration: 'line-through',
            color: '#b0b0b0',
        }),
    })

// 완료 시각 표시. flex-shrink로 우측 정렬 유지.
export const completedAtStyle = css({
    fontSize: 11,
    color: '#aaaaaa',
    flexShrink: 0,
})

// 삭제 버튼. 부모 li:hover 시에만 노출.
export const removeButtonStyle = css({
    background: 'transparent',
    border: 'none',
    padding: '4px 8px',
    cursor: 'pointer',
    color: '#cccccc',
    fontSize: 16,
    lineHeight: 1,
    borderRadius: 4,
    opacity: 0,
    transition: 'opacity 0.12s ease',
    'li:hover > &': {
        opacity: 1,
    },
    '&:hover': {
        color: '#e25b5b',
        background: '#ffefef',
    },
})
