import { app, BrowserWindow, Menu } from 'electron'
import { openPanel } from '../panels'

// 우클릭 메뉴에서 열 수 있는 패널 식별자.
// 실제 패널은 main의 openPanel이 panelId별로 BrowserWindow를 띄우거나 오버레이를 트리거한다.
export type PanelId =
    | 'care'
    | 'todo'
    | 'fortune'
    | 'schedule'
    | 'gacha'
    | 'item'
    | 'youtube'
    | 'settings'

type PanelMenuItem = {
    label: string
    panelId: PanelId
}

// 의미 그룹별로 묶고, 그룹 사이에 구분선을 넣는다.
// 그룹: (상시 인터랙션) / (수집) / (외부·환경설정)
const PANEL_MENU_GROUPS: PanelMenuItem[][] = [
    [
        { label: '🐾  돌봄', panelId: 'care' },
        { label: '✅  To-Do', panelId: 'todo' },
        { label: '🌸  운세', panelId: 'fortune' },
        { label: '📅  일정', panelId: 'schedule' },
    ],
    [
        { label: '🎰  가챠', panelId: 'gacha' },
        { label: '🎒  아이템', panelId: 'item' },
    ],
    [
        { label: '🎵  유튜브', panelId: 'youtube' },
        { label: '⚙️  설정', panelId: 'settings' },
    ],
]

export const showCharacterContextMenu = (window: BrowserWindow, onClose: () => void) => {
    const template: Electron.MenuItemConstructorOptions[] = []

    // 각 그룹을 펼치고 그룹마다 뒤에 구분선을 둔다 → 마지막 그룹과 '종료' 사이에도 구분선이 생긴다.
    PANEL_MENU_GROUPS.forEach((group) => {
        group.forEach((item) => {
            template.push({
                label: item.label,
                click: () => openPanel(item.panelId),
            })
        })
        template.push({ type: 'separator' })
    })

    template.push({
        label: '❌  종료',
        click: () => {
            app.quit()
        },
    })

    const menu = Menu.buildFromTemplate(template)
    // popup의 callback은 항목 클릭이든 외부 클릭이든 메뉴가 닫히면 한 번 호출된다.
    menu.popup({ window, callback: onClose })
}
