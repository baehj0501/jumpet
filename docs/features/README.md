# 기능 명세 인덱스

각 기능의 *동작 규칙·아키텍처·의존성·미정 사항*을 담는 폴더. 구현 진행 상태는 코드/git 로그가 진실이므로 여기에는 적지 않는다.

## 기능 목록

> 우클릭 메뉴 구성은 [context-menu.md](./context-menu.md)가 단일 기준(SSOT). 아래는 기능별 명세 문서 인덱스.

| 기능 | 메뉴 | 문서 |
|---|---|---|
| 캐릭터 (표시·드래그·walking·애니메이션) | — | [character.md](./character.md) |
| 우클릭 컨텍스트 메뉴 | — | [context-menu.md](./context-menu.md) |
| 점수 (재화) | — | [player-score.md](./player-score.md) |
| 돌봄 (밥/놀이/쓰다듬기/눕기) | 🐾 돌봄 | [care.md](./care.md) |
| To-Do | ✅ To-Do | [todo.md](./todo.md) |
| 운세 (오늘의 운세 자동 팝업) | 🌸 운세 | [fortune.md](./fortune.md) |
| 일정 (캘린더 + 알림 + 생일) | 📅 일정 | [schedule.md](./schedule.md) |
| 가챠(뽑기) + 아이템 인벤토리(꾸미기/펫수집) | 🎰 가챠 · 🎒 아이템 | [gacha-and-inventory.md](./gacha-and-inventory.md) |
| 유튜브 (테마 프레임 플레이어 창) | 🎵 유튜브 | [youtube.md](./youtube.md) |
| 설정 (점수·레벨 + 캐릭터/테마/크기/내정보) | ⚙️ 설정 | [settings.md](./settings.md) |
| 말풍선 시스템 | — | [messages.md](./messages.md) |

> **폐기됨**: 링크 관리(`link-manager.md`) — 유튜브로 대체. 먹이/놀이(`feeding-and-playing.md`) → 돌봄으로 통합. 정보 패널(`info-panel.md`) → 설정으로 확장 통합.

## 도메인 간 의존성 그래프

```
                       ┌─→ player-score
                       │
character ─→ context-menu ─→ todo ─────┘ (완료 시 점수)
                       │
                       ├─→ care ─→ player-score (밥/놀이/쓰다듬기/눕기, +5~10 + 쿨타임)
                       │
                       ├─→ gacha(뽑기) ─→ player-score (데코 -30 / 펫 -50, 중복 +10 환원)
                       │       │
                       │       ↓ (영구 획득)
                       │   item 인벤토리 ─→ character (바탕화면 데코 / 펫 렌더)
                       │       ↑ (꾸미기/펫수집 탭에서 열람·배치)
                       ├─→ fortune ─→ player-score (60~100점 자동 가산)
                       │
                       ├─→ schedule ─→ character (시각 도달 시 알림 말풍선 / 생일 모션)
                       │       ↑ (생일 값)
                       ├─→ settings ─→ player-score(점수·레벨 읽기) + character(캐릭터/크기/테마)
                       │
                       └─→ youtube (독립 UI 창)

messages 시스템은 가로지름 — 클릭/돌봄/완료/뽑기 결과/운세/일정 알림 등 모든 트리거에서 사용
```

## 의존성 기반 구현 권장 순서

새 기능을 시작할 때 *무엇이 먼저 있어야 그 다음이 의미 있는가*. 의존성이 적은 것 → 많은 것 순.

1. **말풍선 시스템** ([messages.md](./messages.md)) — 인프라. 거의 모든 후속 기능이 사용
2. **캐릭터 PNG 애니메이션** ([character.md](./character.md)) — 독립적
3. **유튜브** ([youtube.md](./youtube.md)) — 거의 독립적인 UI 창
4. **운세** ([fortune.md](./fortune.md)) — 점수만 의존
5. **돌봄** ([care.md](./care.md)) — 점수 + 말풍선 + 감정/모션 (쿨타임 상태만 자체 보유)
6. **일정** ([schedule.md](./schedule.md)) — 캐릭터(알림) + 설정(생일)
7. **아이템 인벤토리 + 가챠(뽑기)** ([gacha-and-inventory.md](./gacha-and-inventory.md)) — 점수 + 바탕화면 데코/펫 렌더
8. **GIF 표정 모션** ([character.md](./character.md)) — 위 시스템들이 트리거
9. **설정** ([settings.md](./settings.md)) — 점수·레벨 읽기 + 캐릭터/테마/크기/내정보 (레벨 공식 의존)

## 문서 표준 구조

각 기능 문서는 다음 섹션을 가짐 (구현 진행 상태는 적지 않는다):

1. **한 줄 정체성** — 이 기능이 무엇인지
2. **명세** — 동작 규칙
3. **아키텍처 / 데이터 흐름** — 관련 코드 anchor, IPC 채널, 컴포넌트 트리
4. **의존성** — 다른 기능과의 연결
5. **Open Questions** — 미정 사항 (결정되면 본문으로 옮기고 여기서 제거)
