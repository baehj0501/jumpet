import { app, BrowserWindow, Menu } from 'electron'

// 우클릭 메뉴에서 열 수 있는 패널 식별자.
// 실제 패널 UI는 renderer에서 'panel:open' 채널 핸들러로 띄울 예정
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

export const showCharacterContextMenu = (window: BrowserWindow) => {
    const menu = Menu.buildFromTemplate([
        ...PANEL_MENU_ITEMS.map((item) => ({
            label: item.label,
            click: () => {
                // 패널 시스템 구현 전 임시 확인용 로그
                // renderer 쪽 핸들러가 없을 때 IPC는 조용히 무시된다
                console.log(`[panel:open] ${item.panelId}`)
                window.webContents.send('panel:open', item.panelId)
            },
        })),
        { type: 'separator' as const },
        {
            label: '❌  종료',
            click: () => {
                app.quit()
            },
        },
    ])
    menu.popup({ window })
}
