import { boxStyle, fillStyle, tagStyle, tailStyle, wrapperStyle } from './SpeechBubble.styles'

type SpeechBubbleProps = {
    text: string
    // 우측 정렬로 본문 위에 얹는 이름 태그(예: "윙피가"). 없으면 표시 안 함.
    tag?: string
    // 캐릭터 크기에 맞춘 말풍선 배율(≤1). 작은 캐릭터에서 겹침/잘림을 막으려 같이 줄인다. 기본 1.
    scale?: number
}

// 캐릭터 머리 위 픽셀아트 말풍선.
// 모서리는 clip-path로 계단(픽셀) 라운드. 테두리(어두운 box) 위에 채움(fill)을 얹어
// 계단 모서리를 따라 2px 테두리가 보이게 한다. 꼬리는 클립되지 않게 별도 요소.
export const SpeechBubble = ({ text, tag, scale = 1 }: SpeechBubbleProps) => {
    if (text === '' && !tag) {
        return null
    }
    return (
        <div
            css={wrapperStyle}
            // 위(top) 고정·중앙 정렬은 유지하고, 윗변 기준으로 축소해 잘림 없이 작아지게 한다.
            style={{ transform: `translateX(-50%) scale(${scale})`, transformOrigin: 'top center' }}
        >
            <div css={boxStyle}>
                <div css={fillStyle}>
                    {text}
                    {tag && <div css={tagStyle}>{tag}</div>}
                </div>
            </div>
            <div css={tailStyle} />
        </div>
    )
}
