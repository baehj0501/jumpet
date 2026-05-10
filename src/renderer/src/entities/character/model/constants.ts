// 상태 전환 검토 주기.
export const STATE_TICK_INTERVAL_MS = 2000

// walking 중 윈도우 위치 갱신 주기 (~30 FPS).
export const WALK_FRAME_INTERVAL_MS = 33

// walking 속도 (px / 초).
export const WALK_SPEED_PX_PER_SEC = 60

// 매 tick에서 idle → walking으로 넘어갈 확률.
export const WALK_START_PROBABILITY = 0.3

// 매 tick에서 walking → idle로 멈출 확률.
export const WALK_STOP_PROBABILITY = 0.4
