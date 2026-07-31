import { BrowserWindow, ipcMain } from 'electron'
import type { ScheduleEvent, ScheduleState } from '@shared/contracts/scheduleEvents'
import { reduceScheduleState } from './scheduleState'
import { readScheduleState, writeScheduleState } from './store'

const SCHEDULE_CHANGED_CHANNEL = 'schedule:changed'
// 알림 체크 주기 — 분 단위 일치를 놓치지 않게 30초마다.
const NOTIFY_INTERVAL_MS = 30_000

const broadcastScheduleState = (next: ScheduleState): void => {
    for (const targetWindow of BrowserWindow.getAllWindows()) {
        if (!targetWindow.isDestroyed()) {
            targetWindow.webContents.send(SCHEDULE_CHANGED_CHANNEL, next)
        }
    }
}

const pad = (n: number): string => String(n).padStart(2, '0')

// 의존성 주입 — schedule이 character(말풍선)를 직접 import하지 않게 한다.
// "일정 시각이 됐다"는 사실만 콜백으로 알리고, 조립은 main/index.ts에서.
type ScheduleIpcDeps = {
    onDue: (title: string) => void
}

export const registerScheduleIpc = ({ onDue }: ScheduleIpcDeps): void => {
    ipcMain.handle('schedule:get', (): ScheduleState => {
        return readScheduleState()
    })

    ipcMain.handle('schedule:apply', (_event, eventInput: ScheduleEvent): ScheduleState => {
        const current = readScheduleState()
        const next = reduceScheduleState(current, eventInput)
        if (next === current) {
            return current
        }
        writeScheduleState(next)
        broadcastScheduleState(next)
        return next
    })

    // 30초마다 알람 시각(시작 시각 − remindOffsetMinutes)이 도래한 일정을 통지한다.
    // remindOffsetMinutes가 없는 일정(=알람 해제)은 건너뛴다.
    // 같은 분에 중복 통지하지 않도록 세션 내 in-memory Set(id+오프셋)으로 dedup.
    const notifiedIds = new Set<string>()
    const checkDue = () => {
        const now = new Date()
        const nowDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
        const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`
        for (const item of readScheduleState().items) {
            if (typeof item.remindOffsetMinutes !== 'number') {
                continue
            }
            const start = new Date(`${item.date}T${item.time}`)
            if (Number.isNaN(start.getTime())) {
                continue
            }
            const fire = new Date(start.getTime() - item.remindOffsetMinutes * 60_000)
            const fireDate = `${fire.getFullYear()}-${pad(fire.getMonth() + 1)}-${pad(fire.getDate())}`
            const fireTime = `${pad(fire.getHours())}:${pad(fire.getMinutes())}`
            const key = `${item.id}:${item.remindOffsetMinutes}`
            if (fireDate === nowDate && fireTime === nowTime && !notifiedIds.has(key)) {
                notifiedIds.add(key)
                onDue(item.title)
            }
        }
    }
    setInterval(checkDue, NOTIFY_INTERVAL_MS)
}
