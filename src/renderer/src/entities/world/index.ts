// Public API of the world entity (데스크탑 월드 꾸미기).
export type { PlacedItem, WorldMode, WorldState } from '@shared/contracts/worldEvents'
export type { DecorItemDef, DecorTheme } from './model/decorCatalog'
export {
    DECOR_ITEMS,
    DECOR_THEMES,
    THEME_LABELS,
    THEME_THUMBNAILS,
    findDecor,
    decorByTheme,
} from './model/decorCatalog'
export {
    useOwnedDecor,
    usePlacedItems,
    useWorldMode,
    useWorldActions,
    initializeWorldSync,
} from './model/useWorldStore'
