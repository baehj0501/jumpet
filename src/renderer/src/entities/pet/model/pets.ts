// 동반 펫 카탈로그 — 펫 전용 이미지가 없어 픽셀아트 스프라이트(PixelArt 그리드 + 팔레트)로 정의.
// 펫 창(App)이 캐릭터 옆에, 펫 탭이 카드로 같은 스프라이트를 렌더한다.
// 모든 스프라이트는 9×9 그리드(행 9개 × 각 행 9글자). '.'은 투명.

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

// 강아지 — 갈색 + 늘어진 귀.
const DOG: PetDef = {
    id: 'dog',
    name: '멍멍이',
    pixels: [
        '.oo...oo.',
        'obbo.obbo',
        '.ooooooo.',
        'oBBBBBBBo',
        'oBeBBBeBo',
        'oBBBnBBBo',
        'oBBnnnBBo',
        '.oBBBBBo.',
        '..ooooo..',
    ],
    palette: { o: '#5a3a1e', b: '#7a4e28', B: '#cf9a5e', e: '#2a2a2a', n: '#3a2410' },
}

// 여우 — 주황 + 뾰족 귀 + 흰 입가.
const FOX: PetDef = {
    id: 'fox',
    name: '여우',
    pixels: [
        '.o.....o.',
        '.oro.oro.',
        '.ooooooo.',
        'oRRRRRRRo',
        'oReRRReRo',
        'oRwwwwwRo',
        'oRwwnwwRo',
        '.oRwwwRo.',
        '..ooooo..',
    ],
    palette: { o: '#a0481a', R: '#e8843a', r: '#c25e22', w: '#fbeee0', e: '#2a2a2a', n: '#3a2410' },
}

// 개구리 — 초록 + 위로 솟은 눈.
const FROG: PetDef = {
    id: 'frog',
    name: '개굴이',
    pixels: [
        '..o...o..',
        '.oeo.oeo.',
        '.ooooooo.',
        'oGGGGGGGo',
        'oGGGGGGGo',
        'oGGGGGGGo',
        'oGmmmmmGo',
        '.oGGGGGo.',
        '..ooooo..',
    ],
    palette: { o: '#2f7a3a', G: '#7bd17a', e: '#2a2a2a', m: '#3a5a2a' },
}

// 돼지 — 분홍 + 코.
const PIG: PetDef = {
    id: 'pig',
    name: '꿀꿀이',
    pixels: [
        '.oo...oo.',
        '.opo.opo.',
        '.ooooooo.',
        'oPPPPPPPo',
        'oPePPPePo',
        'oPPnPnPPo',
        'oPPnnnPPo',
        '.oPPPPPo.',
        '..ooooo..',
    ],
    palette: { o: '#c46a86', P: '#f3aec1', p: '#e58aa4', e: '#2a2a2a', n: '#cf6f8c' },
}

// 판다 — 흰 얼굴 + 검은 귀/눈.
const PANDA: PetDef = {
    id: 'panda',
    name: '판다',
    pixels: [
        '.kk...kk.',
        '.kko.okk.',
        '.ooooooo.',
        'oWWWWWWWo',
        'oWkWWWkWo',
        'oWWWnWWWo',
        'oWWmmmWWo',
        '.oWWWWWo.',
        '..ooooo..',
    ],
    palette: { o: '#3a3a3a', W: '#fbfbfb', k: '#2a2a2a', n: '#2a2a2a', m: '#7a7a7a' },
}

// 코알라 — 회색 + 큰 둥근 귀.
const KOALA: PetDef = {
    id: 'koala',
    name: '코알라',
    pixels: [
        'ggo...ogg',
        'ggo...ogg',
        '.ooooooo.',
        'oGGGGGGGo',
        'oGeGGGeGo',
        'oGGGkGGGo',
        'oGGkkkGGo',
        '.oGGGGGo.',
        '..ooooo..',
    ],
    palette: { o: '#6a6f78', G: '#b9bec7', g: '#9aa0aa', e: '#2a2a2a', k: '#3a3a3a' },
}

// 햄스터 — 베이지 + 통통 볼.
const HAMSTER: PetDef = {
    id: 'hamster',
    name: '햄찌',
    pixels: [
        '..ooooo..',
        '.oHHHHHo.',
        'oHHHHHHHo',
        'oHeHHHeHo',
        'oHHHnHHHo',
        'oCHHHHHCo',
        'oHHwwwHHo',
        '.oHHHHHo.',
        '..ooooo..',
    ],
    palette: { o: '#b98a4a', H: '#f0d49a', e: '#2a2a2a', n: '#7a4a24', C: '#f3b0a0', w: '#fff5e6' },
}

