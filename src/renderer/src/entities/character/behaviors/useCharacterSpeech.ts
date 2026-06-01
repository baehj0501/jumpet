import { useCallback, useEffect, useRef, useState } from 'react'

// 말풍선 표시 시간(ms). 이 시간 뒤 자동으로 사라진다.
const SPEECH_DURATION_MS = 2500

// 캐릭터 말풍선 내용 — 본문(text) + 우측 정렬 이름 태그(tag, 선택).
export type CharacterSpeech = {
    text: string
    tag?: string
}

// 캐릭터 위 말풍선 상태를 관리한다.
// - 다른 창(메뉴의 돌봄 등)에서 보낸 멘트: window.api.character.onSpeech 구독.
// - 같은 창(좌클릭 멘트 등): showSpeech로 로컬에서 즉시 띄움(이름 태그 포함 가능).
// 새 멘트가 오면 타이머를 리셋한다. 빈 본문이면 말풍선 숨김.
export const useCharacterSpeech = (): {
    speech: CharacterSpeech
    showSpeech: (text: string, tag?: string) => void
} => {
    const [speech, setSpeech] = useState<CharacterSpeech>({ text: '' })
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const showSpeech = useCallback((text: string, tag?: string) => {
        setSpeech({ text, tag })
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
            setSpeech({ text: '' })
            timeoutRef.current = null
        }, SPEECH_DURATION_MS)
    }, [])

    useEffect(() => {
        const unsubscribe = window.api.character.onSpeech((next) => {
            showSpeech(next)
        })
        return () => {
            unsubscribe()
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [showSpeech])

    return { speech, showSpeech }
}
