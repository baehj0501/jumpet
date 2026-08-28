import type { CharacterId } from './Character'

// 캐릭터별 기본 표시 이름(종류명). 프로필 '캐릭터 이름'을 비워두면 이 값을 따라간다.
export const CHARACTER_DISPLAY_NAMES: Record<CharacterId, string> = {
    piyoo: '피요',
    qupee: '쿠피',
    suupee: '슈피',
    wingpee: '윙피',
}

// 마지막 글자에 받침이 있는지. 한글이 아니면 false로 간주.
const hasFinalConsonant = (name: string): boolean => {
    if (name.length === 0) {
        return false
    }
    const lastCode = name.charCodeAt(name.length - 1)
    // 한글 음절 영역: 0xAC00 ~ 0xD7A3
    if (lastCode >= 0xac00 && lastCode <= 0xd7a3) {
        return (lastCode - 0xac00) % 28 !== 0
    }
    return false
}

// 주격 조사(이/가) 부착 — 받침 있으면 '이', 없으면 '가'. (예: 조조 → 조조가, 하늘 → 하늘이)
export const withSubjectParticle = (name: string): string => {
    if (name.length === 0) {
        return name
    }
    return name + (hasFinalConsonant(name) ? '이' : '가')
}

// 호격 조사(아/야) 부착 — 받침 있으면 '아', 없으면 '야'. (예: 조조 → 조조야, 하늘 → 하늘아)
export const withVocativeParticle = (name: string): string => {
    if (name.length === 0) {
        return name
    }
    return name + (hasFinalConsonant(name) ? '아' : '야')
}
