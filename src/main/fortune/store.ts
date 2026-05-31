import Store from 'electron-store'
import {
    INITIAL_FORTUNE_STATE,
    type FortuneRecord,
    type FortuneState,
} from '@shared/contracts/fortuneEvents'

// playerState/todo와 같은 디스크 영속 패턴 — 같은 config.json에 'fortune' 키를 추가한다.
type SchemaShape = {
    fortune: FortuneState
}

const store = new Store<SchemaShape>({
    defaults: {
        fortune: INITIAL_FORTUNE_STATE,
    },
})

const isFortuneRecord = (value: unknown): value is FortuneRecord => {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    const candidate = value as Record<string, unknown>
    if (typeof candidate.date !== 'string') return false
    if (typeof candidate.text !== 'string') return false
    if (
        typeof candidate.level !== 'number' ||
        ![1, 2, 3, 4, 5].includes(candidate.level)
    ) {
        return false
    }
    if (typeof candidate.scoreAwarded !== 'number' || !Number.isFinite(candidate.scoreAwarded)) {
        return false
    }
    return true
}

export const readFortuneState = (): FortuneState => {
    // 디스크 손상·사용자 자가 편집 등으로 깨진 값이 들어올 수 있어 가볍게 검사.
    const raw = store.get('fortune') as FortuneState | undefined
    if (raw && (raw.today === null || isFortuneRecord(raw.today))) {
        return { today: raw.today }
    }
    console.warn('[fortuneState] hydration failed, resetting to INITIAL_FORTUNE_STATE', raw)
    store.set('fortune', INITIAL_FORTUNE_STATE)
    return INITIAL_FORTUNE_STATE
}

export const writeFortuneState = (next: FortuneState): void => {
    store.set('fortune', next)
}
