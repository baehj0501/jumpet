import { boxStyle, fillStyle, tagStyle, tailStyle, wrapperStyle } from './SpeechBubble.styles'

type SpeechBubbleProps = {
    text: string
    // 우측 정렬로 본문 위에 얹는 이름 태그(예: "윙피가"). 없으면 표시 안 함.
    tag?: string
}

// 캐릭터 머리 위 픽셀아트 말풍선.
// 모서리는 clip-path로 계단(픽셀) 라운드. 테두리(어두운 box) 위에 채움(fill)을 얹어
// 계단 모서리를 따라 2px 테두리가 보이게 한다. 꼬리는 클립되지 않게 별도 요소.
export const SpeechBubble = ({ text, tag }: SpeechBubbleProps) => {
    if (text === '' && !tag) {
        return null
    }
    return (
        <div css={wrapperStyle}>
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
