// 픽셀 아이콘 렌더러. '#' 칸을 1×1 rect로 그린다. currentColor를 따라간다.
// grid(ASCII 행 배열)만 바꾸면 모양을 쉽게 수정할 수 있다.
type PixelIconProps = {
    pixels: string[]
    size?: number
}

export const PixelIcon = ({ pixels, size = 18 }: PixelIconProps) => {
    const cols = pixels[0]?.length ?? 0
    const cells: React.ReactNode[] = []
    pixels.forEach((row, y) => {
        ;[...row].forEach((cell, x) => {
            if (cell === '#') {
                cells.push(
                    <rect
                        key={`${x}-${y}`}
                        x={x}
                        y={y}
                        width={1}
                        height={1}
                    />,
                )
            }
        })
    })
    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${cols} ${pixels.length}`}
            fill='currentColor'
            shapeRendering='crispEdges'
            style={{ display: 'block', imageRendering: 'pixelated' }}
            aria-hidden='true'
        >
            {cells}
        </svg>
    )
}
