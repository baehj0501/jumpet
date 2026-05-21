import Store from 'electron-store'
import { INITIAL_PLAYER_STATE, type PlayerState } from '@shared/contracts/playerEvents'

// 디스크 영속화 저장소.
// 위치: app.getPath('userData')/config.json (electron-store 기본 경로)
//
// 현재 단계에서는 PlayerState만 저장하지만, 추후 다른 영속 도메인(아이템, 잠금해제 등)이
// 늘어나면 같은 store에 키를 추가하거나 도메인별 Store 인스턴스를 만들 수 있다.
type SchemaShape = {
    player: PlayerState
}

const store = new Store<SchemaShape>({
    defaults: {
        player: INITIAL_PLAYER_STATE,
    },
})

export const readPlayerState = (): PlayerState => {
    // 디스크 손상·사용자 자가 편집 등으로 깨진 값이 들어올 수 있어 score만 가볍게 검사.
    // 통과 못 하면 INITIAL로 덮어써서 다음 read부터 정상 경로로 복귀.
    const raw = store.get('player') as PlayerState | undefined
    if (raw && Number.isFinite(raw.score)) {
        return raw
    }
    console.warn('[playerState] hydration failed, resetting to INITIAL_PLAYER_STATE', raw)
    store.set('player', INITIAL_PLAYER_STATE)
    return INITIAL_PLAYER_STATE
}

export const writePlayerState = (next: PlayerState): void => {
    store.set('player', next)
}
