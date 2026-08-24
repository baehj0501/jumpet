import type { CharacterId, Mood } from '../model/Character'

// 캐릭터 루트의 단일 이미지(idle/home/happy/sad 등)를 자동 수집한다.
// <character>/<name>.png 2단 깊이 — 모션(3단 */*/*)과 겹치지 않는다.
// 표정을 추가하려면 <character>/<mood>.png 를 넣으면 자동 인식된다(예: suupee/happy.png).
const rootImageFiles = import.meta.glob('./*/*.png', {
    eager: true,
    query: '?url',
    import: 'default',
}) as Record<string, string>

// character → { 파일명(확장자 제외): url }.
const rootByCharacter: Record<string, Record<string, string>> = {}
for (const [path, url] of Object.entries(rootImageFiles)) {
    const matched = path.match(/\.\/([^/]+)\/([^/]+)\.png$/)
    if (!matched) {
        continue
    }
    ;(rootByCharacter[matched[1]] ??= {})[matched[2]] = url
}

const CHARACTER_IDS: CharacterId[] = ['piyoo', 'qupee', 'suupee', 'wingpee']
// mood → 파일명. default는 idle.png를 쓴다. happy/sad는 같은 이름의 png가 있으면 사용.
const MOOD_FILE: Record<Mood, string> = { default: 'idle', happy: 'happy', sad: 'sad' }

// 캐릭터 × 감정 별 이미지 매핑. mood 이미지가 없으면 idle(default)로 폴백한다.
// 파일을 넣기만 하면(<character>/<mood>.png) 자동으로 반영된다.
export const CHARACTER_ASSETS: Record<CharacterId, Record<Mood, string>> = Object.fromEntries(
    CHARACTER_IDS.map((id) => {
        const files = rootByCharacter[id] ?? {}
        const idle = files['idle']
        const moods: Record<Mood, string> = {
            default: files[MOOD_FILE.default] ?? idle,
            happy: files[MOOD_FILE.happy] ?? idle,
            sad: files[MOOD_FILE.sad] ?? idle,
        }
        return [id, moods]
    }),
) as Record<CharacterId, Record<Mood, string>>

// 클릭 반응 모션 — <character>/<motion>/<n>.png 를 자동 수집(import.meta.glob, decorCatalog와 동일 방식).
// `*/*/*` 3단 깊이라 캐릭터 직속 idle.png/home.png(2단)는 제외된다. 캐릭터 클릭 시 모션 하나를 랜덤 재생.
const motionFiles = import.meta.glob('./*/*/*.png', {
    eager: true,
    query: '?url',
    import: 'default',
}) as Record<string, string>

// 한 클릭 모션 = 모션 이름 + 프레임 URL 배열. 이름으로 'walking' 등 특수 모션을 구분한다.
export type ClickMotion = { name: string; frames: string[] }

// 경로(./<character>/<motion>/<n>.png)를 캐릭터→모션→프레임으로 묶고, 모션·프레임 순으로 정렬한다.
const buildClickFrames = (
    files: Record<string, string>,
): Partial<Record<CharacterId, ClickMotion[]>> => {
    const byCharacter: Record<string, Record<string, { frame: number; url: string }[]>> = {}
    for (const [path, url] of Object.entries(files)) {
        const matched = path.match(/\.\/([^/]+)\/([^/]+)\/(\d+)\.png$/)
        if (!matched) {
            continue
        }
        const character = matched[1]
        const motion = matched[2]
        // 'expressions'는 클릭 애니가 아니라 정적 표정 세트라 클릭 모션에서 제외한다(CHARACTER_EXPRESSIONS로 따로 수집).
        if (motion === 'expressions') {
            continue
        }
        const frame = Number(matched[3])
        ;((byCharacter[character] ??= {})[motion] ??= []).push({ frame, url })
    }
    const result: Partial<Record<CharacterId, ClickMotion[]>> = {}
    for (const character of Object.keys(byCharacter)) {
        const motions = byCharacter[character]
        result[character as CharacterId] = Object.keys(motions)
            .sort()
            .map((motion) => ({
                name: motion,
                frames: motions[motion].sort((a, b) => a.frame - b.frame).map((f) => f.url),
            }))
    }
    return result
}

// 캐릭터별 클릭 모션 목록. 각 원소가 한 모션(name + frames). 키 없으면 클릭 애니 없음.
export const CHARACTER_CLICK_FRAMES: Partial<Record<CharacterId, ClickMotion[]>> =
    buildClickFrames(motionFiles)

// 특정 모션(예: 'walking', 'falldown') 프레임만 캐릭터별로 추출해 프레임 순 정렬한다.
// 같은 glob을 재사용한다. 키 없으면 그 모션 에셋이 없는 캐릭터.
const buildMotionFrames = (
    files: Record<string, string>,
    motion: string,
): Partial<Record<CharacterId, string[]>> => {
    const byCharacter: Record<string, { frame: number; url: string }[]> = {}
    for (const [path, url] of Object.entries(files)) {
        const matched = path.match(/\.\/([^/]+)\/([^/]+)\/(\d+)\.png$/)
        if (!matched || matched[2] !== motion) {
            continue
        }
        ;(byCharacter[matched[1]] ??= []).push({ frame: Number(matched[3]), url })
    }
    const result: Partial<Record<CharacterId, string[]>> = {}
    for (const character of Object.keys(byCharacter)) {
        result[character as CharacterId] = byCharacter[character]
            .sort((a, b) => a.frame - b.frame)
            .map((f) => f.url)
    }
    return result
}

// 캐릭터별 걷기 프레임. 키 없으면 walking 모션 에셋이 없는 캐릭터(정지 폴백).
export const CHARACTER_WALK_FRAMES: Partial<Record<CharacterId, string[]>> =
    buildMotionFrames(motionFiles, 'walking')

// 캐릭터별 낙하(falldown) 프레임. 중력으로 떨어질 때 이 포즈를 보여준다. 키 없으면 기본 포즈로 폴백.
export const CHARACTER_FALL_FRAMES: Partial<Record<CharacterId, string[]>> =
    buildMotionFrames(motionFiles, 'falldown')

// 캐릭터별 정적 표정 세트(<character>/expressions/*.png). 가만히 있을 때/hover 시 랜덤으로 보여준다.
// 애니가 아니라 각 프레임이 독립된 한 표정 — 순서 무관.
export const CHARACTER_EXPRESSIONS: Partial<Record<CharacterId, string[]>> =
    buildMotionFrames(motionFiles, 'expressions')

// 홈 씬 합본(캐릭터 + 바닥) 이미지. CareTab 홈에서 캐릭터+바닥을 한 장으로 렌더. (<character>/home.png)
export const HOME_SCENE_ASSETS: Record<CharacterId, string> = Object.fromEntries(
    CHARACTER_IDS.map((id) => [id, rootByCharacter[id]?.['home']]),
) as Record<CharacterId, string>