// 오리 — 노랑 + 주황 부리.
const DUCK: PetDef = {
    id: 'duck',
    name: '꽥꽥이',
    pixels: [
        '..ooooo..',
        '.oyyyyyo.',
        'oyyeyyyeo',
        'oyyyyyyyo',
        'kkkkyyyyo',
        'oyyyyyyyo',
        'oyyyyyyyo',
        '.oyyyyyo.',
        '..ooooo..',
    ],
    palette: { o: '#c79a3a', y: '#f7df85', e: '#2a2a2a', k: '#f0922e' },
}

// 부엉이 — 갈색 + 큰 눈.
const OWL: PetDef = {
    id: 'owl',
    name: '부엉이',
    pixels: [
        '.o.....o.',
        '.oo...oo.',
        '.ooooooo.',
        'oUwUUUwUo',
        'oUeUUUeUo',
        'oUUUkUUUo',
        'oUUUUUUUo',
        '.oUUUUUo.',
        '..ooooo..',
    ],
    palette: { o: '#6a4a2a', U: '#a9743f', w: '#f3e6cf', e: '#2a2a2a', k: '#f0922e' },
}

// 고슴도치 — 가시(짙은) + 베이지 얼굴.
const HEDGEHOG: PetDef = {
    id: 'hedgehog',
    name: '고슴도치',
    pixels: [
        '.ssssss..',
        'sssssss..',
        'ssFFFFs..',
        'sFFFFFFs.',
        'sFeFFFeFs',
        'sFFFnFFs.',
        'ssFFFFs..',
        '.ssssss..',
        '.........',
    ],
    palette: { s: '#5a4636', F: '#e6caa0', e: '#2a2a2a', n: '#3a2a1a' },
}

// 거북이 — 초록 + 등껍질.
const TURTLE: PetDef = {
    id: 'turtle',
    name: '거북이',
    pixels: [
        '.........',
        '...ggg...',
        '..gSSSg..',
        '.gSSSSSg.',
        'GgSSSSSgG',
        'GgggSgggG',
        '.G.....G.',
        '.........',
        '.........',
    ],
    palette: { g: '#2f7a3a', S: '#6db86a', G: '#9bd98f' },
}

// 물고기 — 하늘색 + 꼬리.
const FISH: PetDef = {
    id: 'fish',
    name: '뽀끔이',
    pixels: [
        '.........',
        '..fff..t.',
        '.fffffft.',
        'ffefffttt',
        'ffffffft.',
        '.fffff.t.',
        '..fff....',
        '.........',
        '.........',
    ],
    palette: { f: '#5ec3e8', e: '#2a2a2a', t: '#3a9ec4' },
}

// 문어 — 보라 + 다리.
const OCTOPUS: PetDef = {
    id: 'octopus',
    name: '문어',
    pixels: [
        '..ppppp..',
        '.ppppppp.',
        'ppppppppp',
        'ppepppepp',
        'ppppppppp',
        '.ppppppp.',
        '.ppppppp.',
        'p.p.p.p.p',
        'p.p.p.p.p',
    ],
    palette: { p: '#a06ad0', e: '#2a2a2a' },
}

// 고래 — 파랑 + 물줄기.
const WHALE: PetDef = {
    id: 'whale',
    name: '고래',
    pixels: [
        '....c....',
        '...c.c...',
        '.WWWWWWW.',
        'WWWWWWWWt',
        'WWeWWWWtt',
        'WWWWWWWWt',
        '.WWWWWWW.',
        '..WWWWW..',
        '.........',
    ],
    palette: { W: '#5a86d0', e: '#2a2a2a', t: '#3a63ac', c: '#a9cdf0' },
}

// 게 — 빨강 + 집게.
const CRAB: PetDef = {
    id: 'crab',
    name: '집게',
    pixels: [
        'C.......C',
        'CC.....CC',
        '.CCCCCCC.',
        'CCeCCCeCC',
        'CCCCCCCCC',
        '.CCCCCCC.',
        '.C.C.C.C.',
        'C.......C',
        '.........',
    ],
    palette: { C: '#e2553f', e: '#2a2a2a' },
}

