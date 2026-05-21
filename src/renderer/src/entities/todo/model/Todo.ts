// 리스트 가시성 필터 (renderer 전용 view-state).
// 명세 — 진행중/완료 두 탭만 둔다. '전체' 탭은 두지 않는다.
// Todo 데이터 타입 자체는 @shared/contracts/todoEvents에 있다 (main과 공유).
export type TodoFilter = 'active' | 'completed'
