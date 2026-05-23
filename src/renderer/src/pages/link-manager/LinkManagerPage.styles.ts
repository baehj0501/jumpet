import { css } from '@emotion/react'

// 펫 윈도우의 global.css(transparent 배경)와 격리되어 이 창에서만 적용된다.
export const pageGlobalStyles = css`
    :root {
        color-scheme: light;
    }

    body {
        background: #f7f7f7;
        color: #1a1a1a;
    }
`

export const containerStyle = css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#ffffff',
})

export const headerStyle = css({
    padding: '16px 18px 12px',
    borderBottom: '1px solid #eeeeee',
})

export const titleStyle = css({
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 4,
    color: '#1a1a1a',
})

export const subtitleStyle = css({
    fontSize: 12,
    color: '#888888',
    marginBottom: 12,
})
