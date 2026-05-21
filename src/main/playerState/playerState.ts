// 플레이어 영속 데이터의 진실의 원천(SSOT).
// 점수(재화)로 시작하고, 행복도·경험치·잠금해제 등은 추후 같은 객체에 필드로 추가한다.
//
// 외부에는 PlayerEvent(의미 단위 액션)만 노출해 호출자가 임의로 점수를 조작하지 못하게 한다.
// 새 이벤트가 추가될 때마다 union과 reducer에 한 case씩 더하면 된다.

export type PlayerState = {
    score: number
}

export type PlayerEvent =
    // 디버그·시드 이벤트. 첫 도메인 이벤트(예: 'pet')가 도입되는 시점에
    // production 빌드에서는 차단하는 방향으로 좁힐 예정.
    | { type: 'manual'; delta: number }
    // 도메인 이벤트: TODO를 완료하면 1~5점 랜덤 지급 (명세 "완료 시 점수 +1~5").
    // delta가 main의 reducer 안에서 결정돼 호출자(IPC 핸들러)는 점수 규칙을 모른다.
    | { type: 'todoComplete' }

export const INITIAL_PLAYER_STATE: PlayerState = {
    score: 0,
}

// 음수 잔액은 도메인 invariant — reducer 결과에서 한 번만 floor한다.
const MIN_SCORE = 0

// TODO 완료 시 지급되는 보상 범위(둘 다 포함).
const TODO_COMPLETE_MIN_REWARD = 1
const TODO_COMPLETE_MAX_REWARD = 5

const pickTodoCompleteReward = (): number => {
    const range = TODO_COMPLETE_MAX_REWARD - TODO_COMPLETE_MIN_REWARD + 1
    return TODO_COMPLETE_MIN_REWARD + Math.floor(Math.random() * range)
}

// 같은 PlayerState + 이벤트 → 결과 score만 본다 (Math.random은 'todoComplete'의 도메인 룰 자체).
// IPC 핸들러는 이 함수만 호출하고, 영속화·broadcast는 호출자가 책임진다.
export const reducePlayerState = (state: PlayerState, event: PlayerEvent): PlayerState => {
    switch (event.type) {
        case 'manual': {
            return {
                ...state,
                score: Math.max(MIN_SCORE, state.score + event.delta),
            }
        }
        case 'todoComplete': {
            return {
                ...state,
                score: state.score + pickTodoCompleteReward(),
            }
        }
        default: {
            // PlayerEvent union이 확장되면 TS가 event를 never로 좁히지 못해
            // 여기서 컴파일 에러로 잡아준다 (case를 빠뜨릴 수 없게).
            const exhaustiveCheck: never = event
            throw new Error(`Unhandled PlayerEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
