import { findPet } from '../model/pets'

// 펫 픽셀 스프라이트 렌더러 — 펫 id로 카탈로그를 찾아 palette 색의 1×1 rect로 그린다.
// entities 레이어에 자체 포함(렌더러 유틸을 pages에서 끌어오지 않게) — App·펫 탭이 공유.
type PetSpriteProps = {
    petId: string
    // 픽셀 1칸의 화면 크기(px).
    cell?: number
}

export const PetSprite = ({ petId, cell = 6 }: PetSpriteProps) => {
    const pet = findPet(petId)
    if (!pet) {
        return null
    }
    const cols = pet.pixels[0]?.length ?? 0
    const rows = pet.pixels.length
    const cells: React.ReactNode[] = []
    pet.pixels.forEach((row, y) => {
        ;[...row].forEach((char, x) => {
            const color = pet.palette[char]
            if (color) {
                cells.push(
                    <rect
                        key={`${x}-${y}`}
                        x={x}
                        y={y}
                        width={1}
                        height={1}
                        fill={color}
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
