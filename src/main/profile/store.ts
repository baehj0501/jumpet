import Store from 'electron-store'
import { INITIAL_PROFILE_STATE, type ProfileState } from '@shared/contracts/profileEvents'

type SchemaShape = {
    profile: ProfileState
}

const store = new Store<SchemaShape>({
    defaults: {
        profile: INITIAL_PROFILE_STATE,
    },
})

export const readProfileState = (): ProfileState => {
    const raw = store.get('profile') as ProfileState | undefined
    if (
        raw &&
        typeof raw.characterName === 'string' &&
        typeof raw.petName === 'string' &&
        typeof raw.birthday === 'string'
    ) {
        // 구버전 데이터엔 birthdayUpdatedAt이 없을 수 있으니 보강(0=쿨타임 없음).
        return {
            ...raw,
            birthdayUpdatedAt:
                typeof raw.birthdayUpdatedAt === 'number' ? raw.birthdayUpdatedAt : 0,
        }
    }
    console.warn('[profileState] hydration failed, resetting to INITIAL_PROFILE_STATE', raw)
    store.set('profile', INITIAL_PROFILE_STATE)
    return INITIAL_PROFILE_STATE
}

export const writeProfileState = (next: ProfileState): void => {
    store.set('profile', next)
}
