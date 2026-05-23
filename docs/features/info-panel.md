# 정보 패널

## 한 줄 정체성

플레이어의 현재 상태(점수, 레벨)를 한눈에 보여주는 패널.

## 명세 (신 다이어그램)

다이어그램에 명시된 내용:
- **가진 점수** 표시.
- **레벨** 표시.

그 외 항목은 추정 / 미정:
- 레벨업까지 남은 점수 (progress bar)?
- 누적 통계 (가챠 횟수, 완료한 TODO 수, 본 운세 수)?
- 보유 아이템 개수?
- v2.0 §6의 스탯(기분/에너지/포만감/친밀도)도 같이 표시? — 스탯 시스템 폐기 여부에 달림

## 레벨 시스템 (미정)

명세에 레벨이라는 단어는 있지만 **공식/구간/보상은 정의되지 않음**. 가능한 모델:

### 옵션 A — 누적 점수 기반

레벨이 누적 점수의 함수. 점수가 가챠로 -50되더라도 누적 카운터는 계속 증가:

```ts
type PlayerState = {
    score: number              // 현재 잔액 (가챠 등으로 변동)
    cumulativeScore: number    // 누적 (감소 X) — 레벨 계산용
    level: number              // 파생 가능하지만 캐싱
}
```

### 옵션 B — 현재 점수 기반

레벨이 현재 잔액의 함수. 가챠로 점수 쓰면 레벨도 내려감.

→ 사용자가 가챠로 보상받았는데 레벨 내려가면 부정적 경험. **옵션 A 권장**.

### 옵션 C — 별도 경험치(XP) 필드

점수와 별개로 경험치만 누적. 점수는 재화, XP는 진행도.

→ 데이터 모델 늘어남. 다만 의미 분리가 깔끔.

### 레벨업 공식 예

```ts
// 누적 점수가 늘어날수록 레벨업 비용 증가 (RPG식)
const levelToCumulativeScore = (level: number): number => {
    return Math.floor(100 * Math.pow(level, 1.5))
}
// level 1 → 100, level 2 → 283, level 3 → 520, level 5 → 1118, level 10 → 3162
```

→ 사용자 결정 사항.

### 레벨업 보상 (v2.0 §10.2의 트리거 메시지에 언급)

- 레벨업 시 "레벨 업! 🎊" 말풍선 + 축하 GIF 모션.
- v2.0의 §13 미정 사항 — "레벨업 시스템 보상 구체화 (말풍선 추가, 아이템 해제 등)".
- 가능한 보상:
  - 점수 보너스
  - 영구 아이템 자동 잠금 해제
  - 가챠 1회 무료권
  - 인벤토리 슬롯 확장 (소모성 카운트 상한 증가 등)

## 아키텍처 / 데이터 흐름

### 데이터는 어디에 살아야 하나

레벨이 player score와 강하게 결합되어 있어 **PlayerState 확장**이 자연스러움:

```ts
// src/shared/contracts/playerEvents.ts (확장)
export type PlayerState = {
    score: number                  // 현재 잔액
    cumulativeScore: number        // 누적 (옵션 A)
    level: number                  // cumulativeScore에서 파생, 캐싱
}
```

reducer에서 점수 가산 시 cumulativeScore도 같이 증가시키고 level 재계산:

```ts
const computeLevel = (cumulative: number): number => {
    let level = 1
    while (levelToCumulativeScore(level + 1) <= cumulative) {
        level += 1
    }
    return level
}

// 'todoComplete', 'feed', 'play', 'fortune' 등 점수 가산 case마다:
{
    ...state,
    score: state.score + delta,
    cumulativeScore: state.cumulativeScore + delta,
    level: computeLevel(state.cumulativeScore + delta),
}
```

### 레벨업 감지

reducer가 새 state 반환 시 level이 증가했는지 비교 → main에서 broadcast `player:levelUp`:

```ts
ipcMain.handle('player:apply', (_event, event) => {
    const current = readPlayerState()
    const next = reducePlayerState(current, event)
    writePlayerState(next)
    broadcastPlayerState(next)
    if (next.level > current.level) {
        broadcastCharacterMotion('levelUp', 3000)
        broadcastCharacterSpeech({ text: '레벨 업! 🎊' })
        // 레벨업 보상 적용 — apply gachaTicket / unlockItem 등
    }
    return next
})
```

### 정보 패널 UI

별창 vs 모달 — 다른 패널과의 일관성 위해 **별창**이 자연스러움.

```
src/renderer/info.html
src/renderer/src/pages/info/
    ├── main.tsx
    └── InfoPage.tsx
```

InfoPage 안에서:
- `usePlayerStore` selector로 score/level/cumulative
- (선택) 아이템 보유 개수: `useInventoryStore`
- (선택) 누적 통계: 별도 store

### 관련 코드 (계획)

| 영역 | 파일 |
|---|---|
| PlayerState 확장 | `src/shared/contracts/playerEvents.ts` |
| level 계산 + 레벨업 감지 | `src/main/playerState/playerState.ts` + `ipc.ts` |
| 통계 store (선택) | `src/main/statistics/` |
| 별창 entry | `src/renderer/info.html` |
| UI | `src/renderer/src/pages/info/` |

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | player (점수·레벨 read), (선택) inventory · statistics · todo |
| **호출됨** | 우클릭 메뉴의 '📊 정보' / 레벨업 시 character (GIF/말풍선) |

이 패널은 **다른 도메인의 read-only 뷰어**. 자기 데이터를 새로 만들 일은 거의 없음 (통계 도메인 정도).

## Open Questions

- **레벨 공식 확정** — A/B/C 중 어느 모델? — **가장 큰 미정 사항**
- **레벨업 보상 정책** — 무엇을 줄지
- **표시 항목 확정** — 점수·레벨 외에 무엇을 보여줄지
- **별창 vs 모달** — 다른 패널과 일관성 우선이면 별창
- **레벨 시각화** — progress bar? 다음 레벨까지 N점 식?
- **누적 통계 추적 모델** — 가챠 횟수 등은 어디에 카운트? player에 통합? 별 store?
