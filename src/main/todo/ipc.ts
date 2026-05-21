import { BrowserWindow, ipcMain } from 'electron'
import type { TodoEvent, TodoState } from '@shared/contracts/todoEvents'
import { reduceTodoState } from './todoState'
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

// toggle 이벤트로 해당 to-do가 실제로 false→true 전환됐는지 확인한다.
// reducer는 단방향이라 잘못된 id/이미 완료된 항목이면 state가 그대로 반환되지만,
// FIFO 정리로 다른 todo가 함께 바뀔 수 있어 'next !== current' 만으로는 판별 부족.
const wasNewlyCompleted = (id: string, before: TodoState, after: TodoState): boolean => {
    const wasIncomplete = before.todos.some((todo) => todo.id === id && !todo.completed)
    const isNowCompleted = after.todos.some((todo) => todo.id === id && todo.completed)
    return wasIncomplete && isNowCompleted
}

// 의존성 주입 — todo 도메인이 점수 / 사운드 / 업적 등 다른 도메인을 직접 import하지 않게 한다.
// 부수효과의 조립은 main/index.ts에서 일어나고, todo는 "이런 일이 일어났다"는 사실만 호출한다.
type TodoIpcDeps = {
    // 새로 완료된 todo의 id. 호출자가 점수 가산 등 부수효과를 자유롭게 합성한다.
    onTodoCompleted: (id: string) => void
}

export const registerTodoIpc = ({ onTodoCompleted }: TodoIpcDeps): void => {
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

        if (eventInput.type === 'toggle' && wasNewlyCompleted(eventInput.id, current, next)) {
            onTodoCompleted(eventInput.id)
        }

        return next
    })
}
