// 링크 미니 버튼 플로팅 창의 *표시 상태* 영속 도메인.
// link 도메인(링크 데이터)과 별개 — 이건 윈도우 visibility/position 같은 UI 상태.
// main 전용이라 renderer/preload에 노출하지 않고 main 안에서만 다룬다.

export type LinkBarPosition = {
    x: number
    y: number
}

export type LinkBarState = {
    // 사용자가 우클릭 메뉴에서 켜둔 상태인지. 기본 false — 신규 사용자 시야 깨끗.
    visible: boolean
    // 사용자가 드래그로 옮긴 마지막 위치.
    // null이면 한 번도 옮긴 적 없거나 영구 초기화된 상태 — 시작 시 캐릭터 오른쪽 default 사용.
    position: LinkBarPosition | null
}

export type LinkBarEvent =
    | { type: 'toggle' }
    | { type: 'show' }
    | { type: 'hide' }
    // 사용자 드래그 후 'moved' 이벤트로 자동 영속화.
    | { type: 'setPosition'; x: number; y: number }

export const INITIAL_LINK_BAR_STATE: LinkBarState = {
    visible: false,
    position: null,
}

export const reduceLinkBarState = (state: LinkBarState, event: LinkBarEvent): LinkBarState => {
    switch (event.type) {
        case 'toggle': {
            return { ...state, visible: !state.visible }
        }
        case 'show': {
            if (state.visible) {
                return state
            }
            return { ...state, visible: true }
        }
        case 'hide': {
            if (!state.visible) {
                return state
            }
            return { ...state, visible: false }
        }
        case 'setPosition': {
            // 같은 좌표면 이전 state를 그대로 반환 — applyLinkBarEvent가 reference 비교로
            // 디스크 write/broadcast 단축 경로에 진입한다.
            // (applyLinkBarEvent는 윈도우 setPosition을 호출하지 않으므로 'moved' 재발화로 인한
            //  무한 루프 위험 자체는 없다 — 이 dedup은 순수 비용 절감.)
            if (
                state.position &&
                state.position.x === event.x &&
                state.position.y === event.y
            ) {
                return state
            }
            return { ...state, position: { x: event.x, y: event.y } }
        }
        default: {
            const exhaustiveCheck: never = event
            throw new Error(`Unhandled LinkBarEvent: ${JSON.stringify(exhaustiveCheck)}`)
        }
    }
}
