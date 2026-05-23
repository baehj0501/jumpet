# 기능 명세 인덱스

각 기능의 *동작 규칙·아키텍처·의존성·미정 사항*을 담는 폴더. 구현 진행 상태는 코드/git 로그가 진실이므로 여기에는 적지 않는다.

## 기능 목록

| 기능 | 문서 |
|---|---|
| 캐릭터 (표시·드래그·walking·애니메이션) | [character.md](./character.md) |
| 우클릭 컨텍스트 메뉴 | [context-menu.md](./context-menu.md) |
| 점수 (재화) | [player-score.md](./player-score.md) |
| To-Do | [todo.md](./todo.md) |
| 가챠 + 아이템 인벤토리 | [gacha-and-inventory.md](./gacha-and-inventory.md) |
| 먹이주기 + 놀아주기 | [feeding-and-playing.md](./feeding-and-playing.md) |
| 운세 (오늘의 운세 자동 팝업) | [fortune.md](./fortune.md) |
| 정보 패널 (점수·레벨) | [info-panel.md](./info-panel.md) |
| 링크 관리 (별도 플로팅 창) | [link-manager.md](./link-manager.md) |
| 말풍선 시스템 | [messages.md](./messages.md) |

## 도메인 간 의존성 그래프

```
                       ┌─→ player-score
                       │
character ─→ context-menu ─→ todo ─────┘ (완료 시 점수)
                       │
                       ├─→ feeding ─→ player-score (점수 가산)
                       │       │
                       │       ↓ (소모)
                       │   inventory (소모성)
                       │       ↑ (획득)
                       ├─→ gacha ─→ player-score (50점 소모)
                       │       │
                       │       ↓ (영구/소모성 획득)
                       │   inventory
                       │
                       ├─→ playing ─→ player-score (점수 가산)
                       │       │
                       │       ↓ (소모)
                       │   inventory (소모성)
                       │
                       ├─→ fortune ─→ player-score (60~100점 자동 가산)
                       │
                       ├─→ info-panel (player-score 읽기 전용)
                       │
                       └─→ link-manager (독립)

messages 시스템은 가로지름 — 클릭/먹이/놀이/완료/가챠 결과 등 모든 트리거에서 사용
```

## 의존성 기반 구현 권장 순서

새 기능을 시작할 때 *무엇이 먼저 있어야 그 다음이 의미 있는가*. 의존성이 적은 것 → 많은 것 순.

1. **말풍선 시스템** ([messages.md](./messages.md)) — 인프라. 거의 모든 후속 기능이 사용
2. **캐릭터 PNG 애니메이션** ([character.md](./character.md)) — 독립적
3. **운세** ([fortune.md](./fortune.md)) — 점수만 의존
4. **링크 관리** ([link-manager.md](./link-manager.md)) — 완전 독립
5. **아이템 인벤토리** ([gacha-and-inventory.md](./gacha-and-inventory.md)) — 데이터 모델
6. **가챠 시스템** ([gacha-and-inventory.md](./gacha-and-inventory.md)) — 인벤토리 + 점수
7. **먹이주기 / 놀아주기** ([feeding-and-playing.md](./feeding-and-playing.md)) — 인벤토리 + 점수 + 말풍선 + GIF
8. **GIF 표정 모션** ([character.md](./character.md)) — 위 시스템들이 트리거
9. **정보 패널** ([info-panel.md](./info-panel.md)) — 다른 데이터 읽기

## 문서 표준 구조

각 기능 문서는 다음 섹션을 가짐 (구현 진행 상태는 적지 않는다):

1. **한 줄 정체성** — 이 기능이 무엇인지
2. **명세** — 동작 규칙
3. **아키텍처 / 데이터 흐름** — 관련 코드 anchor, IPC 채널, 컴포넌트 트리
4. **의존성** — 다른 기능과의 연결
5. **Open Questions** — 미정 사항 (결정되면 본문으로 옮기고 여기서 제거)
