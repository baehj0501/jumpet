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

// 메뉴의 외부 의존성을 콜백 형태로 받는다.
// menu 모듈이 linkBar 도메인을 직접 import하지 않게 해서 결합도를 낮춘다 — 조립은 main/index.ts에서.
export type CharacterContextMenuDeps = {
    // 현재 미니 버튼 바가 보이는 상태인지 — 체크박스 표시에 사용.
    isLinkBarVisible: () => boolean
    // 미니 버튼 바 표시 토글. 메뉴 항목 클릭 시 호출.
    toggleLinkBar: () => void
}

export const showCharacterContextMenu = (
    window: BrowserWindow,
    onClose: () => void,
    deps: CharacterContextMenuDeps,
) => {
    const menu = Menu.buildFromTemplate([
        ...PANEL_MENU_ITEMS.map((item) => ({
            label: item.label,
            click: () => openPanel(item.panelId),
        })),
        { type: 'separator' as const },
        {
            label: '🔗  즐겨찾기 바 표시',
            type: 'checkbox' as const,
            checked: deps.isLinkBarVisible(),
            click: deps.toggleLinkBar,
        },
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
