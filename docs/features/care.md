# 돌봄 (Care)

> 구 `feeding-and-playing.md`(먹이주기 + 놀아주기)를 대체·통합한다.

## 한 줄 정체성

캐릭터를 보살피는 패널. **밥/놀이**는 소모성 아이템을 1개 써서 하고, **쓰다듬기/눕기**는 언제나 가능한 무료 상호작용이다. 각 액션은 패널 안에서 짧은 반응 메시지를 보여준다.

## 명세

### 액션 2종류

| 구분 | 액션 | 이모지 | 동작 | 반응 메시지 |
|---|---|---|---|---|
| **아이템 소모** | 밥 주기 | 🍚 | 먹이류 아이템 1개 소모 | "냠냠! 🍖" |
| **아이템 소모** | 놀아주기 | 🎮 | 장난감류 아이템 1개 소모 | "신난다! ⚡" |
| **무료** | 쓰다듬기 | 🤗 | 아이템 불필요, 항상 가능 | "좋아 ✨" |
| **무료** | 눕기 | 🛋️ | 아이템 불필요, 항상 가능 | "편안해~ 🛋️" |

### 핵심 규칙 (구현 시 확정)

- **스탯 없음** — HP·배고픔·기분 같은 스탯은 도입하지 않는다.
- **쿨타임 없음** — 대신 **소모성 아이템**이 밥/놀이의 게이트 역할을 한다(아이템 없으면 못 함).
- **포인트 보상 없음** — 돌봄은 *소비처*다. 포인트는 To-Do·운세로 벌어 뽑기에 쓴다(파밍 방지). → [player-score.md](./player-score.md)
- 경제 루프: **벌기(투두·운세) → 쓰기(🎰 뽑기) → 소비(돌봄)**.
- 캐릭터 위 말풍선/감정 모션은 **이번 범위 밖** — 현재는 패널 내부 피드백 메시지로만. (말풍선/모션은 [messages.md](./messages.md)·[character.md](./character.md) 후속.)

### UI 패널

- 별창 BrowserWindow (360×520).
- **밥 주기 / 놀아주기 섹션** — 보유한 해당 카테고리 아이템만 버튼으로 표시(이모지·이름·보유 개수 `×N`). 보유 0이면 "아이템이 없어요 — 🎰 가챠에서 뽑아보세요!".
- **함께하기 섹션** — 쓰다듬기·눕기(무료, 항상 활성).
- 액션 실행 → 상단 피드백 메시지 영역에 반응 표시(약 2.5초 후 사라짐).

## 아키텍처 / 데이터 흐름

### 돌봄은 자체 도메인이 없다

쿨타임을 제거하면서 돌봄에 영속할 자체 상태가 사라졌다. 밥/놀이는 **item 도메인의 consume**으로 처리하고, 쓰다듬기/눕기는 순수 UI 피드백이다.

```
[돌봄 패널 — 사용자가 보유 '뼈다귀' 클릭]
   ↓ useItemActions().consume('food_bone')
   ↓ window.api.item.apply({ type: 'consume', itemId: 'food_bone' })
[main: item reducer — counts['food_bone'] -= 1]
   ↓ writeItemState + broadcast 'item:changed'
   ↓ 패널은 즉시 피드백 메시지 표시("냠냠! 🍖")

[쓰다듬기/눕기 클릭]
   ↓ 피드백 메시지만 표시 (IPC 없음)
```

소모 아이템·뽑기 모델은 [gacha-and-inventory.md](./gacha-and-inventory.md).

### 관련 코드

| 영역 | 파일 |
|---|---|
| 소모 아이템 타입·시드 | `src/shared/contracts/itemEvents.ts` |
| item 도메인 (consume·뽑기) | `src/main/item/` |
| renderer item slice | `src/renderer/src/entities/item/` |
| 돌봄 패널 UI | `src/renderer/src/pages/care/` |
| 돌봄 별창 열기 | `src/main/panels/openCarePanel.ts` |
| 별창 entry | `src/renderer/care.html` |

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | item (밥/놀이 시 consume) |
| **호출됨** | 우클릭 메뉴의 '🐾 돌봄' |

→ 자체 도메인 없음. 밥/놀이는 item 도메인에 위임, 쓰다듬기/눕기는 순수 UI.

## Open Questions

- **무료 액션 확장** — 쓰다듬기/눕기도 언젠가 아이템·효과를 붙일지(현재는 순수 피드백).
- **캐릭터 반응 연동** — 돌봄 시 캐릭터 위 말풍선/감정 모션을 띄울지(messages·character GIF 후속).
- **아이템 종류 확장** — 현재 먹이 3종·장난감 3종 시드. 정식 풀·등급은 [gacha-and-inventory.md](./gacha-and-inventory.md) Open Question.
- **밥/놀이 외 카테고리** — 쓰다듬기/눕기에 전용 소모 아이템을 둘지(현재는 무료).
