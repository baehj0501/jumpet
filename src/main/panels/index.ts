import type { PanelId } from '../menu/characterContextMenu'
import { openTodoPanel } from './openTodoPanel'

// 메뉴 클릭의 단일 디스패치 진입점.
// TODO는 별창으로, 후속 패널은 오버레이/별창 등 형태에 맞춰 여기에 케이스 추가.
export const openPanel = (panelId: PanelId) => {
    switch (panelId) {
        case 'todo':
            openTodoPanel()
            return
        case 'feed':
        case 'play':
        case 'gacha':
        case 'item':
        case 'link':
        case 'info':
            // 후속 패널 구현 전 placeholder.
            console.log(`[panel:open] ${panelId} (not implemented)`)
            return
    }
}
