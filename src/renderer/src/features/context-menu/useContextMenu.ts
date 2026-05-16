import { useEffect } from 'react'
import type { MouseEvent, RefObject } from 'react'

type UseContextMenuOptions = {
    // 메뉴 표시 동안 자율 행동을 멈추기 위해 features 계층이 토글하는 신호.
    isInteractingRef: RefObject<boolean>
}

// 캐릭터 우클릭 시 main 프로세스에 컨텍스트 메뉴 표시를 요청한다.
// 메뉴 정의 자체(예: "종료" 항목)는 보안/플랫폼 일관성을 위해 main에 둔다.
// 메뉴 열림/닫힘 동안 자율 행동이 일시정지되도록 main이 보내는 신호로 ref를 토글한다.
export const useContextMenu = ({ isInteractingRef }: UseContextMenuOptions) => {
    useEffect(() => {
        const handleMenuStateChange = (state: 'opened' | 'closed') => {
            if (state === 'opened') {
                isInteractingRef.current = true
                return
            }
            isInteractingRef.current = false
        }

        const unsubscribe = window.api.onMenuStateChange(handleMenuStateChange)
        return unsubscribe
        // ref는 stable이라 deps에서 제외
    }, [])

    const handleContextMenu = (event: MouseEvent) => {
        event.preventDefault()
        window.api.showContextMenu()
    }

    return { handleContextMenu }
}
