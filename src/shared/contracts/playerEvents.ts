// 플레이어 영속 데이터의 IPC 계약.
// main reducer · preload bridge · renderer mirror 세 곳이 모두 이 한 파일을 import한다.
// 새 case 추가 시 컴파일러가 사용처 누락을 모두 잡아준다.

export type PlayerState = {
    score: number
}

export type PlayerEvent =
    // 디버그·시드 이벤트.
    | { type: 'manual'; delta: number }
    // 도메인 이벤트: TODO를 완료하면 1~5점 랜덤 지급. delta는 main reducer가 결정.
    | { type: 'todoComplete' }

export const INITIAL_PLAYER_STATE: PlayerState = {
    score: 0,
}