// 달팽이 — 베이지 몸 + 나선 껍질.
const SNAIL: PetDef = {
    id: 'snail',
    name: '달팽이',
    pixels: [
        '......h.h',
        '.SSS..h.h',
        'SShhSS.h.',
        'ShHHhS...',
        'ShHhhS...',
        'SShhSSBBB',
        '.SSSBBBBB',
        '...BeBBBB',
        '..BBBBBB.',
    ],
    palette: { S: '#caa45a', h: '#9a7838', H: '#e6caa0', B: '#e8d6a8', e: '#2a2a2a' },
}

// 꿀벌 — 노랑+검정 줄무늬.
const BEE: PetDef = {
    id: 'bee',
    name: '꿀벌',
    pixels: [
        'w..o.o..w',
        '.wo...ow.',
        '..ooooo..',
        '.oykykyo.',
        '.okykyko.',
        '.oykykyo.',
        '.okykyko.',
        '..ooooo..',
        '.........',
    ],
    palette: { o: '#3a3a2a', y: '#f6cf45', k: '#3a3a2a', w: '#dff0ff' },
}

// 무당벌레 — 빨강 + 검은 점.
const LADYBUG: PetDef = {
    id: 'ladybug',
    name: '무당이',
    pixels: [
        '..kkkkk..',
        '.kkkkkkk.',
        'kkLkokLkk',
        'kLLLoLLLk',
        'kLoLoLoLk',
        'kLLLoLLLk',
        'kkLLoLLkk',
        '.kkkkkkk.',
        '..kkkkk..',
    ],
    palette: { k: '#2a2a2a', L: '#e2403a', o: '#2a2a2a' },
}

// 유령 — 흰 + 둥실.
const GHOST: PetDef = {
    id: 'ghost',
    name: '유령',
    pixels: [
        '..ooooo..',
        '.oWWWWWo.',
        'oWWWWWWWo',
        'oWeWWWeWo',
        'oWWWWWWWo',
        'oWWmmWWWo',
        'oWWWWWWWo',
        'oWoWoWoWo',
        '.o.o.o.o.',
    ],
    palette: { o: '#b9c4d6', W: '#fbfdff', e: '#3a3a4a', m: '#c0c8d6' },
}

// 아기용 — 초록 + 뿔 + 날개.
const DRAGON: PetDef = {
    id: 'dragon',
    name: '아기용',
    pixels: [
        'h.......h',
        '.o.....o.',
        '.ooooooo.',
        'DDGGGGGDD',
        'DGeGGGeGD',
        'DGGGnGGGD',
        'DGGmmmGGD',
        '.DGGGGGD.',
        '..ooooo..',
    ],
    palette: { o: '#2f7a3a', G: '#7bd17a', D: '#3a9a5a', e: '#2a2a2a', n: '#2a5a2a', m: '#e05a5a', h: '#f6cf45' },
}

// 공룡 — 연두 + 등 돌기.
const DINO: PetDef = {
    id: 'dino',
    name: '공룡이',
    pixels: [
        '....ttt..',
        '..ooooot.',
        '.oGGGGGo.',
        '.oeGGGGo.',
        '.oGGGGGot',
        '.oGGGGGo.',
        '.ooGGGoo.',
        '..o...o..',
        '.........',
    ],
    palette: { o: '#5a9a3a', G: '#a6dd6a', e: '#2a2a2a', t: '#3a7a2a' },
}

// 유니콘 — 흰 + 무지개 뿔.
const UNICORN: PetDef = {
    id: 'unicorn',
    name: '유니콘',
    pixels: [
        '....h....',
        '...mho...',
        '.o.mooo..',
        '.ooooooo.',
        'oWWWWWWWo',
        'oWeWWWmWo',
        'oWWWpWWWo',
        '.oWWWWWo.',
        '..ooooo..',
    ],
    palette: { o: '#cf9ec4', W: '#fdfdff', e: '#2a2a2a', p: '#f3a6c2', h: '#f6cf45', m: '#c98ad6' },
}

