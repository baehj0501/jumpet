import { ipcMain } from 'electron'
import { openMenuPanel } from '../panels'

// 우클릭 진입점. 예전엔 네이티브 드롭다운(Menu.popup)을 띄웠지만,
// 이제는 탭형 통합 메뉴 창을 연다. (드롭다운 제거)
// 별도 창이라 캐릭터 자율 행동을 멈출 필요가 없어 menu:state 신호는 보내지 않는다.
export const registerMenuIpc = (): void => {
    ipcMain.on('window:showContextMenu', () => {
        openMenuPanel()
    })
}
