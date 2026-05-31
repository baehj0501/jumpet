import type { PanelId } from '../menu/characterContextMenu'
import { openTodoPanel } from './openTodoPanel'

// 메뉴 클릭의 단일 디스패치 진입점.
// 패널이 추가될 때마다 케이스를 활성화하고 placeholder는 비워둔다.
export const openPanel = (panelId: PanelId) => {
    switch (panelId) {
        case 'todo':
            openTodoPanel()
            return
        case 'care':
        case 'fortune':
        case 'schedule':
        case 'gacha':
        case 'item':
        case 'youtube':
        case 'settings':
            // 후속 패널 구현 전 placeholder.
            console.log(`[panel:open] ${panelId} (not implemented)`)
            return
    }
}
