// 플레이어 영속 데이터의 renderer 측 표현.
// main의 src/main/playerState/playerState.ts와 모양을 일치시킨다.

export type PlayerState = {
    score: number
}

export type PlayerEvent = {
    type: 'manual'
    delta: number
}

export const INITIAL_PLAYER_STATE: PlayerState = {
    score: 0,
}
