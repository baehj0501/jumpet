// 선택된 캐릭터(펫)의 IPC 계약.
// 펫 윈도우(App)와 통합 메뉴 창(홈 탭)이 같은 선택값을 공유하는 SSOT.
// characterId는 renderer entities/character의 CharacterId와 같은 문자열이지만,
// 계약 레이어는 renderer 타입에 의존하지 않으려고 string으로 둔다(유효성 검증은 renderer 책임).

export type CharacterSelectionState = {
    characterId: string
}

export type CharacterSelectionEvent = { type: 'select'; characterId: string }

// 기본 캐릭터. assets 카탈로그의 첫 캐릭터와 일치시켜 둔다.
export const INITIAL_CHARACTER_SELECTION_STATE: CharacterSelectionState = {
    characterId: 'piyoo',
}