// 양 — 뭉게 털 + 검은 얼굴.
const SHEEP: PetDef = {
    id: 'sheep',
    name: '양이',
    pixels: [
        '.WW.WW.WW',
        'WWWWWWWWW',
        'WWkkkkkWW',
        '.WkFFFkW.',
        '.WkeFekW.',
        '.WkFnFkW.',
        '.WkkkkkW.',
        'WWWWWWWWW',
        '.WW.WW.WW',
    ],
    palette: { W: '#f3f3f0', k: '#3a3a3a', F: '#5a5a5a', e: '#fbfbfb', n: '#2a2a2a' },
}

// 얼룩소 — 흰 + 검은 얼룩.
const COW: PetDef = {
    id: 'cow',
    name: '얼룩소',
    pixels: [
        'ko.....ok',
        'koo...ook',
        '.ooooooo.',
        'oWkWWWWWo',
        'oWeWWWeWo',
        'oWWWkkWWo',
        'oWPPPPPWo',
        '.oWnWnWo.',
        '..ooooo..',
    ],
    palette: { o: '#5a5a5a', W: '#fbfbfb', k: '#2a2a2a', e: '#2a2a2a', P: '#f3aec1', n: '#cf6f8c' },
}

// 사자 — 갈기 + 노란 얼굴.
const LION: PetDef = {
    id: 'lion',
    name: '사자',
    pixels: [
        '.mmmmmmm.',
        'mmmmmmmmm',
        'mmLLLLLmm',
        'mLLeLeLLm',
        'mLLLnLLLm',
        'mLLwwwLLm',
        'mmLLLLLmm',
        'mmmmmmmmm',
        '.mmmmmmm.',
    ],
    palette: { m: '#b5732a', L: '#f0c060', e: '#2a2a2a', n: '#7a4a24', w: '#fff0d0' },
}

// 호랑이 — 주황 + 검은 줄.
const TIGER: PetDef = {
    id: 'tiger',
    name: '호랑이',
    pixels: [
        '.oo...oo.',
        '.oTo.oTo.',
        '.ooooooo.',
        'oTkTTTkTo',
        'oTeTkTeTo',
        'oTTTnTTTo',
        'oTkwwwkTo',
        '.oTTTTTo.',
        '..ooooo..',
    ],
    palette: { o: '#b5662a', T: '#f29a44', k: '#3a2414', e: '#2a2a2a', n: '#7a4a24', w: '#fff0d0' },
}

// 원숭이 — 갈색 + 베이지 얼굴.
const MONKEY: PetDef = {
    id: 'monkey',
    name: '원숭이',
    pixels: [
        'oo.....oo',
        'oMo...oMo',
        '.ooooooo.',
        'oMFFFFFMo',
        'oFeFFFeFo',
        'oFFFnFFFo',
        'oFFmmmFFo',
        '.oMFFFMo.',
        '..ooooo..',
    ],
    palette: { o: '#5a3a1e', M: '#8a5a30', F: '#e0b888', e: '#2a2a2a', n: '#5a3a1e', m: '#9a6a3a' },
}

// 코끼리 — 회색 + 코.
const ELEPHANT: PetDef = {
    id: 'elephant',
    name: '코끼리',
    pixels: [
        'EE.....EE',
        'EEoooo.EE',
        'EoGGGGGoE',
        'oGeGGGeGo',
        'oGGGGGGGo',
        'oGGtGGGGo',
        '.oGtGGGo.',
        '..otooo..',
        '...t.....',
    ],
    palette: { o: '#7a7e88', G: '#b3b8c2', E: '#9aa0aa', e: '#2a2a2a', t: '#8a8f99' },
}

// 생쥐 — 회색 + 큰 귀.
const MOUSE: PetDef = {
    id: 'mouse',
    name: '생쥐',
    pixels: [
        'MM.....MM',
        'MmM...MmM',
        'MMMoooMMM',
        '.oGGGGGo.',
        '.oeGGGeo.',
        '.oGGnGGo.',
        '.oGwwwGo.',
        '..oGGGo..',
        '...ooo...',
    ],
    palette: { M: '#9aa0aa', m: '#f3c0cc', o: '#6a6f78', G: '#c2c7d0', e: '#2a2a2a', n: '#cf6f8c', w: '#eef0f4' },
}

// 다람쥐 — 주황 + 큰 꼬리.
const SQUIRREL: PetDef = {
    id: 'squirrel',
    name: '다람이',
    pixels: [
        '.oo......',
        'oSSo.....',
        'oSeSo.TT.',
        'oSSSSoTtT',
        'oSnSSoTtT',
        '.oSSSoTtT',
        '..oSSoTtT',
        '...ooTttT',
        '.....TTT.',
    ],
    palette: { o: '#a0581a', S: '#d68a44', e: '#2a2a2a', n: '#7a4424', T: '#b5702a', t: '#e6a860' },
}

