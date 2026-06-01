// 동반 펫 카탈로그 — 펫 전용 이미지가 없어 픽셀아트 스프라이트(PixelArt 그리드 + 팔레트)로 정의.
// 펫 창(App)이 캐릭터 옆에, 펫 탭이 카드로 같은 스프라이트를 렌더한다.

export type PetDef = {
    id: string
    name: string
    pixels: string[]
    palette: Record<string, string>
}

// 병아리 — 노랑 몸 + 주황 부리/다리.
const CHICK: PetDef = {
    id: 'chick',
    name: '삐약이',
    pixels: [
        '..#####..',
        '.#yyyyy#.',
        '#yyyyyyy#',
        '#yeyyyey#',
        '#yyyyyyy#',
        '#yyybyyy#',
        '#yyyyyyy#',
        '.#yyyyy#.',
        '...b.b...',
    ],
    palette: { '#': '#c79a3a', y: '#f7df85', e: '#2a2a2a', b: '#f0922e' },
}

// 슬라임 — 연두 블롭.
const SLIME: PetDef = {
    id: 'slime',
    name: '몰랑이',
    pixels: [
        '.........',
        '..#####..',
        '.#ggggg#.',
        '#ggggggg#',
        '#gegggeg#',
        '#ggggggg#',
        '#ggggggg#',
        '.#######.',
        '.........',
    ],
    palette: { '#': '#2f7a3a', g: '#8fe0a0', e: '#1a3a1a' },
}

// 별 — 금색 별 친구(외곽선 + 채움).
const STAR: PetDef = {
    id: 'star',
    name: '반짝이',
    pixels: [
        '....o....',
        '...oso...',
        '..ossso..',
        'oosssssoo',
        '.ossssso.',
        '..ooooo..',
        '..o...o..',
        '.o.....o.',
        '.........',
    ],
    palette: { s: '#f6c945', o: '#c79a3a' },
}

// 고양이 — 회색 + 뾰족 귀 + 분홍 코.
const CAT: PetDef = {
    id: 'cat',
    name: '나비',
    pixels: [
        '.o.....o.',
        '.ogo.ogo.',
        '.ooooooo.',
        '.ogggggo.',
        '.ogegego.',
        '.oggpggo.',
        '.ogggggo.',
        '..ooooo..',
        '.........',
    ],
    palette: { o: '#7a7e8a', g: '#c8ccd6', e: '#2a2a2a', p: '#f08aa6' },
}

// 토끼 — 흰 몸 + 긴 귀 + 분홍 코.
const RABBIT: PetDef = {
    id: 'rabbit',
    name: '깡총이',
    pixels: [
        '.owo.owo.',
        '.owo.owo.',
        '.owo.owo.',
        '.ooooooo.',
        '.owwwwwo.',
        '.owewewo.',
        '.owwpwwo.',
        '..ooooo..',
        '.........',
    ],
    palette: { o: '#b59db0', w: '#fdfdff', e: '#2a2a2a', p: '#f3a6c2' },
}

// 펭귄 — 네이비 몸 + 흰 배 + 주황 부리/발.
const PENGUIN: PetDef = {
    id: 'penguin',
    name: '뒤뚱이',
    pixels: [
        '..ooooo..',
        '.obbbbbo.',
        'obwbbbwbo',
        'obbbkbbbo',
        'obwwwwwbo',
        'obwwwwwbo',
        '.owwwwwo.',
        '..okkko..',
        '.........',
    ],
    palette: { o: '#243a5e', b: '#41557e', w: '#f2f6ff', k: '#f3961e' },
}

// 곰 — 갈색 + 둥근 귀 + 진한 코.
const BEAR: PetDef = {
    id: 'bear',
    name: '곰곰이',
    pixels: [
        '.oo...oo.',
        'obbo.obbo',
        '.ooooooo.',
        '.obbbbbo.',
        '.obebebo.',
        '.obbkbbo.',
        '.obbbbbo.',
        '..ooooo..',
        '.........',
    ],
    palette: { o: '#6b4a2a', b: '#bb8350', e: '#2a2a2a', k: '#4a2e18' },
}

export const PET_CATALOG: PetDef[] = [CHICK, SLIME, STAR, CAT, RABBIT, PENGUIN, BEAR]

export const findPet = (petId: string): PetDef | undefined =>
    PET_CATALOG.find((pet) => pet.id === petId)
