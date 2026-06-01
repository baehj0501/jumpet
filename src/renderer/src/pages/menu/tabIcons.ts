// 탭바용 다색 픽셀 아이콘. PixelArt(grid + palette)로 렌더한다.
// 각 16×16, 외곽선(o) + 음영/하이라이트로 디테일. '.'은 투명. (모든 행 정확히 16칸)

export type TabIconArt = { pixels: string[]; palette: Record<string, string> }

// 집 — 빨강 지붕 + 크림 벽 + 창문 + 문 + 잔디.
const HOME: TabIconArt = {
    pixels: [
        '................',
        '.......oo.......',
        '......orro......',
        '.....orrrro.....',
        '....orrrrrro....',
        '...orrrrrrrro...',
        '..orrrrrrrrrro..',
        '.orrrrrrrrrrrro.',
        '.owwwwwwwwwwwwo.',
        '.owLLwwddwwLLwo.',
        '.owLLwwddwwLLwo.',
        '.owwwwwddwwwwwo.',
        '.owwwwwddwwwwwo.',
        '.oooooooooooooo.',
        '..gggggggggggg..',
        '................',
    ],
    palette: { o: '#7a4a30', r: '#e0584d', w: '#f6e7c4', d: '#9c6b3f', L: '#bfe6f7', g: '#7ec85a' },
}

// 달력 — 회색 링 + 빨강 헤더 + 흰 본문 + 분홍 마크.
const SCHEDULE: TabIconArt = {
    pixels: [
        '................',
        '....bb....bb....',
        '....bb....bb....',
        '.oooooooooooooo.',
        '.orrrrrrrrrrrro.',
        '.orrrrrrrrrrrro.',
        '.owwwwwwwwwwwwo.',
        '.owmmwwmmwwmmwo.',
        '.owwwwwwwwwwwwo.',
        '.owmmwwmmwwmmwo.',
        '.owwwwwwwwwwwwo.',
        '.owmmwwmmwwmmwo.',
        '.owwwwwwwwwwwwo.',
        '.oooooooooooooo.',
        '................',
        '................',
    ],
    palette: { b: '#8a99a8', o: '#7a6a5a', r: '#e0584d', w: '#fbf7ef', m: '#d05a8e' },
}

// 클립보드 + 초록 체크 — 할일.
const TODO: TabIconArt = {
    pixels: [
        '................',
        '......oooo......',
        '.....occcco.....',
        '..oooooooooooo..',
        '..opwwwwwwwwpo..',
        '..opwwwwwwwgpo..',
        '..opwwwwwwggpo..',
        '..opwgwwggwwpo..',
        '..opwggggwwwpo..',
        '..opwwggwwwwpo..',
        '..opwwwwwwwwpo..',
        '..opwwwwwwwwpo..',
        '..oooooooooooo..',
        '................',
        '................',
        '................',
    ],
    palette: { o: '#7a5a3a', c: '#9aa7b4', p: '#c9a06a', w: '#fbf7ef', g: '#46b35a' },
}

// 모래시계 — 나무 캡 + 유리 + 모래.
const TIMER: TabIconArt = {
    pixels: [
        '................',
        '..oooooooooooo..',
        '..oWWWWWWWWWWo..',
        '..osssssssssso..',
        '...osssssssso...',
        '....osssssso....',
        '.....ossso......',
        '......o..o......',
        '......o..o......',
        '.....o....o.....',
        '....o......o....',
        '...osssssssso...',
        '..oWWWWWWWWWWo..',
        '..oooooooooooo..',
        '................',
        '................',
    ],
    palette: { o: '#9c6b3f', W: '#c9a06a', s: '#f6c945' },
}

// 수정구슬 — 보라 구슬(하이라이트) + 파랑 받침.
const FORTUNE: TabIconArt = {
    pixels: [
        '................',
        '.....oooooo.....',
        '...ooLLppppoo...',
        '..oLLLppppppso..',
        '..oLLpppppppso..',
        '.opLpppppppppso.',
        '.opppppppppppso.',
        '.oppppppppppsso.',
        '..opppppppppso..',
        '...ooppppppoo...',
        '....RRRRRRRR....',
        '..ooRRRRRRRRoo..',
        '..oRRRRRRRRRRo..',
        '...oRRRRRRRRo...',
        '................',
        '................',
    ],
    palette: { o: '#6a4aa0', p: '#9d6fe0', L: '#e4d6fa', s: '#7a52c0', R: '#3a8fc4' },
}

