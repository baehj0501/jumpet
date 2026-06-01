// Desktop World(아이템 꾸미기)의 IPC 계약.
// main reducer · preload bridge · renderer mirror 세 곳이 모두 이 한 파일을 import한다.
// 명세: docs/features/desktop-world.md
//
// 모델: 보유(owned, 보관 중) + 배치(placed, 배치 중). 가챠로 owned가 누적되고,
// 꾸미기 모드에서 owned→placed(배치) / placed→owned(회수)로 이동한다.

// 데코 카탈로그(id·이름·이미지)는 renderer 전용(PNG import) — entities/world/model/decorCatalog.ts.
// 계약(main 공유)은 itemId 문자열과 상태/이벤트만 다룬다.

// 월드에 배치된 아이템 하나. x/y는 월드 영역 기준 비율(0~1) — 창 크기가 달라도 위치 유지.
export type PlacedItem = {
    instanceId: string
    itemId: string
    x: number
    y: number
}

// 꾸미기 모드. edit=바탕화면 월드 창에서 배치/이동 가능, fixed=고정(클릭 통과).
// 영속되지 않는다(앱 시작 시 항상 fixed) — store.read에서 fixed로 강제.
export type WorldMode = 'fixed' | 'edit'

// 영속되는 월드 상태. owned=보관 중 개수, placed=배치된 인스턴스 목록, mode=꾸미기 상태.
export type WorldState = {
    owned: Record<string, number>
    placed: PlacedItem[]
    mode: WorldMode
}

export type WorldEvent =
    // 가챠 획득 → 보관함에 1개 추가.
    | { type: 'acquire'; itemId: string }
    // 배치 — 보관분 1개 차감하고 placed에 추가(instanceId는 호출자가 생성).
    | { type: 'place'; instanceId: string; itemId: string; x: number; y: number }
    // 배치 이동.
    | { type: 'move'; instanceId: string; x: number; y: number }
    // 회수 — placed에서 빼고 보관분으로 복귀.
    | { type: 'recall'; instanceId: string }
    // 저장(커밋) — 꾸미기 모드의 결과(보유/배치 전체)를 통째로 교체.
    | { type: 'commitLayout'; owned: Record<string, number>; placed: PlacedItem[] }
    // 초기화 — 배치 전부 회수(보관분으로 되돌림).
    | { type: 'reset' }
    // 꾸미기 모드 전환(edit/fixed). main이 월드 창의 클릭통과/포커스를 토글.
    | { type: 'setMode'; mode: WorldMode }

export const INITIAL_WORLD_STATE: WorldState = {
    owned: {},
    placed: [],
    mode: 'fixed',
}
