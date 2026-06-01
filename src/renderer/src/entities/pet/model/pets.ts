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

// 별 — 금색 별 친구.
const STAR: PetDef = {
    id: 'star',
    name: '반짝이',
    pixels: [
        '....s....',
        '...sss...',
        '..sssss..',
        'sssssssss',
        '.sssssss.',
        '..sssss..',
        '..s...s..',
        '.s.....s.',
        '.........',
    ],
    palette: { s: '#f6c945' },
}

export const PET_CATALOG: PetDef[] = [CHICK, SLIME, STAR]

export const findPet = (petId: string): PetDef | undefined =>
    PET_CATALOG.find((pet) => pet.id === petId)
