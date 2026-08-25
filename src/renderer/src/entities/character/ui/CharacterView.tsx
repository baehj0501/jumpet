import type { MouseEvent } from 'react'
import type { CharacterState } from '../model/CharacterState'
import type { CharacterId, Mood } from '../model/Character'
import { CHARACTER_ASSETS } from '../assets'
import { containerStyle, imageStyle } from './CharacterView.styles'

type CharacterViewProps = {
    characterId: CharacterId
    mood: Mood
    // 행동 상태. 시각 표현(이미지)에는 영향을 주지 않지만,
    // CSS에서 data-state로 잡거나 디버깅 시 유용해 그대로 노출.
    state: CharacterState
    // 클릭 반응 등 일시적 프레임을 강제로 보여줄 때. 없으면 mood 기본 이미지.
    overrideSrc?: string
    // overrideSrc가 클릭/걷기 '모션' 프레임이면 true. (표정 프레임은 idle 기준 정규화라 false)
    // 모션은 원본 프레이밍이 달라 별도 배율(CHARACTER_MOTION_SCALE)을 쓰고, 표정/기본은 base 배율을 쓴다.
    isMotionFrame?: boolean
    // 좌측으로 걸을 때 스프라이트를 좌우 반전한다(기본 스프라이트는 우향).
    flip?: boolean
    onMouseDown: (event: MouseEvent) => void
    onContextMenu: (event: MouseEvent) => void
    // 마우스가 캐릭터 위로 올라오거나 벗어날 때(hover 표정용).
    onMouseEnter?: () => void
    onMouseLeave?: () => void
}

// 캐릭터별 표시 배율(기본 idle/mood 이미지 기준) — 원본이 캔버스를 더 크게 차지하는 캐릭터를 줄여 크기를 맞춘다.
// (발끝 기준으로 줄어들게 transform-origin을 아래로 둔다. 값이 작을수록 작게 보임.)
const CHARACTER_DISPLAY_SCALE: Record<CharacterId, number> = {
    piyoo: 0.9,
    suupee: 1,
    qupee: 0.82,
    wingpee: 0.9,
}

// 모션/표정(override 프레임)일 때 쓸 배율 오버라이드 — 모션 원본이 기본 포즈와 프레이밍이 달라
// 기본 배율로는 크기가 안 맞는 캐릭터만 지정한다. 없으면 위 기본 배율(=idle)을 그대로 쓴다.
// piyoo·wingpee는 모션 배율을 idle(base 0.9)과 통일했다 — 모션↔idle 전환 순간 스케일이 바뀌며
// 걷기 종료 등에서 한 프레임 축소돼 보이던 '작아짐'을 없애기 위함. 프레임은 0.9 기준으로 재정규화됨.
const CHARACTER_MOTION_SCALE: Partial<Record<CharacterId, number>> = {}

// 캐릭터별 세로 위치 오프셋(창 높이 대비 %, 양수=아래로). 크기는 그대로 두고 위치만 내린다.
// 창을 많이 채워 머리가 위쪽인 캐릭터(윙피)는 아래로 내려 머리 위 말풍선 공간을 확보한다.
// 모든 프레임(idle/모션)에 동일 적용되어 발 정렬(그라운딩)은 유지된다.
const CHARACTER_VERTICAL_OFFSET: Partial<Record<CharacterId, number>> = {
    wingpee: 8,
}

// 캐릭터의 시각만 담당하는 dumb 컴포넌트.
// 행동/감정 로직은 hooks(behaviors)와 features에 분산되어 있다.
export const CharacterView = ({
    characterId,
    mood,
    state,
    overrideSrc,
    isMotionFrame = false,
    flip = false,
    onMouseDown,
    onContextMenu,
    onMouseEnter,
    onMouseLeave,
}: CharacterViewProps) => {
    const imageSrc = overrideSrc ?? CHARACTER_ASSETS[characterId][mood]
    // 캐릭터별 표시 배율(발끝 기준) + 좌향 걷기 반전을 한 transform으로 합친다.
    // 이 배율은 창 안 스프라이트만 줄이므로, 설정의 크기 슬라이더(창 리사이즈)와 독립적으로 겹친다.
    // 클릭/걷기 '모션' 프레임만 모션 배율을 쓰고, 기본 포즈·표정은 base 배율을 쓴다(표정은 idle 기준 정규화).
    const baseScale = CHARACTER_DISPLAY_SCALE[characterId] ?? 1
    const displayScale = isMotionFrame ? (CHARACTER_MOTION_SCALE[characterId] ?? baseScale) : baseScale
    // translateY(%)는 요소(=창) 높이 기준. scale보다 바깥(먼저 기술)에 둬서 스케일과 무관하게 창 대비로 내린다.
    const verticalOffset = CHARACTER_VERTICAL_OFFSET[characterId] ?? 0
    const transform = `translateY(${verticalOffset}%) scale(${displayScale})${flip ? ' scaleX(-1)' : ''}`

    return (
        <div
            css={containerStyle}
            data-state={state}
            data-mood={mood}
            onMouseDown={onMouseDown}
            onContextMenu={onContextMenu}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <img
                css={imageStyle}
                style={{ transform, transformOrigin: 'center bottom' }}
                src={imageSrc}
                alt={characterId}
                draggable={false}
            />
        </div>
    )
}
