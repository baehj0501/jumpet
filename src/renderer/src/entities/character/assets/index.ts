import type { CharacterId, Mood } from '../model/Character'

// JUMPET_4 원본 PNG(idle 포즈)를 변형 없이 그대로 사용.
import piyooIdle from './piyoo/idle.png'
import qupeeIdle from './qupee/idle.png'
import suupeeIdle from './suupee/idle.png'
import wingpeeIdle from './wingpee/idle.png'
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
