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

// 이름 있는 대표 데코의 한글 이름. 나머지는 파일명(번호)을 그대로 쓴다.
const NAME_OVERRIDES: Record<string, string> = {
    park_flower: '꽃',
    park_butterfly: '나비',
    park_clover: '클로버',
    park_bluebird: '파랑새',
    park_stump: '그루터기',
    shipping_box: '상자',
    shipping_burger: '버거',
    shipping_dumbbell: '아령',
    shipping_gift: '선물',
    shipping_truck: '트럭',
    snow_igloo: '이글루',
    snow_radio: '라디오',
    snow_raincloud: '먹구름',
    snow_snowflake: '눈송이',
    snow_snowman2: '눈사람',
    star_beanbag: '빈백',
    star_rocket: '로켓',
    star_skateboard: '보드',
    star_starfish: '불가사리',
    star_tipi: '티피',
}

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
