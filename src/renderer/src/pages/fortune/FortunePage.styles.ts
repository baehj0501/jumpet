import { css } from '@emotion/react'

// 페이지 단위 root-level 스타일. 펫 윈도우의 transparent 배경과 격리.
export const pageGlobalStyles = css`
    :root {
        color-scheme: light;
    }

    body {
        background: #fff7fb;
        color: #2a1830;
    }
`

export const containerStyle = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '24px 22px',
    textAlign: 'center',
    gap: 14,
})

export const titleStyle = css({
    fontSize: 14,
    fontWeight: 600,
    color: '#a05a86',
    letterSpacing: '0.04em',
})

export const levelBadgeStyle = css({
    fontSize: 30,
    fontWeight: 700,
    color: '#d05090',
    lineHeight: 1.1,
})

export const messageStyle = css({
    fontSize: 16,
    lineHeight: 1.6,
    color: '#2a1830',
    maxWidth: 280,
})

export const scoreStyle = css({
    fontSize: 13,
    fontWeight: 600,
    color: '#7a9a3a',
    background: '#f0f6df',
    border: '1px solid #d6e6a8',
    borderRadius: 999,
    padding: '5px 14px',
})

export const loadingStyle = css({
    fontSize: 14,
    color: '#a08aa0',
})

export const closeButtonStyle = css({
    marginTop: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#a05a86',
    background: 'transparent',
    border: '1px solid #e6b8d4',
    borderRadius: 8,
    padding: '7px 18px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    ':hover': {
        background: '#fbe9f3',
    },
})
