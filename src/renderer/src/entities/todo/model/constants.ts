// localStorage 키. 'persist:todo' partition에 저장되므로 펫 윈도우와 충돌하지 않는다.
export const STORAGE_KEY = 'game.todos'

// 저장 포맷 버전. 스키마가 바뀔 때 올려서 구버전 데이터를 안전하게 폐기한다.
export const STORAGE_VERSION = 1
