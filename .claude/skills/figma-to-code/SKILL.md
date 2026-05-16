---
name: figma-to-code
description: "damoa-mobile-web / damoa-webview Figma 구현 전용. Vesper 컴포넌트/토큰 매핑 강제 + context card / Comment 주석 등 디자이너 spec 추출. Use when: (1) Figma URL이 포함된 구현 요청, (2) 'Figma 구현', '피그마 코드로', '디자인 구현', 'Design to Code' 요청, (3) '/figma-to-code' 명령어 사용."
---

# Figma to Code

damoa-mobile-web / damoa-webview에서 Figma 디자인을 Vesper 디자인 시스템 코드로 옮기는 workflow. 공통 base workflow + 이 레포 특화 규칙(Priority / Vesper / Context Layer / Mapping Report / Validation)을 한 파일에 통합.

## Overview

This skill provides a structured workflow for translating Figma designs into production-ready code with pixel-perfect accuracy. It ensures consistent integration with the Figma MCP server, proper use of design tokens, and 1:1 visual parity with designs.

Canvas-write, design generation, Code Connect tooling, and agent-rule authoring workflows are not configured in this repository. If a user asks for those, inform them the capability is not available here.

## Prerequisites

- Figma MCP server must be connected and accessible
- User must provide a Figma URL in the format: `https://figma.com/design/:fileKey/:fileName?node-id=1-2`
    - `:fileKey` is the file key
    - `1-2` is the node ID (the specific component or frame to implement)
- **OR** when using `figma-desktop` MCP: User can select a node directly in the Figma desktop app (no URL required)
- Project should have an established design system or component library (preferred)

## Required Workflow

**Follow these steps in order. Do not skip steps.**

### Step 1: Get Node ID

#### Option A: Parse from Figma URL

When the user provides a Figma URL, extract the file key and node ID to pass as arguments to MCP tools.

**URL format:** `https://figma.com/design/:fileKey/:fileName?node-id=1-2`

**Extract:**

- **File key:** `:fileKey` (the segment after `/design/`)
- **Node ID:** `1-2` (the value of the `node-id` query parameter)

**Note:** When using the local desktop MCP (`figma-desktop`), `fileKey` is not passed as a parameter to tool calls. The server automatically uses the currently open file, so only `nodeId` is needed.

**Example:**

- URL: `https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15`
- File key: `kL9xQn2VwM8pYrTb4ZcHjF`
- Node ID: `42-15`

#### Option B: Use Current Selection from Figma Desktop App (figma-desktop MCP only)

When using the `figma-desktop` MCP and the user has NOT provided a URL, the tools automatically use the currently selected node from the open Figma file in the desktop app.

**Note:** Selection-based prompting only works with the `figma-desktop` MCP server. The remote server requires a link to a frame or layer to extract context. The user must have the Figma desktop app open with a node selected.

### Step 2: Fetch Design Context

Run `get_design_context` with the extracted file key and node ID.

```
get_design_context(fileKey=":fileKey", nodeId="1-2")
```

This provides the structured data including:

- Layout properties (Auto Layout, constraints, sizing)
- Typography specifications
- Color values and design tokens
- Component structure and variants
- Spacing and padding values

**If the response is too large or truncated:**

1. Run `get_metadata(fileKey=":fileKey", nodeId="1-2")` to get the high-level node map
2. Identify the specific child nodes needed from the metadata
3. Fetch individual child nodes with `get_design_context(fileKey=":fileKey", nodeId=":childNodeId")`

### Step 3: Capture Visual Reference

Run `get_screenshot` with the same file key and node ID for a visual reference.

```
get_screenshot(fileKey=":fileKey", nodeId="1-2")
```

This screenshot serves as the source of truth for visual validation. Keep it accessible throughout implementation.

### Step 4: Download Required Assets

Download any assets (images, icons, SVGs) returned by the Figma MCP server.

**IMPORTANT:** Follow these asset rules:

- If the Figma MCP server returns a `localhost` source for an image or SVG, use that source directly
- DO NOT import or add new icon packages - all assets should come from the Figma payload
- DO NOT use or create placeholders if a `localhost` source is provided
- Assets are served through the Figma MCP server's built-in assets endpoint

