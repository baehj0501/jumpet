// 수정 구슬 픽셀아트를 phase에 따라 생성한다.
// 유리돔 그라데이션(핑크↔하늘)을 사인파(물결) 경계로 만들고, phase를 올리면 물결이 흐른다.
// 받침/반짝이는 정적. PixelArt에 그대로 넘긴다.

const W = 32
const H = 34
const CX = 15.5
const CY = 14
const R = 13

export const CRYSTAL_PALETTE: Record<string, string> = {
    o: '#9d8fd6',
    '1': '#f7b0d4',
    '2': '#fcd2e6',
    '3': '#f4ecf8',
    '4': '#cfeaf8',
    '5': '#a6daf2',
    L: '#ffffff',
    w: '#ffffff',
    s: '#f5a8d2',
    b: '#a6d6f2',
    R: '#2f6aa8',
    O: '#5a9fd8',
    Y: '#a6d6f2',
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

    // 구슬 밖 반짝이(핑크/하늘)
    const starBig = (x0: number, y0: number, c: string) => {
        for (const [dx, dy] of [
            [0, -2],
            [0, -1],
            [0, 1],
            [0, 2],
            [-2, 0],
            [-1, 0],
            [1, 0],
            [2, 0],
        ]) {
            setIf(x0 + dx, y0 + dy, c)
        }
    }
    const starSmall = (x0: number, y0: number, c: string) => {
        for (const [dx, dy] of [
            [0, -1],
            [0, 1],
            [-1, 0],
            [1, 0],
        ]) {
            setIf(x0 + dx, y0 + dy, c)
        }
    }
    starBig(28, 4, 's')
    starSmall(3, 9, 'b')
    starSmall(5, 27, 'b')
    starSmall(27, 25, 's')

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
