import { PET_CATALOG } from '@renderer/entities/pet'
import { DECOR_ITEMS } from '@renderer/entities/world'

// 테스트 빌드 전용 전체 잠금 해제.
// VITE_TEST_UNLOCK=1 로 빌드했을 때만 동작하며, 시작 시 캐릭터·펫·데코(꾸미기)를 모두 보유 처리한다.
// 런타임 카탈로그의 실제 id를 그대로 쓰므로 한글 데코 id 정규화 문제나 기존 config 잔존값과 무관하게
// 확실히 해제된다. 배포 빌드(플래그 미설정)에서는 이 함수가 아무 것도 하지 않는다.
// (localStorage 가드로 설치당 1회만 실행 — 반복 acquire로 데코 수량이 불어나는 것을 막는다.)
const ALL_CHARACTERS = ['piyoo', 'qupee', 'suupee', 'wingpee']

export const runTestUnlockIfEnabled = async (): Promise<void> => {
    const enabled = (import.meta.env as Record<string, string | undefined>).VITE_TEST_UNLOCK
    if (!enabled) {
        return
    }
    if (localStorage.getItem('loopf.testUnlockDone.v2') === '1') {
        return
    }
    try {
        // 캐릭터: 스타터 확정(온보딩 스킵) + 나머지 전부 보유.
        await window.api.characterSelection.apply({ type: 'choose', characterId: 'piyoo' })
        for (const characterId of ALL_CHARACTERS) {
            await window.api.characterSelection.apply({ type: 'unlock', characterId })
        }
        // 펫: 전부 보유.
        for (const pet of PET_CATALOG) {
            await window.api.petSelection.apply({ type: 'unlock', petId: pet.id })
        }
        // 데코(꾸미기): 전부 넉넉히 보유(각 99개). 배치해도 0개가 되어 잠기지 않도록.
        // commitLayout으로 보유 수량을 통째로 지정하되, 이미 배치된 데코는 보존한다.
        const current = await window.api.world.get()
        const ownedAll = Object.fromEntries(DECOR_ITEMS.map((decor) => [decor.id, 99]))
        await window.api.world.apply({
            type: 'commitLayout',
            owned: ownedAll,
            placed: current.placed,
        })
        localStorage.setItem('loopf.testUnlockDone.v2', '1')
    } catch {
        // 해제 실패는 앱 동작에 영향을 주지 않으므로 무시한다.
    }
}
