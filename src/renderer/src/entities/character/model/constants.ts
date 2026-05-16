// 상태 전환 검토 주기.
export const STATE_TICK_INTERVAL_MS = 2000

// walking 속도 (px / 초). rAF 기반이라 별도 frame interval 상수는 두지 않는다.
export const WALK_SPEED_PX_PER_SEC = 60

// 매 tick에서 idle → walking으로 넘어갈 확률.
export const WALK_START_PROBABILITY = 0.3

// 매 tick에서 walking → idle로 멈출 확률.
export const WALK_STOP_PROBABILITY = 0.4
