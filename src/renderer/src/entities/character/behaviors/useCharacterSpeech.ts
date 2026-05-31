import { useEffect, useRef, useState } from 'react'

// 말풍선 표시 시간(ms). 이 시간 뒤 자동으로 사라진다.
const SPEECH_DURATION_MS = 2500

// 다른 창에서 보낸 멘트(window.api.character.onSpeech)를 받아 캐릭터 위 말풍선으로 띄운다.
// 새 멘트가 오면 타이머를 리셋한다. 빈 문자열이면 말풍선 숨김.
export const useCharacterSpeech = (): string => {
    const [text, setText] = useState('')
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        const unsubscribe = window.api.character.onSpeech((next) => {
            setText(next)
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current)
            }
            timeoutRef.current = setTimeout(() => {
                setText('')
                timeoutRef.current = null
            }, SPEECH_DURATION_MS)
        })
        return () => {
            unsubscribe()
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return text
}
