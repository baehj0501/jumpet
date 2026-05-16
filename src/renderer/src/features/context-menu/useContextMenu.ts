import type { MouseEvent } from 'react'

// 캐릭터 우클릭 시 main 프로세스에 컨텍스트 메뉴 표시를 요청한다.
// 메뉴 정의 자체(예: "종료" 항목)는 보안/플랫폼 일관성을 위해 main에 둔다.
export const useContextMenu = () => {
    const handleContextMenu = (event: MouseEvent) => {
        event.preventDefault()
        window.api.showContextMenu()
    }

    return { handleContextMenu }
}
