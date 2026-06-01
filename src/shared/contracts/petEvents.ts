// 동반 펫(캐릭터 옆에 따라다니는 펫) 선택의 IPC 계약.
// 펫 창(App)과 메뉴 창(펫 탭)이 같은 장착 상태를 공유하는 SSOT.
// petId는 renderer entities/pet의 PetId와 같은 문자열. ''이면 '장착 안 함'.

export type PetSelectionState = {
    petId: string
}

export type PetSelectionEvent = { type: 'select'; petId: string }

export const INITIAL_PET_SELECTION_STATE: PetSelectionState = {
    petId: '',
}
