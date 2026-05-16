# Spacing 변환 규칙

Figma MCP 응답에서 spacing 관련 Tailwind 클래스를 파싱하여 Vesper에 적용하는 규칙입니다.

---

## Tailwind 클래스 → Vesper 변환

### Gap (요소 간 간격)

| Tailwind 클래스 | CSS 속성  | Vesper 적용                                |
| --------------- | --------- | ------------------------------------------ |
| `gap-[2px]`     | gap: 2px  | `rowGap: 2` 또는 `<Spacer height={2} />`   |
| `gap-[4px]`     | gap: 4px  | `rowGap: 4` 또는 `<Spacer height={4} />`   |
| `gap-[8px]`     | gap: 8px  | `rowGap: 8` 또는 `<Spacer height={8} />`   |
| `gap-[12px]`    | gap: 12px | `rowGap: 12` 또는 `<Spacer height={12} />` |
| `gap-[16px]`    | gap: 16px | `rowGap: 16` 또는 `<Spacer height={16} />` |

### Padding

| Tailwind 클래스 | CSS 속성                 | Vesper 적용                         |
| --------------- | ------------------------ | ----------------------------------- |
| `p-[12px]`      | padding: 12px            | `padding: 12`                       |
| `p-[16px]`      | padding: 16px            | `padding: 16`                       |
| `py-[8px]`      | padding-top/bottom: 8px  | `paddingTop: 8, paddingBottom: 8`   |
| `px-[16px]`     | padding-left/right: 16px | `paddingLeft: 16, paddingRight: 16` |
| `pt-[8px]`      | padding-top: 8px         | `paddingTop: 8`                     |
| `pb-[8px]`      | padding-bottom: 8px      | `paddingBottom: 8`                  |
| `pl-[60px]`     | padding-left: 60px       | `paddingLeft: 60`                   |
| `pr-[16px]`     | padding-right: 16px      | `paddingRight: 16`                  |

### Margin

| Tailwind 클래스 | CSS 속성           | Vesper 적용       |
| --------------- | ------------------ | ----------------- |
| `mt-[4px]`      | margin-top: 4px    | `marginTop: 4`    |
| `mb-[8px]`      | margin-bottom: 8px | `marginBottom: 8` |
| `ml-[16px]`     | margin-left: 16px  | `marginLeft: 16`  |
| `mr-[16px]`     | margin-right: 16px | `marginRight: 16` |

---

## Figma Variables 사용 시 (권장)

Figma에서 Variables로 spacing을 관리하면 MCP 응답에 토큰명이 포함됩니다.

### 응답 형식

```
gap-[var(--spacer/spacer-2,2px)]
py-[var(--spacer/spacer-4,4px)]
```

### 변환 테이블

| Figma 응답                           | 토큰명    | 값   | Vesper 적용              |
| ------------------------------------ | --------- | ---- | ------------------------ |
| `gap-[var(--spacer/spacer-2,2px)]`   | spacer-2  | 2px  | `<Spacer height={2} />`  |
| `gap-[var(--spacer/spacer-4,4px)]`   | spacer-4  | 4px  | `<Spacer height={4} />`  |
| `gap-[var(--spacer/spacer-8,8px)]`   | spacer-8  | 8px  | `<Spacer height={8} />`  |
| `gap-[var(--spacer/spacer-12,12px)]` | spacer-12 | 12px | `<Spacer height={12} />` |
| `gap-[var(--spacer/spacer-16,16px)]` | spacer-16 | 16px | `<Spacer height={16} />` |

### Variables의 장점

1. **토큰명 제공**: `spacer-2`라는 시맨틱 정보 포함
2. **fallback 값 보장**: 실제 픽셀 값도 함께 제공
3. **일관성 강제**: 같은 토큰은 같은 값 보장

---

## Step 2 출력 형식

figma-to-code 워크플로우 Step 2에서 spacing을 테이블로 출력합니다.

```markdown
### 스페이싱 토큰

| 위치            | Tailwind 클래스     | 값        | Vesper 적용                         |
| --------------- | ------------------- | --------- | ----------------------------------- |
| 태그→브랜드명   | gap-[4px]           | 4px       | `<Spacer height={4} />`             |
| 브랜드명→상품명 | gap-[2px]           | 2px       | `<Spacer height={2} />`             |
| 상품명→옵션     | gap-[2px]           | 2px       | `<Spacer height={2} />`             |
| 텍스트→버튼     | gap-[12px]          | 12px      | `<Spacer height={12} />`            |
| 카드 내부       | p-[12px]            | 12px      | `padding: 12`                       |
| 외부 컨테이너   | pl-[60px] pr-[16px] | 60px/16px | `paddingLeft: 60, paddingRight: 16` |
```

---

## Vesper 적용 패턴

### VStack에서 gap 사용

```tsx
// styled 컴포넌트에서
const Container = styled(VStack)({
  rowGap: 4,  // gap-[4px] → rowGap: 4
})

// 또는 prop으로
<VStack spacing={4}>
  ...
</VStack>
```

### Spacer 컴포넌트 사용

```tsx
import { Spacer } from '@damoa-frontend/ui/shared/vesper'

// gap-[4px] 대신 Spacer 사용
<DamoaTag ... />
<Spacer height={4} />
<DamoaText ... />
```

### Padding 적용

```tsx
const Card = styled(VStack)({
    // p-[12px]
    padding: 12,
})

const Container = styled(VStack)({
    // pl-[60px] pr-[16px] py-[8px]
    paddingLeft: 60,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
})
```

---

## 사용 예시 (CsChatProductCard)

```tsx
// Figma MCP 응답에서 추출한 spacing
// gap-[4px]: 태그→브랜드명
// gap-[2px]: 브랜드명→상품명
// gap-[2px]: 상품명→옵션
// gap-[12px]: 옵션→버튼

<DamoaTag ... />
<Spacer height={4} />  {/* 태그→브랜드명 */}

<DamoaText variant="LabelXSmall">브랜드명</DamoaText>
<Spacer height={2} />  {/* 브랜드명→상품명 */}

<DamoaText variant="SpecificCXChatListCardProductName">상품명</DamoaText>
<Spacer height={2} />  {/* 상품명→옵션 */}

<DamoaText variant="SubLabelXSmall">옵션</DamoaText>
<Spacer height={12} /> {/* 옵션→버튼 */}

<DamoaButton ... />
```

---

## 주의사항

1. **값 정확성**: Figma MCP 응답의 spacing 값을 그대로 사용 (임의 변경 금지)
2. **일관성**: 같은 컨텍스트에서는 같은 spacing 값 사용
3. **테이블 출력 필수**: Step 2에서 spacing 테이블을 반드시 출력하여 누락 방지
