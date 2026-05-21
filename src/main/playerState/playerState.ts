// 플레이어 영속 데이터의 진실의 원천(SSOT).
// 점수(재화)로 시작하고, 행복도·경험치·잠금해제 등은 추후 같은 객체에 필드로 추가한다.
//
// 외부에는 PlayerEvent(의미 단위 액션)만 노출해 호출자가 임의로 점수를 조작하지 못하게 한다.
// 새 이벤트가 추가될 때마다 union과 reducer에 한 case씩 더하면 된다.

export type PlayerState = {
    score: number
}

export type PlayerEvent = {
    // 디버그·시드 이벤트. 첫 도메인 이벤트(예: 'pet')가 도입되는 시점에
    // production 빌드에서는 차단하는 방향으로 좁힐 예정.
    type: 'manual'
    delta: number
}

export const INITIAL_PLAYER_STATE: PlayerState = {
    score: 0,
}

// 음수 잔액은 도메인 invariant — reducer 결과에서 한 번만 floor한다.
const MIN_SCORE = 0

// 같은 PlayerState + 이벤트 → 항상 같은 결과를 내는 순수 함수.
// IPC 핸들러는 이 함수만 호출하고, 영속화·broadcast는 호출자가 책임진다.
export const reducePlayerState = (state: PlayerState, event: PlayerEvent): PlayerState => {
    switch (event.type) {
        case 'manual': {
            return {
                ...state,
                score: Math.max(MIN_SCORE, state.score + event.delta),
            }
        }
        default: {
            // PlayerEvent union이 확장되면 TS가 event.type을 never로 좁히지 못해
            // 여기서 컴파일 에러로 잡아준다 (case를 빠뜨릴 수 없게).
            const exhaustiveCheck: never = event.type
            throw new Error(`Unhandled PlayerEvent type: ${String(exhaustiveCheck)}`)
        }
    }
}
