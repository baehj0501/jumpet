import type { CharacterId, Mood } from '../model/Character'

import dogDefault from './dog/default.jpeg'
// 에셋 도착 시 아래와 같이 추가하고 매핑 폴백을 교체:
// import dogHappy from './dog/happy.gif'
// import dogSad from './dog/sad.gif'

// 캐릭터 × 감정 별 이미지 매핑.
// Record로 강제해 새 CharacterId / Mood 추가 시 매핑 누락이 컴파일 에러로 잡힌다.
// 아직 도착하지 않은 조합은 default 무드로 폴백한다.
export const CHARACTER_ASSETS: Record<CharacterId, Record<Mood, string>> = {
    dog: {
        default: dogDefault,
        happy: dogDefault,
        sad: dogDefault,
    },
}
