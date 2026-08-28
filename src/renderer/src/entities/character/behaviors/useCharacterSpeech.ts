import { useCallback, useEffect, useRef, useState } from 'react'

// 말풍선 표시 시간(ms). 이 시간 뒤 자동으로 사라진다. (sticky 멘트는 예외 — 닫을 때까지 유지)
const SPEECH_DURATION_MS = 2500

// 캐릭터 말풍선 내용 — 본문(text) + 우측 정렬 이름 태그(tag, 선택).
// sticky=true면 자동으로 사라지지 않고 사용자가 닫을 때까지 유지된다(알림용).
export type CharacterSpeech = {
    text: string
    tag?: string
    sticky?: boolean
}

// 캐릭터 위 말풍선 상태를 관리한다.
// - 다른 창(메뉴의 돌봄 등)/main에서 보낸 멘트: window.api.character.onSpeech 구독.
// - 같은 창(좌클릭 멘트 등): showSpeech로 로컬에서 즉시 띄움(이름 태그 포함 가능).
// 새 멘트가 오면 타이머를 리셋한다. 빈 본문이면 말풍선 숨김.
// sticky 멘트는 자동 소멸 타이머를 걸지 않고, dismissSpeech로만 닫힌다.
export const useCharacterSpeech = (): {
    speech: CharacterSpeech
    showSpeech: (text: string, options?: { tag?: string; sticky?: boolean }) => void
    dismissSpeech: () => void
} => {
    const [speech, setSpeech] = useState<CharacterSpeech>({ text: '' })
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const showSpeech = useCallback(
        (text: string, options?: { tag?: string; sticky?: boolean }) => {
            const sticky = options?.sticky ?? false
            setSpeech({ text, tag: options?.tag, sticky })
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            // sticky 멘트는 자동으로 사라지지 않는다 — 사용자가 닫을 때까지 유지.
            if (sticky) {
                return
            }
            timeoutRef.current = setTimeout(() => {
                setSpeech({ text: '' })
                timeoutRef.current = null
            }, SPEECH_DURATION_MS)
        },
        [],
    )

    // 말풍선 닫기. sticky 알림이었다면 캐릭터 창의 최상단 고정도 해제하라고 main에 알린다.
    const dismissSpeech = useCallback(() => {
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        setSpeech((current) => {
            if (current.sticky) {
                window.api.character.dismissNotification()
            }
            return { text: '' }
        })
    }, [])

    useEffect(() => {
        const unsubscribe = window.api.character.onSpeech((next) => {
            showSpeech(next.text, { sticky: next.sticky })
        })
        return () => {
            unsubscribe()
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [showSpeech])

    return { speech, showSpeech, dismissSpeech }
}
