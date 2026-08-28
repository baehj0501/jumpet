// Public API of the item entity (소모성 아이템 인벤토리).
// 외부 layer는 이 barrel을 통해서만 import한다.
export type { ConsumableItemDef, ConsumableCategory, GachaResult } from '@shared/contracts/itemEvents'
export { CONSUMABLE_ITEMS, GACHA_COST } from '@shared/contracts/itemEvents'
export { useItemCounts, useItemActions, initializeItemSync } from './model/useItemStore'
