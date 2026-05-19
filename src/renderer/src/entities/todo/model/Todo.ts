// 단일 할 일 항목. createdAt은 안정적 정렬을 위해 보관.
export type Todo = {
    id: string
    text: string
    completed: boolean
    createdAt: number
}

// 리스트 가시성 필터. 데스크탑 별창이라 URL hash 라우팅 없이 useState로 다룬다.
export type TodoFilter = 'all' | 'active' | 'completed'

// JSON.parse 결과의 런타임 검증. as 단정 회피.
export const isTodo = (value: unknown): value is Todo => {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    const candidate = value as Record<string, unknown>
    return (
        typeof candidate.id === 'string' &&
        typeof candidate.text === 'string' &&
        typeof candidate.completed === 'boolean' &&
        typeof candidate.createdAt === 'number'
    )
}