### Step 5: Translate to Project Conventions

Translate the Figma output into this project's framework, styles, and conventions.

**Key principles:**

- Treat the Figma MCP output (typically React + Tailwind) as a representation of design and behavior, not as final code style
- Replace Tailwind utility classes with the project's preferred utilities or design system tokens
- Reuse existing components (buttons, inputs, typography, icon wrappers) instead of duplicating functionality
- Use the project's color system, typography scale, and spacing tokens consistently
- Respect existing routing, state management, and data-fetch patterns

### Step 6: Achieve 1:1 Visual Parity

Strive for pixel-perfect visual parity with the Figma design.

**Guidelines:**

- Prioritize Figma fidelity to match designs exactly
- Avoid hardcoded values - use design tokens from Figma where available
- When conflicts arise between design system tokens and Figma specs, prefer design system tokens but adjust spacing or sizes minimally to match visuals
- Follow WCAG requirements for accessibility
- Add component documentation as needed

### Step 7: Validate Against Figma

Before marking complete, validate the final UI against the Figma screenshot.

**Validation checklist:**

- [ ] Layout matches (spacing, alignment, sizing)
- [ ] Typography matches (font, size, weight, line height)
- [ ] Colors match exactly
- [ ] Interactive states work as designed (hover, active, disabled)
- [ ] Responsive behavior follows Figma constraints
- [ ] Assets render correctly
- [ ] Accessibility standards met

## Implementation Rules

### Component Organization

- Place UI components in the project's designated design system directory
- Follow the project's component naming conventions
- Avoid inline styles unless truly necessary for dynamic values

### Design System Integration

- ALWAYS use components from the project's design system when possible
- Map Figma design tokens to project design tokens
- When a matching component exists, extend it rather than creating a new one
- Document any new components added to the design system

### Code Quality

- Avoid hardcoded values - extract to constants or design tokens
- Keep components composable and reusable
- Add TypeScript types for component props
- Follow the project's comment policy (see root `CLAUDE.md` — this repo defaults to writing no comments)

## Examples

### Example 1: Implementing a Button Component

User says: "Implement this Figma button component: https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15"

**Actions:**

1. Parse URL to extract fileKey=`kL9xQn2VwM8pYrTb4ZcHjF` and nodeId=`42-15`
2. Run `get_design_context(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")`
3. Run `get_screenshot(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")` for visual reference
4. Download any button icons from the assets endpoint
5. Check if project has existing button component
6. If yes, extend it with new variant; if no, create new component using project conventions
7. Map Figma colors to project design tokens (e.g., `primary-500`, `primary-hover`)
8. Validate against screenshot for padding, border radius, typography

**Result:** Button component matching Figma design, integrated with project design system.

### Example 2: Building a Dashboard Layout

User says: "Build this dashboard: https://figma.com/design/pR8mNv5KqXzGwY2JtCfL4D/Dashboard?node-id=10-5"

**Actions:**

1. Parse URL to extract fileKey=`pR8mNv5KqXzGwY2JtCfL4D` and nodeId=`10-5`
2. Run `get_metadata(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")` to understand the page structure
3. Identify main sections from metadata (header, sidebar, content area, cards) and their child node IDs
4. Run `get_design_context(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId=":childNodeId")` for each major section
5. Run `get_screenshot(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")` for the full page
6. Download all assets (logos, icons, charts)
7. Build layout using project's layout primitives
8. Implement each section using existing components where possible
9. Validate responsive behavior against Figma constraints

**Result:** Complete dashboard matching Figma design with responsive layout.

## Best Practices

### Always Start with Context

Never implement based on assumptions. Always fetch `get_design_context` and `get_screenshot` first.

### Incremental Validation

Validate frequently during implementation, not just at the end. This catches issues early.

### Document Deviations

If you must deviate from the Figma design (e.g., for accessibility or technical constraints), document why in the Mapping Report.

### Reuse Over Recreation

Always check for existing components before creating new ones. Consistency across the codebase is more important than exact Figma replication.

### Design System First

When in doubt, prefer the project's design system patterns over literal Figma translation.

## Common Issues and Solutions

### Issue: Figma output is truncated

**Cause:** The design is too complex or has too many nested layers to return in a single response.
**Solution:** Use `get_metadata` to get the node structure, then fetch specific nodes individually with `get_design_context`.

