// 운세 영속 데이터의 진실의 원천(SSOT) reducer.
// 타입/시드는 @shared/contracts에서 import해 main·preload·renderer가 동일 정의를 공유한다.

import type {
    FortuneEvent,
    FortuneLevel,
    FortuneRecord,
    FortuneState,
} from '@shared/contracts/fortuneEvents'
import { FORTUNE_POOL_BY_LEVEL, LEVEL_DISTRIBUTION, SCORE_BY_LEVEL } from './pool'

const FORTUNE_LEVELS: FortuneLevel[] = [5, 4, 3, 2, 1]

// 확률 분포에 따라 단계를 추첨한다 (Math.random은 'roll'의 도메인 룰 자체).
const pickLevel = (): FortuneLevel => {
    const roll = Math.random()
    let cumulative = 0
    for (const level of FORTUNE_LEVELS) {
        cumulative += LEVEL_DISTRIBUTION[level]
        if (roll < cumulative) {
            return level
        }
    }
    // 부동소수 합산 오차로 끝까지 도달하면 가장 흔한 단계로 폴백.
    return 3
}

const pickScore = (level: FortuneLevel): number => {
    const [min, max] = SCORE_BY_LEVEL[level]
    const range = max - min + 1
    return min + Math.floor(Math.random() * range)
}

const pickMessage = (level: FortuneLevel): string => {
    const pool = FORTUNE_POOL_BY_LEVEL[level]
    return pool[Math.floor(Math.random() * pool.length)]
}

// 같은 FortuneState + 같은 today면 결과가 같다(랜덤은 todoComplete처럼 도메인 룰).
// 'roll'은 날짜당 멱등 — 오늘 운세가 이미 있으면 state를 그대로 반환해 재추첨/중복 보상을 막는다.
// today는 외부 입력(시계)이라 호출자가 주입한다 — 'YYYY-MM-DD' 로컬 날짜.
export const reduceFortuneState = (
    state: FortuneState,
    event: FortuneEvent,
    today: string,
): FortuneState => {
    switch (event.type) {
        case 'roll': {
            if (state.today && state.today.date === today) {
                return state
            }
            const level = pickLevel()
            const record: FortuneRecord = {
                date: today,
                level,
                scoreAwarded: pickScore(level),
                text: pickMessage(level),
            }
            return { today: record }
        }
        default: {
            const exhaustiveCheck: never = event.type
            throw new Error(`Unhandled FortuneEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
