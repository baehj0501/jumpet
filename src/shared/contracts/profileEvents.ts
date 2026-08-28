// 홈 '정보' 프로필(캐릭터 이름·이름·생일)의 IPC 계약.
// 메뉴 창(CareTab)과 펫 창(App)이 같은 값을 공유하도록 main SSOT로 둔다.
// (이전엔 메뉴 창 localStorage에만 있어 펫 창과 공유가 불안정했다.)

export type ProfileField = 'characterName' | 'petName' | 'birthday'

export type ProfileState = {
    // 캐릭터 이름(종류명). ''이면 '선택된 캐릭터 기본명을 따라간다'는 의미(렌더러에서 해석).
    characterName: string
    // 펫 이름 — 좌클릭 멘트에서 부르는 이름.
    petName: string
    birthday: string
    // 생일을 마지막으로 변경한 시각(epoch ms). 0이면 아직 변경한 적 없음(최초 변경은 허용).
    // 생일 보너스 어뷰징 방지를 위해 변경 후 1달 쿨타임을 둔다.
    birthdayUpdatedAt: number
}

export type ProfileEvent = { type: 'set'; field: ProfileField; value: string }

export const INITIAL_PROFILE_STATE: ProfileState = {
    characterName: '',
    petName: '조조',
    birthday: '5월 31일',
    birthdayUpdatedAt: 0,
}

// 프로필 값 최대 길이.
export const MAX_PROFILE_VALUE_LENGTH = 20

// 생일 변경 쿨타임 — 한 번 바꾸면 30일간 다시 못 바꾼다.
export const BIRTHDAY_EDIT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000