### Issue: Design doesn't match after implementation

**Cause:** Visual discrepancies between the implemented code and the original Figma design.
**Solution:** Compare side-by-side with the screenshot from Step 3. Check spacing, colors, and typography values in the design context data.

### Issue: Assets not loading

**Cause:** The Figma MCP server's assets endpoint is not accessible or the URLs are being modified.
**Solution:** Verify the Figma MCP server's assets endpoint is accessible. The server serves assets at `localhost` URLs. Use these directly without modification.

### Issue: Design token values differ from Figma

**Cause:** The project's design system tokens have different values than those specified in the Figma design.
**Solution:** When project tokens differ from Figma values, prefer project tokens for consistency but adjust spacing/sizing to maintain visual fidelity.

## Understanding Design Implementation

The Figma implementation workflow establishes a reliable process for translating designs to code:

**For designers:** Confidence that implementations will match their designs with pixel-perfect accuracy.
**For developers:** A structured approach that eliminates guesswork and reduces back-and-forth revisions.
**For teams:** Consistent, high-quality implementations that maintain design system integrity.

By following this workflow, you ensure that every Figma design is implemented with the same level of care and attention to detail.

## Additional Resources

- [Figma MCP Server Documentation](https://developers.figma.com/docs/figma-mcp-server/)
- [Figma MCP Server Tools and Prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [Figma Variables and Design Tokens](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)

---

# 프로젝트 특화 규칙

위 base workflow의 Step 5(Translate to Project Conventions) / Step 6(Visual Parity) / Step 7(Validate)에서 *"this project's design system"*에 해당하는 구체적인 결정 규칙. base workflow 본문과 충돌하면 아래 규칙이 우선한다.

## Priority when sources conflict

**실제 코드 > `references/` > Figma MCP raw.**

Figma MCP가 뱉는 pseudo-code는 menu이지 meal이 아니다. prop 이름 (`onClick`/`clamp` 등)은 TS compile이 잡지만 **variant/value 선택**은 못 잡는다 — `DamoaText variant="BodyMedium"`과 `"LabelLarge"`는 둘 다 valid, `DamoaTag theme="light"`와 `"dark"`도 둘 다 valid. Figma와 다른 값을 골라도 타입 에러 없이 시각만 어긋난다. Vesper 컴포넌트를 쓰기 직전에 `libs/ui/shared/vesper/customer/src/<Component>/`의 실제 파일에서 **props 시그니처와 variant 목록**을 확인한다.

## Vesper rules

Vesper 컴포넌트/토큰을 쓰기 직전 적용하는 결정 규칙. 변환표·매핑 샘플은 references 파일을 연다.

- **Typography**: `DamoaText` 우선. variant는 `libs/ui/shared/vesper/foundation/src/Typography.ts`에 실제 존재하는 이름만 사용. 변환 규칙·variant 표 → `references/typography.md`.
- **Color**: raw hex/rgba보다 `VesperColors` 우선 (`import { VesperColors } from '@rapportlabs/vesper-foundation'`). 매핑 불가 시 raw 대신 가장 가까운 semantic token + fallback 사유 기록. 토큰 표 → `references/color.md`.
- **Layout / Spacing**: Auto Layout → `VStack`/`HStack` 우선. Vesper 컴포넌트가 자체 spacing을 가지면 컴포넌트 props 우선, 외부 Spacer로 이중 간격 만들지 않기. Tailwind→Vesper 변환표 → `references/spacing.md`.
- **Components**: `div`/`button` 재구현 전에 `libs/ui/shared/vesper/customer/src/`에서 존재 확인. Code Connect 미연결 피처 컴포넌트는 `libs/ui/shared/screen/` 또는 `libs/ui/shared/component/` 아래 기존 구현을 먼저 grep.
- **Props 일치 강제**: 컴포넌트 이름만 맞고 props API가 틀리면 실패로 간주. 실제 props는 `libs/ui/shared/vesper/customer/src/<Component>/` 소스로 확인.

### Styling 제약

- `@emotion/styled`만 사용. `@linaria/react` 같은 새 runtime styling 의존성 도입 금지.
- **Filler 금지**: Figma에 없는 wrapper `<div>`, `Spacer`, padding을 임의로 추가하지 않는다. Vesper 컴포넌트는 자체 spacing을 가진 경우가 많아 외부 Spacer가 이중 간격을 만든다. 추가가 필요하면 Mapping Report에 "의도: [이유]"로 근거를 적은 뒤에만. 접근성 속성 (`aria-*`, `role`, `tabIndex`) 은 예외.

## Context Layer

디자이너는 Figma에서 UI 프레임 옆에 **context card / Comment 주석 / sticky note** 인스턴스로 기능 spec, edge case, 상태 전이 조건을 남긴다. UI 구현 대상은 아니지만 **구현 판단에 필요한 PRD-성격 정보**다. 이 단계는 Figma 경계 **내부**의 이 인스턴스만 추출한다. PRD 문서 본문이 필요한 경우 사용자가 URL을 직접 제공하거나 상위 스킬(예: `rapportlabs:design-to-code-context-doc`)이 처리한다.

### 인식 → 재호출 → Attach

1. **감지**: 섹션 단위 `get_design_context` 응답에서 `name`이 `Comment 주석` / `context card` / `sticky` / `spec note`로 시작하거나 정확히 일치하는 `<instance>` 수집.
2. **재호출**: 각 id로 `get_design_context`를 개별 호출해 텍스트 추출. **"UI 구현에 필요 없다"고 판단해 skip하지 않는다.**
3. **좌표 기반 attach**: 중심점 거리가 최소인 UI 노드에 붙인다. 휴리스틱 상세 `references/context-card.md`.
4. 결과를 Mapping Report의 Behavior/State/Spec 축에 verbatim으로 기록.

## Mapping Report

Step 5 / Step 6에서 어떤 Figma 노드가 어떤 코드 컴포넌트·토큰으로 매핑됐는지 표로 기록한다. 해당 없는 섹션은 표 전체 생략 가능.

### 1. UI 매핑 (각 행에 `status` 컬럼)

| Figma node                     | Code target                          | status   |
| ------------------------------ | ------------------------------------ | -------- |
| 7996:150311 / 전체보기 Title   | `DamoaText variant="HeadingMedium"`  | matched  |
| 7996:150420 / 16px gray border | `VesperColors.gray300` (가장 근사치) | fallback |

`status` 값:

- `matched` — Vesper 코드/문서에서 확인된 정확한 매핑
- `fallback` — 정확한 매핑은 없지만 대체 토큰/컴포넌트 선택
- `missing` — Vesper에 대응 항목 없음 → 새 구현 또는 사용자 판단 필요
- `manual-check` — Figma 응답만으로 판단 불가

### 2. Behavior / State / Spec 축 (Context Layer 결과)

| Source (node id / name)    | Attached UI node              | Content (verbatim)                                    | Category | Status   |
| -------------------------- | ----------------------------- | ----------------------------------------------------- | -------- | -------- |
| 7996:150313 / context card | 7996:150311 / 전체보기 Screen | "전체보기 진입 시 디폴트 랜딩 기준으로 동일하게 랜딩" | state    | captured |

- **Category**: `behavior` / `state` / `edge-case` / `policy` / `question`. 불확실 시 `behavior`.
- **Status**: `captured` (텍스트 추출 성공) / `unresolved` (추출 실패 또는 의미 모호) / `out-of-scope` (구현 범위 밖).

## Validation

Step 7 체크리스트(layout / typography / colors / states / accessibility) 그대로 따르되 이 레포 조정점:

1. **TS compile** — `pnpm nx run <app>:compile`. 변경된 앱만.
2. **Mapping Report self-check** — 추측으로 쓴 Vesper prop은 validation pass로 치지 않는다. Context Layer 섹션이 비었는데 sparse 응답에 `Comment 주석` / `context card` 감지됐으면 Context Layer 재실행.
3. **Screenshot은 default off** — pixel-perfect 명시 요구 또는 레이아웃 중심 변경일 때만. 그 외엔 proactively 찍지 않는다. 스크린샷으로만 판단 가능하다고 느껴지면 대개 Mapping Report의 `manual-check` 행을 놓친 것.

스킵한 validation은 사유와 함께 보고한다.
