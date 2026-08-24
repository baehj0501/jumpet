import {
    boxStyle,
    closeStyle,
    fillStyle,
    tagStyle,
    tailStyle,
    wrapperStyle,
} from './SpeechBubble.styles'

type SpeechBubbleProps = {
    text: string
    // 우측 정렬로 본문 위에 얹는 이름 태그(예: "윙피가"). 없으면 표시 안 함.
    tag?: string
    // 캐릭터 크기에 맞춘 말풍선 배율(≤1). 작은 캐릭터에서 겹침/잘림을 막으려 같이 줄인다. 기본 1.
    scale?: number
    // 알림(sticky) 말풍선이면 자동으로 사라지지 않고, 닫기(X) 버튼/클릭으로만 닫힌다.
    sticky?: boolean
    // sticky일 때 닫기 콜백. 말풍선 클릭 또는 X 버튼 클릭 시 호출.
    onClose?: () => void
    // 큰 캐릭터(머리가 창 위쪽)용 — 값을 주면 말풍선을 '아래(머리 위 지점)'에 고정하고 위로 자란다.
    // (bottom: N% = 창 바닥에서 N% 지점에 말풍선 아래변을 둠). 없으면 기본(창 top 고정, 아래로 자람).
    bottomAnchorPct?: number
}

// 캐릭터 머리 위 픽셀아트 말풍선.
// 모서리는 clip-path로 계단(픽셀) 라운드. 테두리(어두운 box) 위에 채움(fill)을 얹어
// 계단 모서리를 따라 2px 테두리가 보이게 한다. 꼬리는 클립되지 않게 별도 요소.
export const SpeechBubble = ({
    text,
    tag,
    scale = 1,
    sticky = false,
    onClose,
    bottomAnchorPct,
}: SpeechBubbleProps) => {
    if (text === '' && !tag) {
        return null
    }
    const clickable = sticky && Boolean(onClose)
    // bottomAnchorPct가 있으면 '아래 고정 + 위로 자람'(큰 캐릭터: 머리 위로 비켜 감).
    // 없으면 기본 '위(창 top) 고정 + 아래로 자람'.
    const anchored = typeof bottomAnchorPct === 'number'
    return (
        <div
            css={wrapperStyle}
            style={{
                top: anchored ? 'auto' : 2,
                bottom: anchored ? `${bottomAnchorPct}%` : 'auto',
                transform: `translateX(-50%) scale(${scale})`,
                transformOrigin: anchored ? 'bottom center' : 'top center',
                pointerEvents: clickable ? 'auto' : 'none',
                cursor: clickable ? 'pointer' : undefined,
            }}
            onClick={clickable ? onClose : undefined}
        >
            <div css={boxStyle}>
                {/* sticky일 땐 우상단 X와 글자가 겹치지 않게 우측 여백을 넓힌다. */}
                <div
                    css={fillStyle}
                    style={clickable ? { paddingRight: 20 } : undefined}
                >
                    {text}
                    {tag && <div css={tagStyle}>{tag}</div>}
                </div>
            </div>
            {clickable && (
                <button
                    type='button'
                    css={closeStyle}
                    aria-label='알림 닫기'
                    onClick={(event) => {
                        event.stopPropagation()
                        onClose?.()
                    }}
                >
                    ✕
                </button>
            )}
            <div css={tailStyle} />
        </div>
    )
}
