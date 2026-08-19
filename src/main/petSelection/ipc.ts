import { BrowserWindow, ipcMain } from 'electron'
import {
    PET_GACHA_COST,
    type PetSelectionEvent,
    type PetSelectionState,
} from '@shared/contracts/petEvents'
import { reducePetSelectionState } from './petSelectionState'
import { readPetSelectionState, writePetSelectionState } from './store'

type PetSelectionIpcHooks = {
    // 펫 뽑기 — 점수 확인·차감(player)을 main/index.ts에서 주입. 펫 추첨은 renderer가 한다.
    getScore?: () => number
    spendForGacha?: () => void
}

const PET_SELECTION_CHANGED_CHANNEL = 'petSelection:changed'

const broadcastPetSelectionState = (next: PetSelectionState): void => {
    for (const targetWindow of BrowserWindow.getAllWindows()) {
        if (!targetWindow.isDestroyed()) {
            targetWindow.webContents.send(PET_SELECTION_CHANGED_CHANNEL, next)
        }
    }
}

export const registerPetSelectionIpc = (hooks: PetSelectionIpcHooks = {}): void => {
    ipcMain.handle('petSelection:get', (): PetSelectionState => {
        return readPetSelectionState()
    })

    // 펫 뽑기 비용 차감만 담당(원자적). 성공 시 renderer가 미보유 펫을 추첨해 unlock한다.
    ipcMain.handle('petSelection:gacha', (): { success: boolean } => {
        if (!hooks.getScore || !hooks.spendForGacha) {
            return { success: false }
        }
        if (hooks.getScore() < PET_GACHA_COST) {
            return { success: false }
        }
        hooks.spendForGacha()
        return { success: true }
    })

    ipcMain.handle(
        'petSelection:apply',
        (_event, eventInput: PetSelectionEvent): PetSelectionState => {
            const current = readPetSelectionState()
            const next = reducePetSelectionState(current, eventInput)
            if (next === current) {
                return current
            }
            writePetSelectionState(next)
            broadcastPetSelectionState(next)
            return next
        },
    )
}
