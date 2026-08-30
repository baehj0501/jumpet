import { type CSSProperties, useEffect, useRef, useState } from 'react'
import {
    CHARACTER_CLICK_FRAMES,
    CHARACTER_WALK_FRAMES,
    CHARACTER_EXPRESSIONS,
    CHARACTER_DISPLAY_NAMES,
    CharacterView,
    SpeechBubble,
    pickRandomClickMessage,
    pickTimeGreeting,
    useCharacterSpeech,
    useHasChosenCharacter,
    useSelectedCharacterId,
    useStateMachine,
    useWalking,
    withSubjectParticle,
    withVocativeParticle,
} from '@renderer/entities/character'
import type { Mood } from '@renderer/entities/character'
import { getProfileSnapshot, useProfile } from '@renderer/entities/profile'
import { PetSprite, useSelectedPetId } from '@renderer/entities/pet'
import { PET_SCALE_MAX, usePetScale } from '@renderer/entities/settings'
import { useWindowDrag } from '@renderer/features/drag'
import { useContextMenu } from '@renderer/features/context-menu'
import { CharacterPicker } from './CharacterPicker'

// 클릭 시 happy 표정을 유지하는 시간(ms). 이 뒤 default로 복귀. (표정 이미지 있는 캐릭터만 시각적 변화)
const HAPPY_MOOD_HOLD_MS = 2500

// 캐릭터 윈도우 기본 한 변 길이(px). petScale 1.0 기준. main createWindow와 일치해야 한다.
const BASE_WINDOW_SIZE = 300

// 동반 펫 위치·크기 기준값. 캐릭터 크기 90%(=PET_IDEAL_SCALE)에서 캐릭터:펫 비율이 가장 좋다고 확정.
// 창이 petScale로 스케일되면 캐릭터도 함께 커지므로, 펫도 같은 비율로 키워 비율을 유지한다.
const PET_IDEAL_SCALE = 0.9
const PET_RIGHT_AT_IDEAL = 40 // px (창 우측에서)
const PET_BOTTOM_AT_IDEAL = 30 // px (창 하단에서)
const PET_CELL_AT_IDEAL = 5 // PetSprite 픽셀 1칸 크기

// 좌클릭 멘트 확률 — '내 이름 호명'과 '캐릭터 이름 태그'를 동일하게 둔다.
const NAME_CALL_CHANCE = 0.1
// 좌클릭 시 행운 포인트(1~5pt 랜덤) 증정 확률 — 0.02%.
const CLICK_REWARD_CHANCE = 0.0002
// 좌클릭 멘트 중 시간대 인사(아침/낮/저녁/밤)가 나올 확률.
const GREETING_CHANCE = 0.25
// 자율 보행 — 가만히 있을 때 일정 주기마다 일정 확률로 스스로 걸어다닌다.
// (걷기 프레임이 있는 캐릭터만 — startWalk가 프레임 없으면 무시한다.)
const AUTO_WALK_TICK_MS = 4000
const AUTO_WALK_CHANCE = 0.4
// 자율 보행 조건 — 창이 화면 최상단에서 이 px 이내일 때만 걷는다.
const AUTO_WALK_TOP_THRESHOLD_PX = 50
// 생일 당일 보너스 포인트(연 1회).
const BIRTHDAY_BONUS = 50


// "N월 N일" 또는 "M-D"/"M.D" 형식에서 월·일을 파싱.
const parseBirthday = (raw: string): { month: number; day: number } | null => {
    const korean = raw.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/)
    if (korean) {
        return { month: Number(korean[1]), day: Number(korean[2]) }
    }
    const numeric = raw.match(/(\d{1,2})\s*[-/.]\s*(\d{1,2})/)
    if (numeric) {
        return { month: Number(numeric[1]), day: Number(numeric[2]) }
    }
    return null
}
const isBirthdayToday = (raw: string): boolean => {
    const parsed = parseBirthday(raw)
    if (!parsed) {
        return false
    }
    const now = new Date()
    return now.getMonth() + 1 === parsed.month && now.getDate() === parsed.day
}

