# Desktop Pet 프로젝트 문서

이 폴더는 프로젝트의 의도·아키텍처·기능 명세를 담는다. 코드만 보고는 알기 어려운 도메인 컨텍스트와 미래 계획이 여기에 정리되어 있다.

## 빠르게 시작하려면

1. [`project-overview.md`](./project-overview.md) — 이 프로젝트가 무엇이고 어디로 가는지
2. [`architecture.md`](./architecture.md) — 멀티 윈도우·SSOT·FSD-lite의 기술 결정과 데이터 흐름
3. [`features/README.md`](./features/README.md) — 구현된/계획된 기능 한눈에

## 작업 시 어떤 문서를 봐야 하나

| 상황 | 문서 |
|---|---|
| 프로젝트 정체성·방향성 확인 | [`project-overview.md`](./project-overview.md) |
| 새 기능 만들 때 어디에 둘지 | [`architecture.md`](./architecture.md) + [`features/README.md`](./features/README.md) |
| 특정 기능 구현 / 변경 | [`features/{기능}.md`](./features/) |
| 코드 품질 원칙 (응집·결합·가독성·예측 가능성) | [`frontend-fundamentals/README.md`](./frontend-fundamentals/README.md) |
| 컨벤션·스킬·작업 우선순위 (Claude Code 가이드) | 루트의 [`CLAUDE.md`](../CLAUDE.md) |

## 문서 작성 원칙

- **결정과 그 이유를 함께 적는다** — 코드에서 *무엇*은 보이지만 *왜*는 안 보임.
- **변하지 않는 명세만 담는다** — 구현 진행 상태나 진척률은 적지 않는다. 그건 코드/git가 안다. docs는 "이게 무엇이다"의 정의가 시간이 지나도 유효해야 함.
- **관련 코드 anchor 포함** — 파일 경로(가능하면 라인 번호도). 다만 파일이 자주 옮겨지면 폴더 단위 anchor도 OK.
- **Open Questions 섹션** — 미정 사항은 묻어두지 말고 명시. 결정되면 본문으로 옮기고 이 섹션에서 제거.

## 신뢰성

이 문서들은 **명세 시점의 의도**를 담는다. 코드와 어긋날 수 있으니, 코드가 진실이라고 의심되면 코드를 신뢰하고 이 문서를 업데이트한다.
