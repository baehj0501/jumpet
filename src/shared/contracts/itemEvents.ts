// 소모성 아이템(돌봄 재료)의 IPC 계약.
// main reducer · preload bridge · renderer mirror 세 곳이 모두 이 한 파일을 import한다.
//
// 이번 단계 범위: 돌봄에 쓰는 소모성 아이템만. 꾸미기(데코)/펫수집은 후속.

// 소모 아이템의 카테고리 = 그 아이템을 쓰는 돌봄 액션.
// food → 밥주기, toy → 놀아주기. (쓰다듬기·눕기는 무료 액션이라 아이템 없음.)
export type ConsumableCategory = 'food' | 'toy'

export type ConsumableItemDef = {
    id: string
    category: ConsumableCategory
    name: string
    emoji: string
}

// 시드 풀 — 뽑기가 이 안에서 균등 추첨한다.
// docs/features/gacha-and-inventory.md: 정식 풀·등급은 후속(Open Question).
export const CONSUMABLE_ITEMS: ConsumableItemDef[] = [
    { id: 'food_bone', category: 'food', name: '뼈다귀', emoji: '🦴' },
    { id: 'food_kibble', category: 'food', name: '사료', emoji: '🥫' },
    { id: 'food_treat', category: 'food', name: '간식', emoji: '🍪' },
    { id: 'toy_ball', category: 'toy', name: '공', emoji: '🎾' },
    { id: 'toy_doll', category: 'toy', name: '인형', emoji: '🧸' },
    { id: 'toy_disc', category: 'toy', name: '원반', emoji: '🥏' },
]

// 뽑기 1회 비용(포인트). 점수 부족 시 뽑기 비활성.
export const GACHA_COST = 20

// itemId → 보유 개수. 0이거나 없으면 미보유.
export type ItemState = {
    counts: Record<string, number>
}

// consume만 의미 단위 apply로 받는다. 뽑기는 점수 차감·결과 반환이 있어 별도 IPC(item:gacha).
export type ItemEvent = { type: 'consume'; itemId: string }

// 뽑기 결과 — item:gacha가 반환한다.
export type GachaResult = {
    success: boolean // 점수 부족이면 false
    wonItemId: string | null
    state: ItemState
}

export const INITIAL_ITEM_STATE: ItemState = {
    counts: {},
}
