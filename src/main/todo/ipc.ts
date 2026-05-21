import { BrowserWindow, ipcMain } from 'electron'
import { reduceTodoState, type TodoEvent, type TodoState } from './todoState'
import { readTodoState, writeTodoState } from './store'

const TODO_CHANGED_CHANNEL = 'todo:changed'

const broadcastTodoState = (next: TodoState): void => {
    const allWindows = BrowserWindow.getAllWindows()
    for (const targetWindow of allWindows) {
        if (targetWindow.isDestroyed()) {
            continue
        }
        targetWindow.webContents.send(TODO_CHANGED_CHANNEL, next)
    }
}

export const registerTodoIpc = (): void => {
    ipcMain.handle('todo:get', (): TodoState => {
        return readTodoState()
    })

    ipcMain.handle('todo:apply', (_event, eventInput: TodoEvent): TodoState => {
        // 혼자 개발하는 로컬 게임이라 IPC payload는 신뢰 가능.
        // reducer가 빈 텍스트, 잘못된 id 등 도메인 invariant는 자체 처리.
        const current = readTodoState()
        const next = reduceTodoState(current, eventInput)
        // 변경이 없으면 (예: 빈 텍스트 add) 디스크 쓰기/broadcast 생략.
        if (next === current) {
            return current
        }
        writeTodoState(next)
        broadcastTodoState(next)
        return next
    })
}
