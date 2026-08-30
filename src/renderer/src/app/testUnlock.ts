import { PET_CATALOG } from '@renderer/entities/pet'
import { DECOR_ITEMS } from '@renderer/entities/world'

// 테스트 빌드 전용 전체 잠금 해제.
// VITE_TEST_UNLOCK=1 로 빌드했을 때만 동작하며, 시작 시 캐릭터·펫·데코(꾸미기)를 모두 보유 처리한다.
// 런타임 카탈로그의 실제 id를 그대로 쓰므로 한글 데코 id 정규화 문제나 기존 config 잔존값과 무관하게
// 확실히 해제된다. 배포 빌드(플래그 미설정)에서는 이 함수가 아무 것도 하지 않는다.
// 캐릭터·펫·데코 해제는 멱등(unlock=집합 추가, commitLayout=수량 절대 지정)이라 매 시작 재적용해도
// 수량이 불어나지 않는다. 따라서 데이터 초기화로 config가 지워져도 다음 실행에서 다시 해제되도록
// 가드 없이 매번 보장한다. 단 '스타터 piyoo 선택'만은 사용자가 고른 캐릭터를 덮어쓰지 않도록 1회만 실행한다.
const ALL_CHARACTERS = ['piyoo', 'qupee', 'suupee', 'wingpee']

export const runTestUnlockIfEnabled = async (): Promise<void> => {
    const enabled = (import.meta.env as Record<string, string | undefined>).VITE_TEST_UNLOCK
    if (!enabled) {
        return
    }
    try {
        // 포인트: 테스트 편의를 위해 최초 1회 넉넉히 지급(가드로 재실행/소비 시 재충전 방지).
        // 'manual'은 디버그용 delta 이벤트다. 배포 빌드에선 이 함수 자체가 실행되지 않는다.
        if (localStorage.getItem('loopf.testPointsGranted.v1') !== '1') {
            await window.api.player.apply({ type: 'manual', delta: 1_000_000 })
            localStorage.setItem('loopf.testPointsGranted.v1', '1')
        }
        // 캐릭터: 스타터 확정(온보딩 스킵)은 최초 1회만 — 이후엔 사용자의 선택을 존중.
        if (localStorage.getItem('loopf.testStarterChosen.v1') !== '1') {
            await window.api.characterSelection.apply({ type: 'choose', characterId: 'piyoo' })
            localStorage.setItem('loopf.testStarterChosen.v1', '1')
        }
        // 캐릭터: 전부 보유(멱등).
        for (const characterId of ALL_CHARACTERS) {
            await window.api.characterSelection.apply({ type: 'unlock', characterId })
        }
        // 펫: 전부 보유(멱등).
        for (const pet of PET_CATALOG) {
            await window.api.petSelection.apply({ type: 'unlock', petId: pet.id })
        }
        // 데코(꾸미기): 전부 넉넉히 보유(각 99개). 배치해도 0개가 되어 잠기지 않도록.
        // commitLayout으로 보유 수량을 통째로 지정하되(절대값이라 멱등), 이미 배치된 데코는 보존한다.
        const current = await window.api.world.get()
        const ownedAll = Object.fromEntries(DECOR_ITEMS.map((decor) => [decor.id, 99]))
        await window.api.world.apply({
            type: 'commitLayout',
            owned: ownedAll,
            placed: current.placed,
        })
    } catch {
        // 해제 실패는 앱 동작에 영향을 주지 않으므로 무시한다.
    }
}