// 너구리 — 회색 + 눈가 마스크.
const RACCOON: PetDef = {
    id: 'raccoon',
    name: '너구리',
    pixels: [
        '.oo...oo.',
        '.oRo.oRo.',
        '.ooooooo.',
        'oRRRRRRRo',
        'okkRkRkko',
        'okeRkReko',
        'oRRRnRRRo',
        '.oRwwwRo.',
        '..ooooo..',
    ],
    palette: { o: '#4a4e58', R: '#9aa0aa', k: '#2a2a2a', e: '#fbfbfb', n: '#2a2a2a', w: '#e6e8ec' },
}

// 사슴 — 갈색 + 뿔.
const DEER: PetDef = {
    id: 'deer',
    name: '사슴',
    pixels: [
        'h.h...h.h',
        'hhh...hhh',
        '.ooooooo.',
        'oDDDDDDDo',
        'oDeDDDeDo',
        'oDDDwDDDo',
        'oDwwnwwDo',
        '.oDDDDDo.',
        '..ooooo..',
    ],
    palette: { o: '#7a4e28', D: '#c89060', e: '#2a2a2a', w: '#f0dcc0', n: '#3a2410', h: '#9a6a3a' },
}

// 물범 — 회색 + 통통.
const SEAL: PetDef = {
    id: 'seal',
    name: '물범',
    pixels: [
        '..ooooo..',
        '.oSSSSSo.',
        'oSeSSSeSo',
        'oSSSnSSSo',
        'oSSwwwSSo',
        'oSSSSSSSo',
        'oSSSSSSSo',
        '.oSSSSSo.',
        '.o.....o.',
    ],
    palette: { o: '#7e8894', S: '#bcc4d0', e: '#2a2a2a', n: '#5a5f68', w: '#eef0f4' },
}

// 수달 — 갈색 + 밝은 얼굴.
const OTTER: PetDef = {
    id: 'otter',
    name: '수달',
    pixels: [
        '.oo...oo.',
        '.ooo.ooo.',
        '.ooooooo.',
        'oOOFFFOOo',
        'oOeFFFeOo',
        'oOFFnFFOo',
        'oOFwwwFOo',
        '.oOFFFOo.',
        '..ooooo..',
    ],
    palette: { o: '#5a3e26', O: '#8a6038', F: '#d8b888', e: '#2a2a2a', n: '#3a2410', w: '#f0e0c8' },
}

// 버섯 — 빨간 갓 + 흰 점.
const MUSHROOM: PetDef = {
    id: 'mushroom',
    name: '버섯이',
    pixels: [
        '..MMMMM..',
        '.MMwMMwM.',
        'MMMMMMMMM',
        'MwMMMMMwM',
        '.MMMMMMM.',
        '..FFFFF..',
        '..FeFeF..',
        '..FFFFF..',
        '..FFFFF..',
    ],
    palette: { M: '#e2453a', w: '#fbf3e0', F: '#f0e2c4', e: '#2a2a2a' },
}

// 선인장 — 초록 + 팔 + 꽃.
const CACTUS: PetDef = {
    id: 'cactus',
    name: '선인장',
    pixels: [
        '....p....',
        'C...C....',
        'C.CCC..C.',
        'CCCCC.CC.',
        '.CCCCCCC.',
        '.CCeCeCC.',
        '.CCCCCCC.',
        '.CCCCCCC.',
        '.CCCCCCC.',
    ],
    palette: { C: '#3f9a55', e: '#214a2a', p: '#f3a6c2' },
}

// 구름 — 흰 뭉게 + 볼터치.
const CLOUD: PetDef = {
    id: 'cloud',
    name: '구름이',
    pixels: [
        '.........',
        '..ooooo..',
        '.oWWWWWo.',
        'oWWWWWWWo',
        'oWeWWWeWo',
        'oWCWWWCWo',
        'oWWWWWWWo',
        '.ooooooo.',
        '.........',
    ],
    palette: { o: '#9ec8ec', W: '#fbfdff', e: '#2a2a2a', C: '#f7c0cc' },
}

