# 말풍선 시스템

## 한 줄 정체성

캐릭터 위에 떠오르는 메시지 풍선. 모든 인터랙션 시스템의 피드백 채널.

## 명세 (v2.0 §10)

### 표시 형식

- 캐릭터 머리 위에 떠 있는 작은 풍선 UI.
- 기본 표시 시간: **3초** (이벤트별로 차이 가능).
- **팝업 애니메이션**: 페이드 + 스케일.
- 자동 사라짐 (사용자 닫기 버튼 없음).
- 한 번에 한 풍선만. 새 트리거 발생 시 기존 풍선 교체.

### 트리거 (v2.0 §10.2)

| 트리거 | 타이밍 | 내용 |
|---|---|---|
| 짧은 클릭 (탭) | 즉시 | 랜덤 메시지 (캐릭터 안부 인사 풀 30~?개) |
| **자동** (45~90초마다) | 사용자 무관 | 랜덤 메시지 — **v2.0에 있던 항목, 신 다이어그램엔 없음** |
| 먹이 사용 | 즉시 | "냠냠~ 맛있어요! 🍖" + 점수 안내 |
| 놀이 사용 | 즉시 | "신난다! 🎉" + 점수 안내 |
| To-Do 완료 | 즉시 | "잘했어요! ✨" + 점수 안내 |
| 가챠 결과 | 박스 열림 후 | "획득! [아이템 이름]" |
| 가챠 환원 | 박스 열림 후 | "이미 가지고 있어요. 10점 환원!" |
| 운세 결과 | 운세 팝업 후 | (운세 자체 팝업이라 별도 풍선은 불필요할 수도) |
| 레벨업 | 조건 충족 시 | "레벨 업! 🎊" |

### 메시지 풀

각 카테고리별로 별도 텍스트 풀:

| 풀 | 크기 | 사용처 |
|---|---|---|
| 짧은 클릭 / 자동 — 일반 안부 | 30개? (미정) | "심심해요...", "안녕!", "오늘 어때요?" |
| 먹이 사용 | 30개 (다이어그램) | "냠냠~", "이거 제일 좋아해요" |
| 놀이 사용 | 30개 (다이어그램) | "신난다!", "한번 더!" |
| To-Do 완료 | 5~10개? | "잘했어요!", "오늘도 수고했어요" |
| 가챠 결과 | 등급별 | "와! 특수 아이템!", "득템!" |
| 레벨업 | 1~3개 | "레벨 업! 🎊" |

### 점수 표시

점수 가산이 함께 있는 트리거(먹이/놀이/완료/가챠 환원/운세)는 메시지 끝에 `+N점` 같은 부가 표시.

예: `"냠냠~ 맛있어요! 🍖" + "+3점"`

## 아키텍처 / 데이터 흐름

### 어디 살아야 하나

말풍선은 **시각 표현 + 트리거 매핑** 두 측면이 있음:
- **시각 표현** (UI): 캐릭터 윈도우 안의 React 컴포넌트. 캐릭터 위 absolute 위치.
- **트리거 매핑**: main에서 인터랙션 발생 시 캐릭터 윈도우로 `webContents.send('character:speech', { text, score?, durationMs? })` 전송.

### 데이터 흐름

```
[먹이 사용 발생 — 사용자가 먹이 패널에서 클릭]
   ↓ main이 부수효과 조립 시점에
broadcastCharacterSpeech({
    text: pickRandomFoodMessage(),     // '냠냠~ 맛있어요! 🍖'
    score: 3,                          // 가산된 점수
    durationMs: 3000,
})
   ↓ webContents.send('character:speech', payload)
   ↓ 캐릭터 윈도우의 renderer
[useSpeechBubble — 캐릭터 윈도우 안 hook 또는 store]
   ↓
setState({ active: { text, score, until: Date.now() + durationMs } })
   ↓
SpeechBubble 컴포넌트가 페이드 + 스케일 in
   ↓ durationMs 후
setTimeout으로 active를 null로 → 페이드 + 스케일 out
```

### 모델 제안

`src/shared/contracts/messageEvents.ts` (신규) — 메시지는 영속화하지 않으므로 broadcast payload만 정의:

```ts
export type SpeechPayload = {
    text: string
    score?: number               // 점수 안내가 있으면 "+N점" 표시
    durationMs?: number          // 기본 3000
    variant?: 'normal' | 'celebration' | 'sad'   // 시각 차이
}
```

### 메시지 풀 위치

`src/shared/contracts/messagePools.ts` (신규):

```ts
export const IDLE_MESSAGES: string[] = [
    '심심해요...',
    '안녕!',
    // ...
]
export const FOOD_MESSAGES: string[] = [ /* 30개 */ ]
export const TOY_MESSAGES: string[] = [ /* 30개 */ ]
export const TODO_COMPLETE_MESSAGES: string[] = [ /* 5~10개 */ ]

export const pickRandom = (pool: string[]): string =>
    pool[Math.floor(Math.random() * pool.length)]
```

### 캐릭터 윈도우 측 UI

```tsx
// src/renderer/src/widgets/CharacterScene/index.tsx (또는 entities/character 안)
const speech = useSpeechBubble()  // { text, score? } | null
return (
    <>
        <CharacterView ... />
        {speech && (
            <SpeechBubble text={speech.text} score={speech.score} />
        )}
    </>
)
```

### 자동 메시지 트리거 (선택)

v2.0의 45~90초 자동 메시지를 유지한다면 main에서 setInterval 또는 renderer에서 setInterval. 사용자 인터랙션 없을 때 무작위 발화.

→ 신 다이어그램에 없으니 **기본은 폐기, 사용자 결정 시 부활**.

### 관련 코드 (계획)

| 영역 | 파일 |
|---|---|
| 타입 (공유) | `src/shared/contracts/messageEvents.ts` |
| 메시지 풀 | `src/shared/contracts/messagePools.ts` |
| broadcast helper | `src/main/character/speech.ts` 또는 `src/main/messages/` |
| 부수효과 조립 | `src/main/index.ts` (먹이/놀이/완료/가챠 시 호출) |
| 캐릭터 윈도우 hook | `src/renderer/src/entities/character/behaviors/useSpeechBubble.ts` |
| 말풍선 UI | `src/renderer/src/entities/character/ui/SpeechBubble.tsx` |

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출됨** | 클릭, 먹이/놀이 사용, TODO 완료, 가챠 결과, 레벨업, 자동 타이머 |
| **호출함** | 없음 (얇은 표시 시스템) |

말풍선은 **인프라 레이어**. 거의 모든 다른 기능이 호출. 가장 먼저 만들어두면 후속 기능들이 곧장 사용 가능.

## Open Questions

- **자동 메시지 (45~90초) 유지/폐기** — 신 다이어그램에 없음. 거추장스럽다는 판단이면 폐기
- **메시지 풀 작성** — 각 카테고리 총합 ~100개 한국어 문구
- **`variant`별 시각 차이** — 색·아이콘·테두리?
- **연속 트리거** — 짧은 시간에 여러 트리거 발생 시 (예: 가챠 결과 + 점수 가산) 풍선 큐?
- **윈도우 경계 처리** — 캐릭터가 화면 끝에 있을 때 풍선이 잘리지 않게 — 풍선 위치를 자동 flip?
- **점수 표시 위치** — 메시지와 같은 풍선 안? 별도 작은 배지?