export const App = () => {
    // 사용자 인터랙션(드래그, 메뉴 열림) 동안 자율 이동(walking)을 멈추기 위한 공유 신호.
    // features 계층(드래그, 컨텍스트 메뉴)이 write하고 entities 계층(behaviors)이 read한다.
    // 드래그와 메뉴는 시간상 거의 겹치지 않으므로 단일 ref OR set으로 충분하다.
    const isInteractingRef = useRef(false)
    // 표정(mood) — 기본 default, 클릭 시 잠깐 happy로. 표정 이미지가 있는 캐릭터만 시각적으로 바뀐다.
    const [mood, setMood] = useState<Mood>('default')
    const moodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // 캐릭터의 상태 머신을 초기화하고 현재 상태를 가져온다.
    const [characterState, { interrupt: interruptAutonomousState }] = useStateMachine(isInteractingRef)

    // 캐릭터의 현재 상태에 따라 걷기 애니메이션을 적용한다.
    useWalking(characterState, isInteractingRef)

    // 홈 탭에서 선택한 캐릭터(SSOT) — 바뀌면 펫도 즉시 교체된다.
    const selectedCharacterId = useSelectedCharacterId()
    // 첫 실행 온보딩 — 아직 캐릭터를 고르지 않았으면 창 위에 선택 오버레이를 띄운다.
    const hasChosenCharacter = useHasChosenCharacter()

    // 말풍선 상태 — 다른 창(메뉴 돌봄 등)의 멘트 구독 + 같은 창(좌클릭) 멘트는 showSpeech로 즉시 표시.
    const { speech, showSpeech, dismissSpeech } = useCharacterSpeech()

    // 클릭 반응 애니메이션 — 클릭하면 캐릭터의 모션 중 하나를 랜덤으로 골라 1회 재생 후 기본 포즈로 복귀.
    // 모션이 없는 캐릭터는 애니 없음. clickFrameIndex가 null이면 재생 중 아님.
    const [clickFrameIndex, setClickFrameIndex] = useState<number | null>(null)
    const activeMotionRef = useRef<string[] | null>(null)
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    // 프레임당 200ms, 마지막 프레임만 4초 유지 후 기본 포즈로 복귀.
    const FRAME_MS = 200
    const LAST_FRAME_HOLD_MS = 3000

    // 클릭 시 'walking'이 당첨됐을 때만 좌/우로 한 번 걸어가는 모션.
    // walkDirection이 null이면 걷는 중 아님. 상시 자율 이동은 별개로 비활성(WALK_START_PROBABILITY=0).
    const WALK_FRAME_MS = 200 // 걷기 프레임 교체 주기
    const WALK_DURATION_MS = 1600 // 한 번 걸어가는 시간
    const WALK_MOVE_SPEED = 80 // 걷기 이동 속도(px/초)
    const [walkDirection, setWalkDirection] = useState<'left' | 'right' | null>(null)
    const [walkFrameSrc, setWalkFrameSrc] = useState<string | undefined>(undefined)
    // 마우스 hover 시 보여줄 랜덤 표정 포즈(없으면 undefined → 기본 포즈).
    const [expressionSrc, setExpressionSrc] = useState<string | undefined>(undefined)
    // 진행 중인 인플레이스 클릭 애니를 멈춘다(걷기로 전환할 때 공용).
    const stopInPlaceAnimation = () => {
        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current)
            clickTimerRef.current = null
        }
        activeMotionRef.current = null
        setClickFrameIndex(null)
    }
    const startWalk = () => {
        const frames = CHARACTER_WALK_FRAMES[selectedCharacterId]
        if (!frames || frames.length === 0) {
            return
        }
        stopInPlaceAnimation()
        // 좌/우 랜덤. 화면 경계 클램프는 이동 effect에서 처리한다.
        setWalkDirection(Math.random() < 0.5 ? 'left' : 'right')
    }

    const playClickAnimation = (preferredName?: string) => {
        const motions = CHARACTER_CLICK_FRAMES[selectedCharacterId]
        if (!motions || motions.length === 0) {
            return
        }
        // 특정 모션 지정(예: 생일 'cheer') 시 그걸, 아니면 랜덤.
        const motion = preferredName
            ? motions.find((candidate) => candidate.name === preferredName)
            : motions[Math.floor(Math.random() * motions.length)]
        if (!motion) {
            return
        }
        // 'walking'이 당첨되면 좌/우로 실제 걸어가는 모션으로 분기.
        if (motion.name === 'walking') {
            startWalk()
            return
        }
        const frames = motion.frames
        if (!frames || frames.length === 0) {
            return
        }
        // 걷는 중이었다면 멈추고 인플레이스 모션을 재생.
        setWalkDirection(null)
        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current)
        }
        activeMotionRef.current = frames
        let frame = 0
        setClickFrameIndex(0)
        // 현재 프레임을 보여준 뒤 다음을 예약. 마지막 프레임은 길게 유지하고 끝나면 복귀.
        const scheduleNext = () => {
            const isLastFrame = frame >= frames.length - 1
            clickTimerRef.current = setTimeout(
                () => {
                    if (isLastFrame) {
                        clickTimerRef.current = null
                        activeMotionRef.current = null
                        setClickFrameIndex(null)
                    } else {
                        frame += 1
                        setClickFrameIndex(frame)
                        scheduleNext()
                    }
                },
                isLastFrame ? LAST_FRAME_HOLD_MS : FRAME_MS,
            )
        }
        scheduleNext()
    }
    // 언마운트 시 진행 중인 타이머 정리.
    useEffect(
        () => () => {
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current)
            }
        },
        [],
    )

    // 클릭 시 잠깐 happy 표정으로 바꿨다 복귀. (happy 이미지가 있는 캐릭터만 실제로 표정이 바뀐다)
    const flashHappyMood = () => {
        setMood('happy')
        if (moodTimerRef.current !== null) {
            clearTimeout(moodTimerRef.current)
        }
        moodTimerRef.current = setTimeout(() => {
            setMood('default')
            moodTimerRef.current = null
        }, HAPPY_MOOD_HOLD_MS)
    }

    // useWindowDrag는 자율 행동 정책을 모른다 — 호출자가 콜백에서 ref를 토글하고 자율 상태도 멈춘다.
    const { handleMouseDown } = useWindowDrag({
        onDragStart: () => {
            isInteractingRef.current = true
            interruptAutonomousState()
        },
        onDragEnd: () => {
            isInteractingRef.current = false
        },
        // 드래그가 아닌 단순 좌클릭 → 랜덤 멘트를 머리 위 말풍선으로. 클릭 시점의 최신 프로필(SSOT)을 읽는다.
        // - NAME_CALL_CHANCE(10%) 확률 제일 윗줄 "(내 이름)아/야" 호명.
        // - 같은 NAME_CALL_CHANCE(10%) 확률 우측 정렬 태그 "(캐릭터 이름)이/가"(선택된 캐릭터의 고정 종류명).
        // - 아주 드물게(CLICK_REWARD_CHANCE) 1~5pt 행운 포인트 증정.
        onClick: () => {
            // 클릭하면 잠깐 happy 표정으로.
            flashHappyMood()
            const profile = getProfileSnapshot()
            const characterName = CHARACTER_DISPLAY_NAMES[selectedCharacterId] ?? selectedCharacterId
            // 행운 포인트 — 0.02% 확률로 1~5pt 랜덤 지급(다른 멘트 대신 축하 말풍선).
            if (Math.random() < CLICK_REWARD_CHANCE) {
                const points = 1 + Math.floor(Math.random() * 5)
                void window.api.player.apply({ type: 'manual', delta: points })
                showSpeech(`행운! +${points}pt 🎉`)
                playClickAnimation()
                return
            }
            // 일정 확률로 시간대 인사, 아니면 일반 랜덤 멘트.
            let message =
                Math.random() < GREETING_CHANCE ? pickTimeGreeting() : pickRandomClickMessage()
            if (Math.random() < NAME_CALL_CHANCE) {
                message = `${withVocativeParticle(profile.petName)}\n${message}`
            }
            const tag =
                Math.random() < NAME_CALL_CHANCE ? withSubjectParticle(characterName) : undefined
            showSpeech(message, { tag })
            // 클릭 반응 모션 재생(프레임 있는 캐릭터만).
            playClickAnimation()
        },
    })
    const { handleContextMenu } = useContextMenu({ isInteractingRef })

    // 장착된 동반 펫(SSOT). 없으면 ''.
    const petId = useSelectedPetId()

    // walkDirection이 정해지면: walking 프레임의 '마지막 두 프레임'을 번갈아 보여주며
    // 창을 해당 방향으로 이동한다. WALK_DURATION_MS 후 종료(idle 복귀).
    // walking 에셋이 없는 캐릭터는 폴백(아무 일도 안 함).
    useEffect(() => {
        if (!walkDirection) {
            setWalkFrameSrc(undefined)
            return
        }
        const frames = CHARACTER_WALK_FRAMES[selectedCharacterId]
        if (!frames || frames.length === 0) {
            setWalkDirection(null)
            return
        }

        // 걷기 순환 프레임. 기본은 마지막 두 프레임만 번갈아 반복.
        // 윙피는 3프레임 전체를 순환한다(1번 포즈도 걷기에 포함되도록).
        const loop = selectedCharacterId === 'wingpee' ? frames : frames.slice(-2)
        let frameIndex = 0
        setWalkFrameSrc(loop[0])
        const frameTimer = setInterval(() => {
            frameIndex = (frameIndex + 1) % loop.length
            setWalkFrameSrc(loop[frameIndex])
        }, WALK_FRAME_MS)

        // 창을 좌/우로 이동(작업 영역 경계에서 멈춤). 일정 시간 후 종료.
        let cancelled = false
        let animationFrameId: number | null = null
        void (async () => {
            const [bounds, workArea] = await Promise.all([
                window.api.getWindowBounds(),
                window.api.getDisplayWorkArea(),
            ])
            if (cancelled || !bounds) {
                return
            }
            const sign = walkDirection === 'left' ? -1 : 1
            const minX = workArea.x
            const maxX = workArea.x + workArea.width - bounds.width
            const positionY = bounds.y
            let positionX = bounds.x
            const startTime = performance.now()
            let lastTime = startTime
            const tick = (now: number) => {
                if (cancelled) {
                    return
                }
                // 드래그/메뉴 등 인터랙션 중엔 이동을 멈춘다(시간만 갱신해 종료 시점 점프 방지).
                if (isInteractingRef.current) {
                    lastTime = now
                    animationFrameId = requestAnimationFrame(tick)
                    return
                }
                const deltaSec = (now - lastTime) / 1000
                lastTime = now
                positionX += sign * WALK_MOVE_SPEED * deltaSec
                positionX = Math.min(Math.max(positionX, minX), maxX)
                window.api.moveWindowTo(positionX, positionY)
                if (now - startTime >= WALK_DURATION_MS) {
                    setWalkDirection(null)
                    return
                }
                animationFrameId = requestAnimationFrame(tick)
            }
            animationFrameId = requestAnimationFrame(tick)
        })()

        return () => {
            cancelled = true
            clearInterval(frameTimer)
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [walkDirection, selectedCharacterId])

    // 자율 보행 — 일정 주기마다 가만히 있으면 가끔 스스로 걷는다.
    // (걷기/클릭 애니 중·드래그 중이면 건너뜀. startWalk는 걷기 프레임 없는 캐릭터를 무시.)
    const startWalkRef = useRef(startWalk)
    startWalkRef.current = startWalk
    const isBusyRef = useRef(false)
    isBusyRef.current = walkDirection !== null || clickFrameIndex !== null
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (isInteractingRef.current || isBusyRef.current) {
                return
            }
            if (Math.random() >= AUTO_WALK_CHANCE) {
                return
            }
            // 화면 최상단 근처에 있을 때만 걷는다.
            void (async () => {
                const [bounds, workArea] = await Promise.all([
                    window.api.getWindowBounds(),
                    window.api.getDisplayWorkArea(),
                ])
                if (!bounds || isInteractingRef.current || isBusyRef.current) {
                    return
                }
                if (bounds.y <= workArea.y + AUTO_WALK_TOP_THRESHOLD_PX) {
                    startWalkRef.current()
                }
            })()
        }, AUTO_WALK_TICK_MS)
        return () => clearInterval(intervalId)
    }, [])

    // 마우스가 캐릭터 위에 올라오면 랜덤 표정을 한 장 보여준다(hover 동안 그대로 유지).
    // (표정 세트가 있는 캐릭터만 시각 변화.)
    const startHoverExpression = () => {
        const list = CHARACTER_EXPRESSIONS[selectedCharacterId]
        if (!list || list.length === 0) {
            return
        }
        setExpressionSrc(list[Math.floor(Math.random() * list.length)])
    }
    // 마우스가 캐릭터에서 벗어나면 기본 포즈로 복귀.
    const stopHoverExpression = () => {
        setExpressionSrc(undefined)
    }

    // 캐릭터를 바꾸면 이전 캐릭터의 임시 프레임(표정/클릭/걷기/낙하)을 즉시 정리한다.
    // (안 하면 전환 직후 짧게 이전 캐릭터의 표정·모션 프레임이 남아 깜빡인다.)
    useEffect(() => {
        if (moodTimerRef.current !== null) {
            clearTimeout(moodTimerRef.current)
            moodTimerRef.current = null
        }
        setMood('default')
        setExpressionSrc(undefined)
        stopInPlaceAnimation()
        setWalkDirection(null)
    }, [selectedCharacterId])

    // 클릭 애니 중이면 그 프레임, 걷는 중이면 걷기 프레임, 가만히 있으면 랜덤 표정, 아니면 mood 기본 이미지.
    const clickOverrideSrc =
        clickFrameIndex !== null ? activeMotionRef.current?.[clickFrameIndex] : undefined
    // 우선순위: 클릭 애니 > 걷기 > (가만히 있을 때) 랜덤 표정 > 기본 mood.
    const overrideSrc = clickOverrideSrc ?? walkFrameSrc ?? expressionSrc
    // 클릭/걷기 '모션' 프레임 여부(표정은 idle 기준 정규화라 모션 배율에서 제외).
    const isMotionFrame = Boolean(clickOverrideSrc ?? walkFrameSrc)

    // 캐릭터 크기(SSOT) — 설정 탭에서 바꾸면 캐릭터 윈도우 자체를 키워 제자리에서 커진다.
    // 이미지가 objectFit:contain으로 창을 채우므로 창 크기가 곧 캐릭터 크기.
    const petScale = usePetScale()
    // 펫 비율 유지용 배율 — petScale 0.9(이상적 비율)에서 1.0이 되도록 정규화.
    const petK = petScale / PET_IDEAL_SCALE
    // 말풍선 배율 — 캐릭터가 작을수록(고정 px라 상대적으로 커짐) 같이 줄여서 겹침/잘림을 막는다.
    // 최대 크기(PET_SCALE_MAX)에서 1.0, 최소(PET_SCALE_MIN)에서 비례 축소.
    const bubbleScale = Math.min(1, petScale / PET_SCALE_MAX)
    // 말풍선 크기는 모든 캐릭터 동일. 큰 캐릭터(머리가 창 위쪽)만 '위치'를 바꿔 겹침/잘림을 푼다.
    const effectiveBubbleScale = bubbleScale
    // 큰 캐릭터는 말풍선 아래변(꼬리)을 '머리 바로 위'에 고정하고 위로 자라게 한다.
    // 값 = 창 바닥에서의 %(말풍선 아래변 위치). 머리 위 공간을 최대한 써서 같은 크기 2줄도 안 잘리고
    // 캐릭터도 안 덮는다. 윙피는 CharacterView에서 8% 아래로 내려(머리 ~33.6%) 위 공간을 넓혔으므로,
    // 아래변을 위에서 ~33%(bottom 67%)에 둬 위로 자랄 공간을 창의 33%(≈79px)로 확보 → 3줄도 안 잘림.
    // 큰 캐릭터(윙피)는 창 높이를 폭보다 크게 잡아 머리 위 말풍선(3줄)이 창 밖으로 잘리지 않게 한다.
    // 캐릭터는 아래 정사각 영역에 그대로 그려지고, 늘어난 위쪽은 말풍선 여유 공간으로만 쓴다.
    const WINDOW_HEIGHT_RATIO: Record<string, number> = { wingpee: 1.2 }
    const windowHeightRatio = WINDOW_HEIGHT_RATIO[selectedCharacterId] ?? 1
    // 말풍선 아래변 위치(창 바닥 대비 %). 창이 높아진 만큼 %를 낮춰, 캐릭터 대비 위치는 그대로 유지한다.
    const CHARACTER_BUBBLE_BOTTOM_PCT: Record<string, number> = { wingpee: 74 }
    const rawBubbleBottomPct = CHARACTER_BUBBLE_BOTTOM_PCT[selectedCharacterId]
    const bubbleBottomPct =
        rawBubbleBottomPct === undefined
            ? undefined
            : Math.round(rawBubbleBottomPct / windowHeightRatio)
    useEffect(() => {
        // preload가 아직 setWindowSize를 노출하지 않으면(dev에서 preload 미재시작) 건너뛴다.
        if (!window.api?.setWindowSize) {
            return
        }
        // 온보딩(캐릭터 선택) 중엔 캐릭터 크기 설정(petScale)과 무관하게 고정 크기로 둔다.
        // 설정이 작으면(예: 0.8) 창이 240px로 줄어 선택지 4종 + 프로필 입력이 다 안 보이고
        // 스크롤이 생기므로, 온보딩 오버레이가 온전히 보이는 크기로 키운다.
        if (!hasChosenCharacter) {
            window.api.setWindowSize(300, 440)
            return
        }
        const size = Math.round(BASE_WINDOW_SIZE * petScale)
        window.api.setWindowSize(size, Math.round(size * windowHeightRatio))
    }, [petScale, windowHeightRatio, hasChosenCharacter])

    // 생일 축하 — 생일 당일이면 축하 멘트 + 보너스 포인트(연 1회, localStorage로 중복 방지).
    const profileForBirthday = useProfile()
    useEffect(() => {
        if (!isBirthdayToday(profileForBirthday.birthday)) {
            return
        }
        const year = String(new Date().getFullYear())
        if (localStorage.getItem('loopf.birthdayBonusYear') === year) {
            return
        }
        localStorage.setItem('loopf.birthdayBonusYear', year)
        void window.api.player.apply({ type: 'manual', delta: BIRTHDAY_BONUS })
        showSpeech(`생일 축하해! 🎉 +${BIRTHDAY_BONUS}P`)
        playClickAnimation('cheer')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileForBirthday.birthday])

    if (!hasChosenCharacter) {
        return <CharacterPicker />
    }

    return (
        <>
            <SpeechBubble
                text={speech.text}
                tag={speech.tag}
                scale={effectiveBubbleScale}
                sticky={speech.sticky}
                onClose={dismissSpeech}
                bottomAnchorPct={bubbleBottomPct}
            />
            {/* 캐릭터는 창 하단의 정사각 영역에 그린다(그라운딩 유지). 창이 폭보다 높으면
                늘어난 위쪽은 말풍선 공간으로만 남는다. 정사각일 땐 창 전체와 동일. */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    aspectRatio: '1 / 1',
                }}
            >
                <CharacterView
                    characterId={selectedCharacterId}
                    mood={mood}
                    state={characterState}
                    overrideSrc={overrideSrc}
                    isMotionFrame={isMotionFrame}
                    flip={walkDirection === 'left'}
                    onMouseDown={handleMouseDown}
                    onContextMenu={handleContextMenu}
                    onMouseEnter={startHoverExpression}
                    onMouseLeave={stopHoverExpression}
                />
            </div>
            {petId && (
                <div
                    className='pet-companion'
                    style={
                        {
                            right: `${PET_RIGHT_AT_IDEAL * petK}px`,
                            bottom: `${PET_BOTTOM_AT_IDEAL * petK}px`,
                            // 바운스 거리도 같은 배율로 — keyframes가 이 변수를 읽는다.
                            '--pet-bob': petK,
                        } as CSSProperties
                    }
                >
                    <PetSprite
                        petId={petId}
                        cell={PET_CELL_AT_IDEAL * petK}
                    />
                </div>
            )}
        </>
    )
}
