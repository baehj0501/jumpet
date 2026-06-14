import type { CharacterId, Mood } from '../model/Character'

// JUMPET_4 원본 PNG(idle 포즈)를 변형 없이 그대로 사용.
import piyooIdle from './piyoo/idle.png'
import qupeeIdle from './qupee/idle.png'
import suupeeIdle from './suupee/idle.png'
import wingpeeIdle from './wingpee/idle.png'
// 홈 씬용 합본(캐릭터 + 잔디 바닥) 이미지.
import piyooHome from './piyoo/home.png'
import qupeeHome from './qupee/home.png'
import suupeeHome from './suupee/home.png'
import wingpeeHome from './wingpee/home.png'
// 에셋 도착 시 mood별 이미지를 추가하고 폴백을 교체:
// import piyooHappy from './piyoo/play.png' 등.

// 캐릭터 × 감정 별 이미지 매핑.
// Record로 강제해 새 CharacterId / Mood 추가 시 매핑 누락이 컴파일 에러로 잡힌다.
// 아직 mood별 에셋이 없는 캐릭터는 idle(default) 한 장으로 폴백한다.
export const CHARACTER_ASSETS: Record<CharacterId, Record<Mood, string>> = {
    piyoo: {
        default: piyooIdle,
        happy: piyooIdle,
        sad: piyooIdle,
    },
    qupee: {
        default: qupeeIdle,
        happy: qupeeIdle,
        sad: qupeeIdle,
    },
    suupee: {
        default: suupeeIdle,
        happy: suupeeIdle,
        sad: suupeeIdle,
    },
    wingpee: {
        default: wingpeeIdle,
        happy: wingpeeIdle,
        sad: wingpeeIdle,
    },
}

// 클릭 반응 모션 — <character>/<motion>/<n>.png 를 자동 수집(import.meta.glob, decorCatalog와 동일 방식).
// `*/*/*` 3단 깊이라 캐릭터 직속 idle.png/home.png(2단)는 제외된다. 캐릭터 클릭 시 모션 하나를 랜덤 재생.
const motionFiles = import.meta.glob('./*/*/*.png', {
    eager: true,
    query: '?url',
    import: 'default',
}) as Record<string, string>

// 경로(./<character>/<motion>/<n>.png)를 캐릭터→모션→프레임으로 묶고, 모션·프레임 순으로 정렬한다.
const buildClickFrames = (
    files: Record<string, string>,
): Partial<Record<CharacterId, string[][]>> => {
    const byCharacter: Record<string, Record<string, { frame: number; url: string }[]>> = {}
    for (const [path, url] of Object.entries(files)) {
        const matched = path.match(/\.\/([^/]+)\/([^/]+)\/(\d+)\.png$/)
        if (!matched) {
            continue
        }
        const character = matched[1]
        const motion = matched[2]
        const frame = Number(matched[3])
        ;((byCharacter[character] ??= {})[motion] ??= []).push({ frame, url })
    }
    const result: Partial<Record<CharacterId, string[][]>> = {}
    for (const character of Object.keys(byCharacter)) {
        const motions = byCharacter[character]
        result[character as CharacterId] = Object.keys(motions)
            .sort()
            .map((motion) =>
                motions[motion].sort((a, b) => a.frame - b.frame).map((f) => f.url),
            )
    }
    return result
}

// 캐릭터별 클릭 모션 목록. 각 원소가 한 모션의 프레임 배열(string[]). 키 없으면 클릭 애니 없음.
export const CHARACTER_CLICK_FRAMES: Partial<Record<CharacterId, string[][]>> =
    buildClickFrames(motionFiles)

// 홈 씬 합본(캐릭터 + 바닥) 이미지. CareTab 홈에서 캐릭터+바닥을 한 장으로 렌더.
export const HOME_SCENE_ASSETS: Record<CharacterId, string> = {
    piyoo: piyooHome,
    qupee: qupeeHome,
    suupee: suupeeHome,
    wingpee: wingpeeHome,
}
