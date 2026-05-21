// 단일 할 일 항목. createdAt은 안정적 정렬을 위해 보관.
// main의 src/main/todo/todoState.ts와 모양을 일치시킨다.
export type Todo = {
    id: string
    text: string
    completed: boolean
    createdAt: number
}

// 리스트 가시성 필터. 데스크탑 별창이라 URL hash 라우팅 없이 useState로 다룬다.
export type TodoFilter = 'all' | 'active' | 'completed'
