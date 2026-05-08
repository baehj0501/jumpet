# Context Card / Comment 주석 처리 가이드

디자이너가 Figma에 남긴 **UI가 아닌 spec 정보**를 추출해 Mapping Report의 Behavior/State/Spec 축에 기록하기 위한 adapter이다.

## 왜 이게 필요한가

- 디자이너 컨벤션: **"맥락 및 요구사항은 context card 또는 comment 주석 컴포넌트로 적는다"**. 즉 주석처럼 보이는 일반 텍스트는 UI인지 설명인지 구분이 안 돼서 추출하지 않는다.
- 따라서 디자이너가 붙여둔 context card / Comment 주석은 **PRD-성격 정보**이고, 이걸 놓치면 기능 구현이 UI만 있고 조건/상태/엣지케이스가 비게 된다.
- base workflow(Step 1~7)는 UI 구현에 focus되어 있어 이런 인스턴스를 "구현 불필요"로 skip할 위험이 있다. 이 adapter는 skip을 막는다.

## 인식 규칙

Figma MCP 응답에서 다음 중 하나에 해당하는 `<instance>`는 **spec 정보**로 취급한다.

1. `name` 정확히 일치: `Comment 주석`, `context card`, `sticky note`, `spec note`
2. `name`이 위 문자열 중 하나로 **시작**: `context card / ...`, `Comment 주석 - ...`
3. 섹션 내 UI 프레임 바깥에 배치되고, 자식이 전부 `<text>`로 구성된 instance (fallback — 컨벤션 미준수 케이스)

**오인 금지**: `StickyActionButton` 같이 UI 컴포넌트 이름에 sticky가 포함된 경우는 제외한다. 자식 구조가 UI (버튼, 아이콘)면 UI로 취급.

## 처리 절차

### 1. 감지

섹션 단위 `get_design_context` 호출 결과에서 위 규칙에 해당하는 `<instance>` 노드 id를 모두 수집한다. sparse 응답에서도 `name`, `x`, `y`, `width`, `height`은 항상 나오므로 식별 가능하다.

### 2. 재호출

각 인스턴스 id로 `get_design_context`를 **개별 호출**한다. 내용 텍스트가 pseudo-code 형태로 전부 나온다. 예시:

```tsx
// 7996:150313 context card
<div data-name="context card">
  <p>전체보기 진입 시</p>
  <ul>
    <li>현재 디폴트 랜딩 기준으로 동일하게 랜딩</li>
    <li>(아마도 그냥 '신청' 탭으로 떨어지고 있는 듯)</li>
  </ul>
</div>
```

pseudo-code에서 text content만 정렬해 verbatim으로 뽑는다. 들여쓰기나 list 구조는 Mapping Report에서 자연어 bullet로 유지.

### 3. 좌표 기반 Attach

spec 인스턴스의 중심점 `(cx, cy) = (x + width/2, y + height/2)`를 구한 뒤, **같은 section 내 다른 UI frame/instance** 중 중심점 거리가 최소인 것을 attach 대상으로 고른다.

#### 휴리스틱 우선순위

1. **수평 인접** — 같은 `y` 범위 내에서 가장 가까운 좌/우 UI frame. 일반적으로 디자이너는 화면 옆에 주석을 배치한다.
2. **수직 인접** — 같은 `x` 범위 내에서 바로 위/아래 UI frame.
3. **중심점 유클리드 거리 최소** — 위 둘로 판정 불가할 때 fallback.
4. **connector 엣지** — `<connector>` 노드가 spec 인스턴스에서 UI frame으로 연결되어 있다면 우선. 단 MCP 응답에 endpoint 정보가 없는 경우가 많아 항상 사용 가능한 건 아님.

### 4. 불확실 케이스

- **attach 후보가 동점**: Mapping Report에 복수 후보 모두 기록하고 status `unresolved`. 사용자에게 확정 요청.
- **spec 인스턴스 재호출 실패** (권한/truncate 등): status `unresolved`, content에 "(재호출 실패)" 명시.
- **내용은 있지만 UI와 무관한 운영 메모** (예: "@대형 이 부분 다시 확인"): status `out-of-scope`, 이유 기록.

## Category 분류

Mapping Report의 Behavior/State/Spec 축에서 category 값으로 쓰는 태그.

| Category | 내용 예시 |
|---|---|
| `behavior` | "버튼 누르면 X 화면으로 이동", "3초 후 자동 닫힘" |
| `state` | "로그인 안 된 상태일 때 [...] 표시", "빈 목록일 때 empty state" |
| `edge-case` | "상품 0개일 때", "재고 초과 시 snackbar" |
| `policy` | "프로모션 제외 목록", "최저가 기준은 일 단위 갱신" |
| `question` | 디자이너가 결정 안 된 상태로 남긴 물음표 |

분류 불확실 시 `behavior`로 기본.

## 출력 예시 (Mapping Report에 들어가는 행)

```markdown
### Behavior / State / Spec
| Source (node id / name) | Attached UI node | Content (verbatim) | Category | Status |
|---|---|---|---|---|
| 7996:150313 / context card | 7996:150311 / 전체보기 Screen | "전체보기 진입 시 디폴트 랜딩 기준으로 동일하게 랜딩. (아마도 그냥 '신청' 탭으로 떨어지고 있는 듯)" | state | captured |
| 8002:151228 / Comment 주석 | 8002:151230 / 협찬 현황 Frame | "문구는 조금 더 다듬어야 할 듯..." | question | unresolved |
| 7996:150743 / context card | (후보: 7996:150740, 7996:150745) | "크리에이터 홈으로 랜딩" | behavior | unresolved |
```

## 주의

- `<connector>` (화살표/관계선) 자체는 spec이 아니라 관계 표현이다. Context card를 찾는 용도로만 활용한다 (가능하면).
- Figma 네이티브 Comment 핀은 **MCP 응답에 안 들어온다**. 디자이너가 이걸 썼다면 context card로 옮겨달라고 요청하는 게 사내 컨벤션이다.
- 이 adapter는 **spec 추출 전용**이다. UI 구현 판단은 SKILL.md의 *프로젝트 특화 규칙 > Vesper rules* 섹션이 책임진다.
