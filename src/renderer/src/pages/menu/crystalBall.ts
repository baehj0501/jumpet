// 수정 구슬 픽셀아트를 phase에 따라 생성한다.
// 유리돔 그라데이션(핑크↔하늘)을 사인파(물결) 경계로 만들고, phase를 올리면 물결이 흐른다.
// 받침/반짝이는 정적. PixelArt에 그대로 넘긴다.

const W = 32
const H = 34
const CX = 15.5
const CY = 14
const R = 13

// 테마 색을 따라가는 램프(PixelArt가 style fill로 칠해 var()/color-mix가 해석됨).
// 구슬 그라데이션 1→5는 옅은 톤 → accent2, 받침은 accent 톤. 하이라이트(L/w)만 흰색 유지.
export const CRYSTAL_PALETTE: Record<string, string> = {
    o: 'color-mix(in srgb, var(--accent) 60%, #000)',
    '1': 'color-mix(in srgb, var(--accent2) 30%, #fff)',
    '2': 'color-mix(in srgb, var(--accent2) 18%, #fff)',
    '3': 'color-mix(in srgb, var(--accent2) 8%, #fff)',
    '4': 'color-mix(in srgb, var(--accent2) 42%, #fff)',
    '5': 'var(--accent2)',
    L: '#ffffff',
    w: '#ffffff',
    s: 'color-mix(in srgb, var(--accent2) 35%, #fff)',
    b: 'var(--accent2)',
    R: 'color-mix(in srgb, var(--accent) 70%, #000)',
    O: 'var(--accent)',
    Y: 'var(--accent2)',
}

const GRADIENT = ['1', '2', '3', '4', '5']

export const buildCrystal = (phase: number): string[] => {
    const grid: string[][] = Array.from({ length: H }, () => Array<string>(W).fill('.'))
    const setIf = (x: number, y: number, c: string) => {
        if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = c
    }

    // 유리돔 + 물결 그라데이션
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const dist = Math.hypot(x - CX, y - CY)
            if (dist <= R - 0.6) {
                // 가로 그라데이션의 경계를 y에 따른 사인파로 흔들고, phase로 흐르게 한다.
                const axis = x - CX + 4.5 * Math.sin(y * 0.55 + phase)
                const t = axis / (2 * R)
                const band = t < -0.26 ? 0 : t < -0.08 ? 1 : t < 0.1 ? 2 : t < 0.28 ? 3 : 4
                grid[y][x] = GRADIENT[band]
            } else if (dist <= R + 0.5) {
                grid[y][x] = 'o'
            }
        }
    }

    // 좌상단 하이라이트 블롭(정적)
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (GRADIENT.includes(grid[y][x]) && Math.hypot(x - 11, y - 10) <= 2.6) {
                grid[y][x] = 'L'
            }
        }
    }

    // 안쪽 반짝이(+모양)
    const spark = (x0: number, y0: number) => {
        for (const [dx, dy] of [
            [0, 0],
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ]) {
            const x = x0 + dx
            const y = y0 + dy
            if (x >= 0 && x < W && y >= 0 && y < H && 'L12345'.includes(grid[y][x])) {
                grid[y][x] = 'w'
            }
        }
    }
    spark(10, 11)
    spark(19, 17)
    spark(21, 9)

    // 받침(파란 계단)
    const bar = (y: number, x0: number, x1: number, c: string) => {
        for (let x = x0; x <= x1; x++) setIf(x, y, c)
    }
    bar(27, 10, 21, 'R')
    bar(28, 9, 22, 'O')
    for (let x = 17; x <= 22; x++) setIf(x, 28, 'Y')
    bar(29, 8, 23, 'O')
    for (let x = 15; x <= 23; x++) setIf(x, 29, 'Y')
    bar(30, 9, 22, 'R')
    for (let x = 16; x <= 22; x++) setIf(x, 30, 'Y')

    // 구슬 밖 반짝이는 FortuneTab의 애니메이션 오버레이로 분리(형태 변화 + 넓은 확산).

    // 위/아래 빈 줄 trim
    const rows = grid.map((row) => row.join(''))
    while (rows.length && !rows[rows.length - 1].includes('1') && /^\.*$/.test(rows[rows.length - 1])) {
        rows.pop()
    }
    while (rows.length && /^\.*$/.test(rows[0])) {
        rows.shift()
    }
    return rows
}
