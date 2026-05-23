# To-Do 시스템

## 한 줄 정체성

별도 BrowserWindow에서 동작하는 할 일 관리. 완료 시 점수 가산으로 펫 게임 루프에 연결.

## 명세

### 기능 (v2.0 §8 + 신 다이어그램)

- **할 일 추가** — 텍스트 입력. 최대 40자.
- **체크박스로 완료 처리** — **단방향**(진행중 → 완료). 한 번 완료된 것은 다시 진행중으로 못 돌림.
- **개별 삭제** — 진행중·완료 모두 가능.
- **인라인 텍스트 편집** — 텍스트 클릭으로 수정. 빈 텍스트 저장 시 삭제 (TodoMVC 표준).
- **두 탭**: 진행중 / 완료. v2.0의 '전체' 탭은 폐기. 기본 진입 시 진행중 탭.
- **완료 항목 보관 상한 100개** — 초과 시 createdAt 기준 가장 오래된 완료 항목부터 evict.
- **완료 시점에 점수 1~5점 랜덤 가산** + (계획) 칭찬 GIF 모션.

### 표시 형식 (v2.0 §8.2)

- 진행 중: `⭕ + 할 일 텍스트`
- 완료: `✅ + 취소선 텍스트 + 완료 시각 (예: 5/16 14:30)`

### 영속화

- main의 electron-store에 저장.
- 같은 사용자가 어느 패널에서 데이터를 보든 동일 (현재는 TODO 별창만 사용).
- 항목 단위 hydration 검증 — 일부만 손상되면 살릴 수 있는 것만 살림.

### 도메인 invariant

- **toggle은 단방향** (false → true만). reducer가 이미 완료된 항목의 toggle은 무시.
- **빈 텍스트 add는 무시**. updateText에서 빈 텍스트는 항목 삭제.
- **완료 보관 상한 100개** — 초과 시 FIFO eviction.

## 아키텍처 / 데이터 흐름

### 데이터 흐름

```
[TODO 별창 — TodoPage]
   ↓ const { addTodo, toggleTodo, ... } = useTodoActions()
   ↓ addTodo('운동하기')
[useTodoStore 액션]
   ↓ window.api.todo.apply({ type: 'add', text: '운동하기' })
   ↓ preload → main
[ipcMain.handle('todo:apply')]
   ↓
reduceTodoState(current, event)
   - 'add' 시 randomUUID + Date.now로 todo 객체 생성
   - toggle 시 단방향 + pruneOldestCompleted
   ↓
writeTodoState(next)
   ↓
broadcastTodoState(next)  // 'todo:changed' 모든 윈도우에
   ↓
조건: eventInput.type === 'toggle' && 새로 완료됐는지 확인
   ↓ true면
onTodoCompleted(id) 콜백 호출
   ↓ src/main/index.ts에서 조립된 콜백
applyPlayerEvent({ type: 'todoComplete' })
   - reducer가 1~5점 랜덤 가산
   - broadcast 'player:changed'
```

→ **TODO 완료 한 번이 두 개의 broadcast 발생**: `todo:changed` + `player:changed`.

### TodoEvent union

`src/shared/contracts/todoEvents.ts`:

```ts
export type TodoEvent =
    | { type: 'add'; text: string }
    | { type: 'toggle'; id: string }    // 단방향. 이미 완료된 항목은 no-op
    | { type: 'remove'; id: string }
    | { type: 'updateText'; id: string; text: string }
```

→ v2.0 초안의 `'clearCompleted'`는 단방향 정책 채택 후 폐기.

### Renderer store 패턴 (`useTodos` + `useTodoActions` 분리)

```tsx
// TodoPage.tsx
const todos = useTodos()                                              // selector 1
const { addTodo, toggleTodo, removeTodo, updateTodoText } = useTodoActions()  // selector 2
```

각각 다른 selector로 분리되어 있어서:
- `todos`가 바뀔 때 `useTodoActions` 호출 컴포넌트는 리렌더 X
- `useTodoActions`는 action 참조만 반환 — stable

### 패널 별창 구조

```
src/renderer/
├── todo.html                       # 별창 entry
└── src/pages/todo/
    ├── main.tsx                    # React mount
    ├── TodoPage.tsx                # 루트 컴포넌트 (페이지 단위 emotion <Global>)
    ├── TodoForm.tsx                # 입력
    ├── TodoList.tsx                # 목록
    └── TodoFooter.tsx              # 진행중/완료 카운트 + 탭 전환
```

`electron.vite.config.ts`의 `rollupOptions.input`에 `todo: resolve('src/renderer/todo.html')` 등록.

### 관련 코드

| 영역 | 파일 |
|---|---|
| 타입 (공유) | `src/shared/contracts/todoEvents.ts` |
| reducer + FIFO 정리 | `src/main/todo/todoState.ts` |
| 영속화 | `src/main/todo/store.ts` |
| IPC + 부수효과 (onTodoCompleted) | `src/main/todo/ipc.ts` |
| barrel | `src/main/todo/index.ts` |
| preload 노출 | `src/preload/index.ts` (`window.api.todo`) |
| Zustand store | `src/renderer/src/entities/todo/model/useTodoStore.ts` |
| TodoFilter 타입 | `src/renderer/src/entities/todo/model/Todo.ts` |
| TodoItem UI | `src/renderer/src/entities/todo/ui/TodoItem.tsx` |
| barrel | `src/renderer/src/entities/todo/index.ts` |
| 별창 페이지 | `src/renderer/src/pages/todo/` |
| 별창 entry HTML | `src/renderer/todo.html` |
| 패널 열기 (main) | `src/main/panels/openTodoPanel.ts` |

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | electron-store, player(`onTodoCompleted` 콜백 통해) |
| **호출됨** | 우클릭 메뉴의 '✅ To-Do' 항목 → 패널 디스패처 |
| **노출 방향** | (미래) 정보 패널이 todo 통계 보여줄 가능성 |

## Open Questions

- **40자 입력 제한** — main의 reducer에서 자르기 vs renderer의 input maxLength?
- **`completedAt` 필드 추가** — Todo 타입에 추가하고 toggle 시 Date.now() 저장. UI에서 표시 형식 ("5/16 14:30")
- **완료 → 진행중 되돌리기** — 명세상 단방향이지만 실수 클릭 복구는 어떻게? (1) 못 돌리고 새로 추가 (2) UNDO 5초 토스트 (3) 다시 진행중 가능하게 (단방향 정책 폐기)
- **완료 항목 100개 초과 evict 시 UI 알림** — 조용히 사라지면 사용자 혼란. 토스트?
- **외부 영향** — TODO 완료가 점수 외에 친밀도/기분 등 다른 스탯에도 영향? (스탯 시스템 폐기되면 무관)