// 달님 — 노란 초승달.
const MOON: PetDef = {
    id: 'moon',
    name: '달님',
    pixels: [
        '..MMMM...',
        '.MMMMM...',
        'MMM......',
        'MMe......',
        'MMM..n...',
        'MMMc.....',
        'MMM......',
        '.MMMMM...',
        '..MMMM...',
    ],
    palette: { M: '#f6d860', e: '#2a2a2a', c: '#f0a060', n: '#fff3c0' },
}

// 해님 — 노란 + 광선.
const SUN: PetDef = {
    id: 'sun',
    name: '해님',
    pixels: [
        'r..r.r..r',
        '.rSSSSSr.',
        '.SSSSSSS.',
        'rSeSSSeSr',
        '.SSSnSSS.',
        'rSSmmmSSr',
        '.SSSSSSS.',
        '.rSSSSSr.',
        'r..r.r..r',
    ],
    palette: { S: '#f7d24a', r: '#f0a02e', e: '#2a2a2a', n: '#e0902e', m: '#f0a060' },
}

// 하트 — 분홍.
const HEART: PetDef = {
    id: 'heart',
    name: '하트',
    pixels: [
        '.HH.HH...',
        'HHHHHHH..',
        'HHwHHHwH.',
        'HHHHHHHH.',
        'HHHeHeHH.',
        '.HHHHHHH.',
        '..HHHHH..',
        '...HHH...',
        '....H....',
    ],
    palette: { H: '#f06a92', w: '#ffd0e0', e: '#9a2a4a' },
}

// 눈사람 — 흰 + 모자.
const SNOWMAN: PetDef = {
    id: 'snowman',
    name: '눈사람',
    pixels: [
        '..kkkkk..',
        '..kkkkk..',
        '.ooooooo.',
        'oWeWWWeWo',
        'oWWWcWWWo',
        '.ooooooo.',
        'oWbWWWbWo',
        'oWWWbWWWo',
        '.ooooooo.',
    ],
    palette: { W: '#fbfdff', k: '#3a3a3a', e: '#2a2a2a', c: '#f0922e', o: '#bcd0e4', b: '#3a3a3a' },
}

// 로봇 — 회색 + 안테나.
const ROBOT: PetDef = {
    id: 'robot',
    name: '로봇',
    pixels: [
        '....a....',
        '...ooo...',
        '.ooooooo.',
        'oRReReRRo',
        'oRRRRRRRo',
        'oRGGGGGRo',
        'oRRRRRRRo',
        '.ooooooo.',
        '..o...o..',
    ],
    palette: { o: '#5a6470', R: '#9aa4b0', e: '#5ad0e8', a: '#f0922e', G: '#3a4450' },
}

// 외계인 — 초록 + 큰 검은 눈 + 더듬이.
const ALIEN: PetDef = {
    id: 'alien',
    name: '외계인',
    pixels: [
        'a.......a',
        '.o.....o.',
        '.ooooooo.',
        'oAAAAAAAo',
        'oAkkAkkAo',
        'oAkkAkkAo',
        'oAAAAAAAo',
        '.oAAmAAo.',
        '..ooooo..',
    ],
    palette: { o: '#3a8a4a', A: '#8fe06a', k: '#2a2a2a', m: '#2a5a2a', a: '#f6cf45' },
}

export const PET_CATALOG: PetDef[] = [
    CHICK,
    SLIME,
    STAR,
    CAT,
    RABBIT,
    PENGUIN,
    BEAR,
    DOG,
    FOX,
    FROG,
    PIG,
    PANDA,
    KOALA,
    HAMSTER,
    DUCK,
    OWL,
    HEDGEHOG,
    TURTLE,
    FISH,
    OCTOPUS,
    WHALE,
    CRAB,
    SNAIL,
    BEE,
    LADYBUG,
    GHOST,
    DRAGON,
    DINO,
    UNICORN,
    SHEEP,
    COW,
    LION,
    TIGER,
    MONKEY,
    ELEPHANT,
    MOUSE,
    SQUIRREL,
    RACCOON,
    DEER,
    SEAL,
    OTTER,
    MUSHROOM,
    CACTUS,
    CLOUD,
    MOON,
    SUN,
    HEART,
    SNOWMAN,
    ROBOT,
    ALIEN,
]

export const findPet = (petId: string): PetDef | undefined =>
    PET_CATALOG.find((pet) => pet.id === petId)
