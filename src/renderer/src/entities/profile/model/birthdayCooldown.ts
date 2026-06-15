import { BIRTHDAY_EDIT_COOLDOWN_MS, type ProfileState } from '@shared/contracts/profileEvents'

const DAY_MS = 24 * 60 * 60 * 1000

// 생일 변경 쿨타임 상태. 한 번 바꾸면 30일간 잠긴다(최초 변경은 잠금 없음).
// CareTab·SettingsTab이 공유 — 잠금 여부 + 남은 일수를 돌려준다.
export const getBirthdayCooldown = (
    profile: ProfileState,
): { locked: boolean; remainingDays: number } => {
    if (profile.birthdayUpdatedAt <= 0) {
        return { locked: false, remainingDays: 0 }
    }
    const elapsed = Date.now() - profile.birthdayUpdatedAt
    if (elapsed >= BIRTHDAY_EDIT_COOLDOWN_MS) {
        return { locked: false, remainingDays: 0 }
    }
    return {
        locked: true,
        remainingDays: Math.ceil((BIRTHDAY_EDIT_COOLDOWN_MS - elapsed) / DAY_MS),
    }
}
