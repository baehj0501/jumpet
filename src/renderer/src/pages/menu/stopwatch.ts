// 스톱워치(포모도로 타이머) 픽셀아트를 바늘 각도에 따라 생성한다.
// 수정구슬(crystalBall)·가챠 머신과 같은 형식 — PixelArt에 그리드 + 팔레트로 넘긴다.
// 바늘(handAngleDeg)만 매 초 바뀌고 나머지(링·눈금·크라운·버튼)는 정적.

const W = 36
const H = 44
const CX = 17.5
const CY = 25.0
const R_OUT = 15.0 // 바깥 링 외곽 반지름
const R_RING = 12.2 // 시계 면(face) 반지름

// 테마 색을 따라가는 톤(PixelArt가 style fill로 칠해 var()/color-mix 해석).
export const STOPWATCH_PALETTE: Record<string, string> = {
    o: 'color-mix(in srgb, var(--accent) 75%, #000)', // 링 안쪽 진한 색
    R: 'var(--accent2)', // 링 바깥 밝은 색
    f: 'color-mix(in srgb, var(--accent2) 16%, #fff)', // 시계 면 (아주 옅음)
    t: 'var(--accent)', // 눈금
    h: 'color-mix(in srgb, var(--accent) 75%, #000)', // 바늘
    c: 'color-mix(in srgb, var(--accent) 75%, #000)', // 중심축
    b: 'var(--accent2)', // 상단 크라운 링
    s: 'var(--accent)', // 크라운 연결 스템
    u: 'var(--accent2)', // 양옆 버튼
}

// handAngleDeg가 null이면 바늘·중심축을 그리지 않는다(면 가운데에 숫자를 올리는 용도).
export const buildStopwatch = (handAngleDeg: number | null = null): string[] => {
    const grid: string[][] = Array.from({ length: H }, () => Array<string>(W).fill('.'))
    const setIf = (x: number, y: number, c: string) => {
        const xi = Math.round(x)
        const yi = Math.round(y)
        if (xi >= 0 && xi < W && yi >= 0 && yi < H) grid[yi][xi] = c
    }

    // 양옆 버튼 (링 뒤, ±55°)
    for (const sgn of [-1, 1]) {
        const a = (55 * sgn * Math.PI) / 180
        const bx = CX + (R_OUT + 1.5) * Math.sin(a)
        const by = CY - (R_OUT + 1.5) * Math.cos(a)
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                if (Math.hypot(x - bx, y - by) <= 2.8) grid[y][x] = 'u'
            }
        }
    }

    // 상단 크라운 링 + 스템
    const crownCy = CY - R_OUT - 4.2
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const d = Math.hypot(x - CX, y - crownCy)
            if (d >= 1.7 && d <= 3.4) grid[y][x] = 'b'
            if (Math.abs(x - CX) <= 1.3 && y > crownCy && y < CY - R_OUT + 1.5) grid[y][x] = 's'
        }
    }

    // 시계 몸체 — 면 + 2톤 링
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const d = Math.hypot(x - CX, y - CY)
            if (d <= R_RING - 0.6) grid[y][x] = 'f'
            else if (d <= R_RING + 1.4) grid[y][x] = 'o'
            else if (d <= R_OUT + 0.4) grid[y][x] = 'R'
        }
    }

    // 12개 눈금
    for (let k = 0; k < 12; k++) {
        const a = (k * 30 * Math.PI) / 180
        for (let rr = R_RING - 3; rr <= R_RING - 1; rr += 0.4) {
            const x = CX + rr * Math.sin(a)
            const y = CY - rr * Math.cos(a)
            if (grid[Math.round(y)][Math.round(x)] === 'f') setIf(x, y, 't')
        }
    }

    // 바늘 + 중심축 — handAngleDeg가 주어졌을 때만. (숫자 표기 모드에선 생략)
    if (handAngleDeg !== null) {
        const a = (handAngleDeg * Math.PI) / 180
        for (let rr = 0; rr <= R_RING - 3.5; rr += 0.3) {
            const x = CX + rr * Math.sin(a)
            const y = CY - rr * Math.cos(a)
            setIf(x, y, 'h')
            if (rr < 3) setIf(x + 1, y, 'h')
        }
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                if (Math.hypot(x - CX, y - CY) <= 1.7) grid[y][x] = 'c'
            }
        }
    }

    // 위/아래 빈 줄 trim
    const rows = grid.map((row) => row.join(''))
    while (rows.length && /^\.*$/.test(rows[rows.length - 1])) rows.pop()
    while (rows.length && /^\.*$/.test(rows[0])) rows.shift()
    return rows
}
