import { css } from '@emotion/react'

// 페이지 단위 root-level 스타일(:root, body)을 emotion <Global>로 주입한다.
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
    marginBottom: 10,
    color: '#1a1a1a',
})

// 100개 한도 초과로 자동 정리된 todo 알림. aria-live polite와 함께 사용.
export const evictionBannerStyle = css({
    margin: '8px 14px 0',
    padding: '8px 12px',
    borderRadius: 6,
    background: '#fff7e0',
    border: '1px solid #f0d784',
    fontSize: 12,
    color: '#8a6d1f',
    lineHeight: 1.4,
})
