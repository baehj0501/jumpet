import { BrowserWindow, ipcMain } from 'electron'
import type { Todo, TodoEvent, TodoState } from '@shared/contracts/todoEvents'
import { reduceTodoState } from './todoState'
import { readTodoState, writeTodoState } from './store'

const TODO_CHANGED_CHANNEL = 'todo:changed'
// 100개 한도로 자동 정리된 todo를 알리는 별도 채널.
// 사용자가 명시적으로 보낸 remove 이벤트와 의미가 다르므로 분리.
const TODO_EVICTED_CHANNEL = 'todo:evicted'

const broadcastTodoState = (next: TodoState): void => {
    const allWindows = BrowserWindow.getAllWindows()
    for (const targetWindow of allWindows) {
        if (targetWindow.isDestroyed()) {
            continue
        }
        targetWindow.webContents.send(TODO_CHANGED_CHANNEL, next)
    }
}

const broadcastTodoEviction = (evictedTodos: Todo[]): void => {
    const allWindows = BrowserWindow.getAllWindows()
    for (const targetWindow of allWindows) {
        if (targetWindow.isDestroyed()) {
            continue
        }
        targetWindow.webContents.send(TODO_EVICTED_CHANNEL, evictedTodos)
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

// 완료 → 미완료 전환(완료 취소) 여부.
const wasNewlyUncompleted = (id: string, before: TodoState, after: TodoState): boolean => {
    const wasCompleted = before.todos.some((todo) => todo.id === id && todo.completed)
    const isNowIncomplete = after.todos.some((todo) => todo.id === id && !todo.completed)
    return wasCompleted && isNowIncomplete
}

const rewardOf = (id: string, state: TodoState): number =>
    state.todos.find((todo) => todo.id === id)?.reward ?? 0

// 100개 한도 초과로 FIFO 정리된 todo를 추출. toggle 시점에만 발생 가능.
// before/after id 차이로 추론 — reducer는 같은 ipc 호출 안에서 한 todo를 추가/변경하므로
// 그 id 외에 사라진 항목이 곧 evict 대상.
const findEvictedTodos = (before: TodoState, after: TodoState): Todo[] => {
    const afterIds = new Set(after.todos.map((todo) => todo.id))
    return before.todos.filter((todo) => !afterIds.has(todo.id))
}

// 의존성 주입 — todo 도메인이 점수 / 사운드 / 업적 등 다른 도메인을 직접 import하지 않게 한다.
// 부수효과의 조립은 main/index.ts에서 일어나고, todo는 "이런 일이 일어났다"는 사실만 호출한다.
type TodoIpcDeps = {
    // 새로 완료된 todo의 보상 점수. 호출자가 점수 가산 등 부수효과를 합성한다.
    onTodoCompleted: (reward: number) => void
    // 완료 취소된 todo의 보상 점수. 호출자가 점수 차감(음수 허용)을 합성한다.
    onTodoUncompleted: (reward: number) => void
}

export const registerTodoIpc = ({ onTodoCompleted, onTodoUncompleted }: TodoIpcDeps): void => {
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

        if (eventInput.type === 'toggle') {
            if (wasNewlyCompleted(eventInput.id, current, next)) {
                onTodoCompleted(rewardOf(eventInput.id, next))
            } else if (wasNewlyUncompleted(eventInput.id, current, next)) {
                // 완료 취소 — 완료 때 저장해둔 보상을 차감(음수 허용).
                onTodoUncompleted(rewardOf(eventInput.id, current))
            }
            // 100개 한도 초과로 자동 정리된 todo가 있으면 별도 알림 broadcast.
            // toggle 시점에만 evict 가능하므로 다른 이벤트 타입은 검사 생략.
            const evictedTodos = findEvictedTodos(current, next)
            if (evictedTodos.length > 0) {
                broadcastTodoEviction(evictedTodos)
            }
        }

        return next
    })
}
