import { bubbleStyle } from './SpeechBubble.styles'

type SpeechBubbleProps = {
    text: string
}

// 캐릭터 머리 위 말풍선. text가 비면 아무것도 렌더하지 않는다.
export const SpeechBubble = ({ text }: SpeechBubbleProps) => {
    if (text === '') {
        return null
    }
    return <div css={bubbleStyle}>{text}</div>
}
