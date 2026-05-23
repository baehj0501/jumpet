import { css } from '@emotion/react'

// 캐릭터 컨테이너 — 부모 윈도우 크기 가득. 좌클릭 드래그 cursor 변화.
export const containerStyle = css({
    width: '100%',
    height: '100%',
    cursor: 'grab',
    userSelect: 'none',
    '&:active': {
        cursor: 'grabbing',
    },
})

// 캐릭터 이미지 — pointerEvents none으로 컨테이너의 mousedown/contextmenu가 가려지지 않게.
export const imageStyle = css({
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    pointerEvents: 'none',
})
