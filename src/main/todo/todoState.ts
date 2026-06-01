import { randomUUID } from 'node:crypto'
import {
    MAX_TODO_PROJECT_LENGTH,
    MAX_TODO_TEXT_LENGTH,
    type Todo,
    type TodoEvent,
    type TodoState,
} from '@shared/contracts/todoEvents'

// TODO reducer + 도메인 룰 (FIFO 정리, 텍스트 길이 제한 등).
// 타입/시드는 @shared/contracts에서 import해 main·preload·renderer가 동일 정의를 공유한다.
// id/createdAt/completedAt 같은 비결정적 값은 reducer 안에서 생성 — 도메인 룰 한 곳 집중.

// 완료한 to-do 보관 상한 (명세). 초과 시 createdAt 기준 가장 오래된 완료 항목부터 제거.
const MAX_COMPLETED_TODOS = 100

// 완료 보상 점수 범위(둘 다 포함). 완료 시 이 범위에서 랜덤 지급하고 todo에 저장한다.
const TODO_REWARD_MIN = 1
const TODO_REWARD_MAX = 5
const pickTodoReward = (): number =>
    TODO_REWARD_MIN + Math.floor(Math.random() * (TODO_REWARD_MAX - TODO_REWARD_MIN + 1))

// 완료 보관 상한 정리.
// 'toggle'은 단방향(+1)이라 한 호출당 완료 항목이 최대 1개만 늘어난다 — 초과는 정확히 1건.
// 따라서 정렬 없이 단일 패스로 가장 오래된 완료 항목 1건만 찾아 evict.
const pruneOldestCompleted = (todos: Todo[]): Todo[] => {
    let completedCount = 0
    let oldestCompleted: Todo | null = null
    for (const todo of todos) {
        if (!todo.completed) {
            continue
        }
        completedCount += 1
        if (oldestCompleted === null || todo.createdAt < oldestCompleted.createdAt) {
            oldestCompleted = todo
        }
    }
    if (completedCount <= MAX_COMPLETED_TODOS) {
        return todos
    }
    const evictId = oldestCompleted!.id
    return todos.filter((todo) => todo.id !== evictId)
}

// 도메인 로직.
// pure는 아니다 — 'add' 시 randomUUID/Date.now를 호출한다.
// 호출자(IPC 핸들러)가 enrich/dispatch를 둘로 나누는 대신, 인터페이스 일관성을 위해
// reducer 안에서 처리한다.
export const reduceTodoState = (state: TodoState, event: TodoEvent): TodoState => {
    switch (event.type) {
        case 'add': {
            const trimmed = event.text.trim().slice(0, MAX_TODO_TEXT_LENGTH)
            if (trimmed === '') {
                return state
            }
            const project = (event.project ?? '').trim().slice(0, MAX_TODO_PROJECT_LENGTH)
            const newTodo: Todo = {
                id: randomUUID(),
                text: trimmed,
                completed: false,
                createdAt: Date.now(),
                source: event.source ?? 'manual',
                project,
            }
            return { todos: [...state.todos, newTodo] }
        }
        case 'toggle': {
            const target = state.todos.find((todo) => todo.id === event.id)
            if (!target) {
                return state
            }
            if (target.completed) {
                // 완료 취소 → 미완료로 되돌린다(완료 시각 제거). 원래 섹션(할일/일정)으로 복귀.
                return {
                    todos: state.todos.map((todo) =>
                        todo.id === event.id
                            ? { ...todo, completed: false, completedAt: undefined }
                            : todo,
                    ),
                }
            }
            const now = Date.now()
            // 완료 시 보상 점수를 뽑아 todo에 저장 — 완료 취소 시 정확히 같은 값을 차감하기 위함.
            const reward = pickTodoReward()
            const updated = state.todos.map((todo) =>
                todo.id === event.id
                    ? { ...todo, completed: true, completedAt: now, reward }
                    : todo,
            )
            return { todos: pruneOldestCompleted(updated) }
        }
        case 'remove': {
            return { todos: state.todos.filter((todo) => todo.id !== event.id) }
        }
        case 'setProject': {
            // 프로젝트 태그 변경/해제(빈 문자열이면 미분류).
            const project = event.project.trim().slice(0, MAX_TODO_PROJECT_LENGTH)
            return {
                todos: state.todos.map((todo) =>
                    todo.id === event.id ? { ...todo, project } : todo,
                ),
            }
        }
        case 'updateText': {
            // 빈 텍스트로 저장하면 삭제로 간주 (TodoMVC 표준).
            // 텍스트 변경 시 completed/completedAt는 보존 (spread).
            const trimmed = event.text.trim().slice(0, MAX_TODO_TEXT_LENGTH)
            if (trimmed === '') {
                return { todos: state.todos.filter((todo) => todo.id !== event.id) }
            }
            return {
                todos: state.todos.map((todo) =>
                    todo.id === event.id ? { ...todo, text: trimmed } : todo,
                ),
            }
        }
        default: {
            // TodoEvent union이 확장되면 TS가 event.type을 never로 좁히지 못해
            // 여기서 컴파일 에러로 잡아준다.
            const exhaustiveCheck: never = event
            throw new Error(`Unhandled TodoEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
