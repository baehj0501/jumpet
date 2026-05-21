import { BrowserWindow, ipcMain } from 'electron'
import { reduceTodoState, type TodoEvent, type TodoState } from './todoState'
import { readTodoState, writeTodoState } from './store'
import { applyPlayerEvent } from '../playerState'

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

// toggle 이벤트로 해당 to-do가 실제로 false→true 전환됐는지 확인한다.
// reducer는 단방향이라 잘못된 id/이미 완료된 항목이면 state가 그대로 반환되지만,
// FIFO 정리로 다른 todo가 함께 바뀔 수 있어 'next !== current' 만으로는 판별 부족.
const wasNewlyCompleted = (id: string, before: TodoState, after: TodoState): boolean => {
    const wasIncomplete = before.todos.some((todo) => todo.id === id && !todo.completed)
    const isNowCompleted = after.todos.some((todo) => todo.id === id && todo.completed)
    return wasIncomplete && isNowCompleted
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
        // 변경이 없으면 (예: 빈 텍스트 add, 이미 완료된 todo 재토글) 디스크 쓰기/broadcast 생략.
        if (next === current) {
            return current
        }
        writeTodoState(next)
        broadcastTodoState(next)

        // 새로 완료된 todo가 있으면 점수 보상 지급 (도메인 결합은 정책상 한 곳: 이 핸들러).
        if (eventInput.type === 'toggle' && wasNewlyCompleted(eventInput.id, current, next)) {
            applyPlayerEvent({ type: 'todoComplete' })
        }

        return next
    })
}
