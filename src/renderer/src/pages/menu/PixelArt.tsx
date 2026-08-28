// 다색 픽셀아트 렌더러. 각 글자를 palette 색의 1×1 rect로 그린다.
// '.'(또는 palette에 없는 글자)는 투명. grid·palette만 바꾸면 그림을 수정할 수 있다.
type PixelArtProps = {
    pixels: string[]
    palette: Record<string, string>
    // 픽셀 1칸의 화면 크기(px).
    cell?: number
}

export const PixelArt = ({ pixels, palette, cell = 6 }: PixelArtProps) => {
    const cols = pixels[0]?.length ?? 0
    const rows = pixels.length
    const cells: React.ReactNode[] = []
    pixels.forEach((row, y) => {
        ;[...row].forEach((char, x) => {
            const color = palette[char]
            if (color) {
                cells.push(
                    <rect
                        key={`${x}-${y}`}
                        x={x}
                        y={y}
                        width={1}
                        height={1}
                        // fill 속성 대신 style로 — palette 값이 var(--accent)/color-mix()여도
                        // CSS 변수가 해석되어 테마 색을 따라간다(fill 속성은 var()를 못 푼다).
                        style={{ fill: color }}
                    />,
                )
            }
        })
    })
    return (
        <svg
            width={cols * cell}
            height={rows * cell}
            viewBox={`0 0 ${cols} ${rows}`}
            shapeRendering='crispEdges'
            style={{ display: 'block', imageRendering: 'pixelated' }}
            aria-hidden='true'
        >
            {cells}
        </svg>
    )
}
