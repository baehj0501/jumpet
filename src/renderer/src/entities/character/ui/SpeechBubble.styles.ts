import { css } from '@emotion/react'

// 메뉴 테마(하늘색)에 맞춘 말풍선 색.
const BORDER_COLOR = '#2f6aa8' // 테두리(진한 파랑)
const FILL_COLOR = '#eaf6ff' // 채움(옅은 하늘)
const TEXT_COLOR = '#0a3050' // 본문 텍스트(네이비)

// 계단(픽셀) 라운드 모서리 — 각 모서리를 3px×2단으로 깎는다(총 ~6px).
// 부드러운 border-radius가 아니라 사각 블록으로 깎인 픽셀아트 모서리.
const PIXEL_CLIP = `polygon(
    0 6px, 3px 6px, 3px 3px, 6px 3px, 6px 0,
    calc(100% - 6px) 0, calc(100% - 6px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 6px, 100% 6px,
    100% calc(100% - 6px), calc(100% - 3px) calc(100% - 6px), calc(100% - 3px) calc(100% - 3px), calc(100% - 6px) calc(100% - 3px), calc(100% - 6px) 100%,
    6px 100%, 6px calc(100% - 3px), 3px calc(100% - 3px), 3px calc(100% - 6px), 0 calc(100% - 6px)
)`

// 머리 위 배치 + 픽셀 오프셋 그림자(드롭섀도라 계단 모양을 따라간다).
export const wrapperStyle = css({
    position: 'absolute',
    top: 2,
    left: '50%',
    // 창 너비(최대 ~240px)보다 좁게 — 긴 멘트가 좌우로 잘리지 않게 줄바꿈시킨다.
    maxWidth: 200,
    width: 'max-content',
    pointerEvents: 'none',
    zIndex: 10,
    filter: 'drop-shadow(3px 3px 0 rgba(0, 0, 0, 0.22))',
})

// 테두리 레이어 — 어두운 색을 계단 모양으로 깎고, padding 2px가 테두리 두께가 된다.
export const boxStyle = css({
    background: BORDER_COLOR,
    clipPath: PIXEL_CLIP,
    padding: 2,
})

// 채움 레이어 — 같은 계단 모양. text를 담는다.
export const fillStyle = css({
    background: FILL_COLOR,
    clipPath: PIXEL_CLIP,
    padding: '7px 11px',
    fontFamily: "'Galmuri11', 'Apple SD Gothic Neo', sans-serif",
    fontSize: 13,
    lineHeight: 1.4,
    color: TEXT_COLOR,
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
})

// 본문 아래 우측 정렬 이름 태그(예: "윙피가").
export const tagStyle = css({
    display: 'block',
    textAlign: 'right',
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
    whiteSpace: 'nowrap',
})

// sticky 알림 말풍선의 닫기(X) 버튼 — 우상단 모서리에 작은 원형 배지.
export const closeStyle = css({
    position: 'absolute',
    top: -7,
    right: -7,
    width: 17,
    height: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: BORDER_COLOR,
    color: '#fff',
    border: '2px solid #fff',
    borderRadius: '50%',
    fontSize: 9,
    lineHeight: 1,
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'inherit',
    zIndex: 1,
})

// 픽셀 꼬리 — 계단형(아래로 좁아지는) 블록. 채움색 + 좌우 어두운 테두리.
export const tailStyle = css({
    position: 'absolute',
    bottom: -5,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 8,
    height: 5,
    background: FILL_COLOR,
    borderLeft: `2px solid ${BORDER_COLOR}`,
    borderRight: `2px solid ${BORDER_COLOR}`,
    '&::after': {
        content: '""',
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 4,
        height: 4,
        background: FILL_COLOR,
        borderLeft: `2px solid ${BORDER_COLOR}`,
        borderRight: `2px solid ${BORDER_COLOR}`,
        borderBottom: `2px solid ${BORDER_COLOR}`,
    },
})
