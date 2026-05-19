import { app, BrowserWindow, Menu } from 'electron'
import { openPanel } from '../panels'

// 우클릭 메뉴에서 열 수 있는 패널 식별자.
// 실제 패널은 main의 openPanel이 panelId별로 BrowserWindow를 띄우거나 오버레이를 트리거한다.
export type PanelId = 'feed' | 'play' | 'todo' | 'gacha' | 'item' | 'link' | 'info'

type PanelMenuItem = {
    label: string
    panelId: PanelId
}

const PANEL_MENU_ITEMS: PanelMenuItem[] = [
    { label: '🍖  먹이주기', panelId: 'feed' },
    { label: '🎮  놀아주기', panelId: 'play' },
    { label: '✅  To-Do', panelId: 'todo' },
    { label: '🏪  가챠', panelId: 'gacha' },
    { label: '🎒  아이템', panelId: 'item' },
    { label: '🔗  링크 관리', panelId: 'link' },
    { label: '📊  정보', panelId: 'info' },
]

export const showCharacterContextMenu = (window: BrowserWindow, onClose: () => void) => {
    const menu = Menu.buildFromTemplate([
        ...PANEL_MENU_ITEMS.map((item) => ({
            label: item.label,
            click: () => openPanel(item.panelId),
        })),
        { type: 'separator' as const },
        {
            label: '❌  종료',
            click: () => {
                app.quit()
            },
        },
    ])
    // popup의 callback은 항목 클릭이든 외부 클릭이든 메뉴가 닫히면 한 번 호출된다.
    menu.popup({ window, callback: onClose })
}
