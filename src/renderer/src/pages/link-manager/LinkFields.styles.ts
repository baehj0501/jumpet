import { css } from '@emotion/react'

// 입력 위젯의 크기 변형.
// - 'comfortable': 새 링크 추가 폼(LinkForm)에서 사용. 패널 헤더의 여유 있는 입력.
// - 'compact': 항목 인라인 편집(LinkItemEdit)에서 사용. 리스트 안 좁은 공간.
export type LinkFieldsSize = 'comfortable' | 'compact'

// 변형 모드 — 편집 시 input border를 강조 색(파랑)으로 표시.
export type LinkFieldsVariant = 'default' | 'focused'

type SizeTokens = {
    emojiButton: number
    emojiFontSize: number
    inputPadding: string
    inputFontSize: number
    gridGap: number
}

const SIZE_TOKENS: Record<LinkFieldsSize, SizeTokens> = {
    comfortable: {
        emojiButton: 28,
        emojiFontSize: 16,
        inputPadding: '8px 10px',
        inputFontSize: 13,
        gridGap: 4,
    },
    compact: {
        emojiButton: 24,
        emojiFontSize: 14,
        inputPadding: '5px 8px',
        inputFontSize: 13,
        gridGap: 3,
    },
}

export const containerStyle = css({
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
})

// 이모지 그리드 — gridGap만 size에 따라 다르다.
export const emojiGridStyle = (size: LinkFieldsSize) =>
    css({
        display: 'flex',
        flexWrap: 'wrap',
        gap: SIZE_TOKENS[size].gridGap,
    })

// 이모지 버튼 — 사이즈는 size에 따라, 선택 상태는 data-selected 셀렉터로.
export const emojiButtonStyle = (size: LinkFieldsSize) => {
    const tokens = SIZE_TOKENS[size]
    return css({
        width: tokens.emojiButton,
        height: tokens.emojiButton,
        border: '1px solid transparent',
        borderRadius: 6,
        background: 'transparent',
        fontSize: tokens.emojiFontSize,
        lineHeight: 1,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': {
            background: '#f0f3f8',
        },
        '&[data-selected="true"]': {
            borderColor: '#4a90e2',
            background: '#eaf2fc',
        },
    })
}

export const inputsColumnStyle = css({
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
})

// 입력 박스 — padding/fontSize/border 색이 size+variant에 따라 달라진다.
export const inputStyle = (size: LinkFieldsSize, variant: LinkFieldsVariant) => {
    const tokens = SIZE_TOKENS[size]
    const borderColor = variant === 'focused' ? '#4a90e2' : '#dcdcdc'
    return css({
        padding: tokens.inputPadding,
        fontSize: tokens.inputFontSize,
        border: `1px solid ${borderColor}`,
        borderRadius: 4,
        outline: 'none',
        background: '#ffffff',
        color: 'inherit',
        fontFamily: 'inherit',
        '&:focus': {
            borderColor: '#4a90e2',
        },
    })
}
