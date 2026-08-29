// 운세 영속 데이터의 IPC 계약.
// main reducer · preload bridge · renderer mirror 세 곳이 모두 이 한 파일을 import한다.

// 운수 단계. 5가 가장 좋고(대길) 1이 가장 안 좋음(대흉).
export type FortuneLevel = 1 | 2 | 3 | 4 | 5

// 하루치 운세 1건. 같은 날에는 같은 결과가 유지된다(roll은 날짜당 멱등).
export type FortuneRecord = {
    date: string // 'YYYY-MM-DD' (로컬 기준)
    level: FortuneLevel
    scoreAwarded: number // 운세 '점수'(구슬 표시용, 60~100). 단계 기반. 재화 지급액과는 별개.
    pointReward: number // 실제 지급 포인트(재화). 1~30 랜덤. 본 시점에 player 점수로 가산됨.
    text: string // 운세 메시지
}

export type FortuneState = {
    today: FortuneRecord | null
}

// 의미 단위 액션. 'roll'은 "오늘 운세를 보장한다"는 뜻 — 이미 오늘 운세가 있으면 그대로 둔다.
// 오늘 날짜는 main이 결정하므로 renderer는 날짜를 보내지 않는다.
export type FortuneEvent = { type: 'roll' }

export const INITIAL_FORTUNE_STATE: FortuneState = {
    today: null,
}

// UI 표시용 단계 라벨. renderer가 import해 팝업에 보여준다.
export const FORTUNE_LEVEL_LABELS: Record<FortuneLevel, string> = {
    5: '대길',
    4: '길',
    3: '보통',
    2: '흉',
    1: '대흉',
}
