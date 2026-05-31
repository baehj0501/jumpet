import { BrowserWindow, ipcMain } from 'electron'
import type { FortuneEvent, FortuneRecord, FortuneState } from '@shared/contracts/fortuneEvents'
import { reduceFortuneState } from './fortuneState'
import { readFortuneState, writeFortuneState } from './store'

const FORTUNE_CHANGED_CHANNEL = 'fortune:changed'

const broadcastFortuneState = (next: FortuneState): void => {
    const allWindows = BrowserWindow.getAllWindows()
    for (const targetWindow of allWindows) {
        if (targetWindow.isDestroyed()) {
            continue
        }
        targetWindow.webContents.send(FORTUNE_CHANGED_CHANNEL, next)
    }
}

// 로컬 기준 'YYYY-MM-DD'. roll 멱등성의 기준 날짜.
const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// 의존성 주입 — fortune 도메인이 player(점수)를 직접 import하지 않게 한다.
// "새 운세가 떴다"는 사실만 콜백으로 알리고, 점수 가산 조립은 main/index.ts에서 한다.
type FortuneIpcDeps = {
    // 오늘 운세가 새로 생성됐을 때만(=중복 호출 시 1회만) 호출된다.
    onFortuneRolled: (record: FortuneRecord) => void
}

// renderer IPC 진입점과 main 내부 트리거(앱 시작 시 보장) 둘 다 같은 함수를 거치게 한다.
// roll은 날짜당 멱등이므로 여러 번 호출해도 새 운세는 하루 1번만 생성되고 보상도 1번만 발생한다.
export const applyFortuneEvent = (
    event: FortuneEvent,
    onFortuneRolled: (record: FortuneRecord) => void,
): FortuneState => {
    const current = readFortuneState()
    const today = formatLocalDate(new Date())
    const next = reduceFortuneState(current, event, today)
    // 오늘 운세가 이미 있으면 reducer가 같은 참조를 반환 → 새 추첨/보상 없음.
    if (next === current) {
        return current
    }
    writeFortuneState(next)
    broadcastFortuneState(next)
    if (next.today) {
        onFortuneRolled(next.today)
    }
    return next
}

export const registerFortuneIpc = ({ onFortuneRolled }: FortuneIpcDeps): void => {
    ipcMain.handle('fortune:get', (): FortuneState => {
        return readFortuneState()
    })

    ipcMain.handle('fortune:apply', (_event, eventInput: FortuneEvent): FortuneState => {
        return applyFortuneEvent(eventInput, onFortuneRolled)
    })
}
