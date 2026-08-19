// 동반 펫(캐릭터 옆에 따라다니는 펫) 선택 + 보유의 IPC 계약.
// 펫 창(App)과 메뉴 창(펫 탭)이 같은 상태를 공유하는 SSOT.
// petId는 renderer entities/pet의 PetId와 같은 문자열. ''이면 '장착 안 함'.
// ownedPets는 뽑기로 해제한 펫 id 목록 — 보유한 펫만 장착할 수 있다.

export type PetSelectionState = {
    petId: string
    ownedPets: string[]
}

export type PetSelectionEvent =
    // 장착/해제 — 보유한 펫만(''은 항상 허용=해제).
    | { type: 'select'; petId: string }
    // 뽑기로 보유 추가.
    | { type: 'unlock'; petId: string }

export const INITIAL_PET_SELECTION_STATE: PetSelectionState = {
    petId: '',
    ownedPets: [],
}

// 펫 뽑기 1회 비용(포인트). 데코·캐릭터와 동일하게 50pt로 통일.
export const PET_GACHA_COST = 50