// 가챠 머신 — 유리돔 + 알사탕 + 파랑 몸체 + 배출구.
const GACHA: TabIconArt = {
    pixels: [
        '................',
        '....oooooooo....',
        '...oggggggggo...',
        '..oggggggggggo..',
        '..ogaggbggcggo..',
        '..ogcggaggbggo..',
        '...oggggggggo...',
        '..PPPPPPPPPPPP..',
        '..PPoOOOOOOoPP..',
        '..PPPPPPPPPPPP..',
        '..PPPPkkkkPPPP..',
        '..PPPPkkkkPPPP..',
        '..oooPkkkkPooo..',
        '..oooooooooooo..',
        '................',
        '................',
    ],
    palette: {
        o: '#2f6aa8',
        g: '#cdebf8',
        a: '#f29b9b',
        b: '#f7df85',
        c: '#93c8ee',
        P: '#4a9fd8',
        O: '#dfeefb',
        k: '#15406e',
    },
}

// 발바닥 — 갈색 펫 발자국(외곽선 + 음영).
const PET: TabIconArt = {
    pixels: [
        '................',
        '..oo......oo....',
        '.oppo....oppo...',
        '.oppo....oppo...',
        '..oo......oo....',
        '................',
        '....oo....oo....',
        '...oppo..oppo...',
        '...oppo..oppo...',
        '....oo....oo....',
        '....oooooooo....',
        '...oppppppppo...',
        '..oppppppppppo..',
        '..oppppppppppo..',
        '...oppppppppo...',
        '....oooooooo....',
    ],
    palette: { o: '#6e4a28', p: '#a06a3c' },
}

// 가방(백팩) — 갈색 가방 + 버클 + 주머니.
const ITEM: TabIconArt = {
    pixels: [
        '................',
        '....oo....oo....',
        '...obbo..obbo...',
        '...obbbbbbbbo...',
        '..obbbbbbbbbbo..',
        '.obbbbbbbbbbbbo.',
        '.obbbyyyyyybbbo.',
        '.obbbyOOOOybbbo.',
        '.obbbyOOOOybbbo.',
        '.obbbyyyyyybbbo.',
        '.obbbbbbbbbbbbo.',
        '.obbbbbbbbbbbbo.',
        '.oobbbbbbbbbboo.',
        '..oooooooooooo..',
        '................',
        '................',
    ],
    palette: { o: '#5a3a1f', b: '#9c6b3f', y: '#d2b088', O: '#f4e4c1' },
}

// 유튜브 — 빨강 라운드 + 흰 삼각형.
const YOUTUBE: TabIconArt = {
    pixels: [
        '................',
        '...oooooooooo...',
        '..orrrrrrrrrro..',
        '.orrrrrrrrrrrro.',
        '.orrrwwrrrrrrro.',
        '.orrrwwwwrrrrro.',
        '.orrrwwwwwwrrro.',
        '.orrrwwwwwwwrro.',
        '.orrrwwwwwwrrro.',
        '.orrrwwwwrrrrro.',
        '.orrrwwrrrrrrro.',
        '.orrrrrrrrrrrro.',
        '..orrrrrrrrrro..',
        '...oooooooooo...',
        '................',
        '................',
    ],
    palette: { o: '#a52218', r: '#e0322a', w: '#ffffff' },
}

// 톱니바퀴 — 설정(외곽선 + 중앙 구멍).
const SETTINGS: TabIconArt = {
    pixels: [
        '................',
        '....oooooooo....',
        '..ooggggggggoo..',
        '.oggggggggggggo.',
        '.ogggggwwgggggo.',
        '.ogggwwwwwwgggo.',
        '.ogggwoooowgggo.',
        '.ogggwoooowgggo.',
        '.ogggwwwwwwgggo.',
        '.ogggggwwgggggo.',
        '.oggggggggggggo.',
        '..ooggggggggoo..',
        '....oooooooo....',
        '................',
        '................',
        '................',
    ],
    palette: { o: '#5a6675', g: '#8a99a8', w: '#cfd8e2' },
}

export const TAB_ICON_ART: Record<string, TabIconArt> = {
    care: HOME,
    schedule: SCHEDULE,
    todo: TODO,
    timer: TIMER,
    fortune: FORTUNE,
    gacha: GACHA,
    pet: PET,
    item: ITEM,
    youtube: YOUTUBE,
    settings: SETTINGS,
}
