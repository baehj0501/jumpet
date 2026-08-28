// 데코 카탈로그(renderer) — PNG는 renderer에서만 import 가능하므로 카탈로그를 여기 둔다.
// assets/{theme}/*.png 를 Vite import.meta.glob으로 한 번에 가져와 자동 구성한다.
// main은 itemId 문자열만 알면 되고(WorldState), 이미지는 renderer가 이 카탈로그로 해석한다.

export type DecorTheme = 'park' | 'shipping' | 'snow' | 'star'

export type DecorItemDef = {
    id: string
    name: string
    theme: DecorTheme
    src: string
}

export const DECOR_THEMES: DecorTheme[] = ['park', 'shipping', 'snow', 'star']
export const THEME_LABELS: Record<DecorTheme, string> = {
    park: '공원',
    shipping: '택배',
    snow: '겨울',
    star: '별',
}

import thumbPark from '../assets/thumbnails/park.png'
import thumbShipping from '../assets/thumbnails/shipping.png'
import thumbSnow from '../assets/thumbnails/snow.png'
import thumbStar from '../assets/thumbnails/star.png'

// 테마 폴더 썸네일.
export const THEME_THUMBNAILS: Record<DecorTheme, string> = {
    park: thumbPark,
    shipping: thumbShipping,
    snow: thumbSnow,
    star: thumbStar,
}

// 모든 테마(피요=공원 / 쿠피=택배 / 윙피=겨울 / 슈피=별)의 데코가 한글 파일명을 쓰므로
// 파일명을 그대로 이름으로 사용한다. (특별한 이름 매핑이 필요하면 여기에 추가)
const NAME_OVERRIDES: Record<string, string> = {}

const modules = import.meta.glob('../assets/*/*.png', {
    eager: true,
    import: 'default',
}) as Record<string, string>

const buildCatalog = (): DecorItemDef[] => {
    const items: DecorItemDef[] = []
    for (const [path, src] of Object.entries(modules)) {
        const match = path.match(/\/assets\/([^/]+)\/(.+)\.png$/)
        if (!match) {
            continue
        }
        const theme = match[1] as DecorTheme
        const base = match[2]
        const id = `${theme}_${base}`
        items.push({ id, name: NAME_OVERRIDES[id] ?? base, theme, src })
    }
    // 테마 순 → 이름 있는 것 먼저 → id 순.
    items.sort((a, b) => {
        const themeDiff = DECOR_THEMES.indexOf(a.theme) - DECOR_THEMES.indexOf(b.theme)
        if (themeDiff !== 0) {
            return themeDiff
        }
        const aNamed = NAME_OVERRIDES[a.id] ? 0 : 1
        const bNamed = NAME_OVERRIDES[b.id] ? 0 : 1
        if (aNamed !== bNamed) {
            return aNamed - bNamed
        }
        return a.id.localeCompare(b.id)
    })
    return items
}

export const DECOR_ITEMS: DecorItemDef[] = buildCatalog()

const DECOR_BY_ID: Record<string, DecorItemDef> = Object.fromEntries(
    DECOR_ITEMS.map((item) => [item.id, item]),
)

export const findDecor = (itemId: string): DecorItemDef | undefined => DECOR_BY_ID[itemId]

// 테마별 목록(그룹 표시용).
export const decorByTheme = (theme: DecorTheme): DecorItemDef[] =>
    DECOR_ITEMS.filter((item) => item.theme === theme)
