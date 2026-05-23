# 점수 시스템

## 한 줄 정체성

플레이어의 단일 재화. 모든 인터랙션의 보상이자 가챠의 소비처. main이 SSOT.

## 명세

### 점수 획득 (신 다이어그램 + v2.0 §5.1)

| 활동 | 보상 |
|---|---|
| 🍖 먹이주기 | +1~5점 랜덤 |
| 🎮 놀아주기 | +1~5점 랜덤 |
| ✅ To-Do 완료 | +1~5점 랜덤 |
| 🔮 오늘의 운세 | +60~100점 |
| 🎰 가챠 영구형 중복 시 환원 | +10점 |
| 짧은 클릭 (말풍선 트리거) | 점수 영향 없음 (친밀도만) |

### 점수 소비

| 활동 | 비용 |
|---|---|
| 🎰 가챠 1회 | -50점 |

점수 부족 시 가챠 버튼 비활성화.

### 도메인 invariant

- **음수 점수 금지** — 모든 변경 후 `Math.max(0, ...)` floor.
- **finite integer만** — NaN/Infinity 차단.
- 상한은 명세 없음 (Number.MAX_SAFE_INTEGER 까지 자유).

### 영속화

- 앱 재시작 후에도 유지 — main의 `electron-store`에 저장.
- 손상된 데이터(디스크 손상·사용자 자가 편집) 발견 시 `INITIAL_PLAYER_STATE`(0점)로 자가 치료.

## 아키텍처 / 데이터 흐름

### 데이터 흐름

```
어디서든 (캐릭터 윈도우 / TODO 별창 / 가챠 별창 / ...)
   ↓
usePlayerStore.getState().apply({ type: 'todoComplete' })  또는
window.api.player.apply({ type: 'feed' })
   ↓ preload → main
[ipcMain.handle('player:apply')]
   ↓
applyPlayerEvent(event)  // main 내부에서도 같은 함수 사용
   ↓
reducePlayerState(current, event)  // 순수 reducer (todoComplete의 1~5 랜덤은 reducer 내부)
   ↓
writePlayerState(next)  // electron-store
   ↓
broadcastPlayerState(next)  // 모든 BrowserWindow에 'player:changed'
   ↓
각 renderer의 usePlayerStore가 setState
```

### PlayerEvent union

`src/shared/contracts/playerEvents.ts`:

```ts
export type PlayerEvent =
    | { type: 'manual'; delta: number }       // 디버그/시드 — production에선 좁힐 예정
    | { type: 'todoComplete' }                // TODO 완료 — reducer가 1~5 랜덤 가산
    // 미래:
    // | { type: 'feed' }                     // 먹이 사용 — 1~5 랜덤
    // | { type: 'play' }                     // 놀이 사용 — 1~5 랜덤
    // | { type: 'fortune' }                  // 운세 — 60~100 랜덤
    // | { type: 'gachaSpin' }                // 가챠 — -50
    // | { type: 'gachaRefund' }              // 중복 환원 — +10
```

### 도메인 간 부수효과 조립

todo 도메인은 player를 직접 import하지 않음. 대신 `registerTodoIpc({ onTodoCompleted })` 콜백으로 부수효과를 외부에서 주입:

```ts
// src/main/index.ts
registerTodoIpc({
    onTodoCompleted: () => {
        applyPlayerEvent({ type: 'todoComplete' })
    },
})
```

같은 패턴을 가챠·먹이·놀이·운세에도 적용:
- todo 모듈은 "todo 완료 발생" 사실만 알림
- player 모듈은 "점수 가산" 책임
- 조립은 `src/main/index.ts`에서

### Renderer 측 소비

```tsx
const score = usePlayerStore(state => state.player.score)   // selector로 점수만
const apply = usePlayerStore(state => state.apply)
apply({ type: 'manual', delta: 5 })  // dev에서 임시 점수 증가
```

### 관련 코드

| 영역 | 파일 |
|---|---|
| 타입 (공유) | `src/shared/contracts/playerEvents.ts` |
| reducer | `src/main/playerState/playerState.ts` |
| 영속화 | `src/main/playerState/store.ts` |
| IPC | `src/main/playerState/ipc.ts` (`applyPlayerEvent`, `registerPlayerStateIpc`) |
| barrel | `src/main/playerState/index.ts` |
| preload 노출 | `src/preload/index.ts` (`window.api.player`) |
| Zustand store | `src/renderer/src/entities/player/model/usePlayerStore.ts` |
| barrel | `src/renderer/src/entities/player/index.ts` |

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | electron-store, IPC |
| **호출됨** | 거의 모든 인터랙션 시스템 (TODO 완료, 가챠, 먹이, 놀이, 운세) |
| **노출 방향** | 정보 패널이 점수·레벨 표시할 때 읽기 전용으로 구독 |

## Open Questions

- **manual 이벤트 production 차단** — 첫 도메인 이벤트가 더 안정되면 `process.env.NODE_ENV === 'development'`에서만 통과시킬지
- **점수 변동 애니메이션** — `score: 100 → 105` 변화 시 카운트업 애니메이션? 즉시 갱신?
- **점수 HUD 위치** — 캐릭터 윈도우 코너? 별 mini overlay? 정보 패널 안에만?
- **사운드 피드백** — 점수 가산 시 소리? 가챠 결과는 따로?
- **레벨 시스템과의 연결** — 점수 → 레벨 공식은 [info-panel.md](./info-panel.md)에서
