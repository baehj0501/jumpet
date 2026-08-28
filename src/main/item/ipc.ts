import { BrowserWindow, ipcMain } from 'electron'
import {
    GACHA_COST,
    type GachaResult,
    type ItemEvent,
    type ItemState,
} from '@shared/contracts/itemEvents'
import { grantRandomItem, reduceItemState } from './itemState'
import { readItemState, writeItemState } from './store'

const ITEM_CHANGED_CHANNEL = 'item:changed'

const broadcastItemState = (next: ItemState): void => {
    const allWindows = BrowserWindow.getAllWindows()
    for (const targetWindow of allWindows) {
        if (targetWindow.isDestroyed()) {
            continue
        }
        targetWindow.webContents.send(ITEM_CHANGED_CHANNEL, next)
    }
}

// 의존성 주입 — item 도메인이 player(점수)를 직접 import하지 않게 한다.
// 점수 확인·차감은 콜백으로 받고, 조립은 main/index.ts에서.
type ItemIpcDeps = {
    getScore: () => number
    // 뽑기 비용 차감(player gachaSpin). 호출 시점은 item 도메인이 잔액을 확인한 뒤다.
    spendForGacha: () => void
}

export const registerItemIpc = ({ getScore, spendForGacha }: ItemIpcDeps): void => {
    ipcMain.handle('item:get', (): ItemState => {
        return readItemState()
    })

    ipcMain.handle('item:apply', (_event, eventInput: ItemEvent): ItemState => {
        const current = readItemState()
        const next = reduceItemState(current, eventInput)
        if (next === current) {
            return current
        }
        writeItemState(next)
        broadcastItemState(next)
        return next
    })

    // 뽑기: 잔액 확인 → 차감 → 랜덤 1개 지급. 점수 부족이면 아무것도 하지 않고 success:false.
    ipcMain.handle('item:gacha', (): GachaResult => {
        const current = readItemState()
        if (getScore() < GACHA_COST) {
            return { success: false, wonItemId: null, state: current }
        }
        spendForGacha()
        const { state: next, item } = grantRandomItem(current)
        writeItemState(next)
        broadcastItemState(next)
        return { success: true, wonItemId: item.id, state: next }
    })
}
