// 플레이어 영속 데이터의 진실의 원천(SSOT) reducer.
// 타입/시드는 @shared/contracts에서 import해 main·preload·renderer가 동일 정의를 공유한다.

import type { PlayerEvent, PlayerState } from '@shared/contracts/playerEvents'

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
            // manual은 음수 잔액을 허용한다(예: 할일 완료 취소 시 보상 차감으로 0 미만 가능).
            return {
                ...state,
                score: state.score + event.delta,
            }
        }
        case 'todoComplete': {
            return {
                ...state,
                score: state.score + pickTodoCompleteReward(),
            }
        }
        case 'fortune': {
            // 금액은 운세 도메인이 단계에 따라 이미 결정해 전달한다.
            return {
                ...state,
                score: Math.max(MIN_SCORE, state.score + event.amount),
            }
        }
        case 'gachaSpin': {
            // 차감 가능 여부는 item 도메인이 먼저 확인한다. 여기선 잔액 floor만 보장.
            return {
                ...state,
                score: Math.max(MIN_SCORE, state.score - event.cost),
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
