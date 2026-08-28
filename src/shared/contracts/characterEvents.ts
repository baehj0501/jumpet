// 선택된 캐릭터(펫)의 IPC 계약.
// 펫 윈도우(App)와 통합 메뉴 창(홈 탭)이 같은 선택값을 공유하는 SSOT.
// characterId는 renderer entities/character의 CharacterId와 같은 문자열이지만,
// 계약 레이어는 renderer 타입에 의존하지 않으려고 string으로 둔다(유효성 검증은 renderer 책임).

export type CharacterSelectionState = {
    characterId: string
    // 사용자가 첫 실행 온보딩에서 캐릭터를 직접 골랐는지. false면 캐릭터 창에 선택 오버레이를 띄운다.
    chosen: boolean
    // 보유(해제)한 캐릭터 id 목록. 온보딩에서 고른 스타터 1개로 시작하고, 나머지는 잠금.
    ownedCharacters: string[]
}

export type CharacterSelectionEvent =
    // 보유한 캐릭터로 전환(홈 탭 ‹ ›). 미보유면 무시.
    | { type: 'select'; characterId: string }
    // 온보딩 최초 선택 — 스타터 확정(chosen=true, 보유는 이 캐릭터 하나만).
    | { type: 'choose'; characterId: string }
    // (뽑기 등) 보유 추가.
    | { type: 'unlock'; characterId: string }

// 기본 캐릭터. assets 카탈로그의 첫 캐릭터와 일치시켜 둔다.
// chosen=false · ownedCharacters=[] — 첫 실행에는 아직 고르지 않은 상태(온보딩 노출).
export const INITIAL_CHARACTER_SELECTION_STATE: CharacterSelectionState = {
    characterId: 'piyoo',
    chosen: false,
    ownedCharacters: [],
}

// 캐릭터 뽑기 1회 비용(포인트). 데코·펫과 동일하게 50pt.
export const CHARACTER_GACHA_COST = 50
