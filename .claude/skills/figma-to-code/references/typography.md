# Typography 변환 규칙

Figma 텍스트 스타일을 Vesper DamoaText variant로 변환하는 규칙입니다.

---

## 변환 로직

1. 슬래시(`/`) 제거
2. 각 세그먼트를 PascalCase로 연결
3. 결과를 Vesper variant로 사용

**예시**:
```
Figma: Specific/CXChat/ListCardProductName
  ↓ 슬래시 제거 + PascalCase 연결
Vesper: SpecificCXChatListCardProductName
```

---

## 일반 스타일 (General Variants)

### Display 계열 (큰 제목)
| Figma 스타일 | Vesper variant | fontWeight | 용도 |
|-------------|--------------|------------|------|
| Display/Large | `DisplayLarge` | bold | 메인 타이틀 |
| Display/Medium | `DisplayMedium` | bold | 서브 타이틀 |
| Display/Small | `DisplaySmall` | bold | 작은 타이틀 |
| Display/XSmall | `DisplayXSmall` | bold | 최소 타이틀 |

### Heading 계열 (섹션 제목)
| Figma 스타일 | Vesper variant | fontWeight | 용도 |
|-------------|--------------|------------|------|
| Heading/XXLarge | `HeadingXXLarge` | 600 | 페이지 제목 |
| Heading/XLarge | `HeadingXLarge` | 600 | 큰 섹션 제목 |
| Heading/Large | `HeadingLarge` | 600 | 섹션 제목 |
| Heading/Medium | `HeadingMedium` | 600 | 중간 제목 |
| Heading/Small | `HeadingSmall` | 600 | 작은 제목 |
| Heading/XSmall | `HeadingXSmall` | 600 | 최소 제목 |

### Label 계열 (강조 텍스트)
| Figma 스타일 | Vesper variant | fontWeight | 용도 |
|-------------|--------------|------------|------|
| Label/XLarge | `LabelXLarge` | 600 | 큰 강조 |
| Label/Large | `LabelLarge` | 600 | 강조 텍스트 |
| Label/Medium | `LabelMedium` | 600 | 버튼, 탭 |
| Label/Small | `LabelSmall` | 600 | 작은 강조 |
| Label/XSmall | `LabelXSmall` | 600 | 브랜드명, 태그 |

### SubLabel 계열 (중간 강조)
| Figma 스타일 | Vesper variant | fontWeight | 용도 |
|-------------|--------------|------------|------|
| SubLabel/XLarge | `SubLabelXLarge` | 500 | 큰 중간 강조 |
| SubLabel/Large | `SubLabelLarge` | 500 | 중간 강조 |
| SubLabel/Medium | `SubLabelMedium` | 500 | 선택지 텍스트 |
| SubLabel/Small | `SubLabelSmall` | 500 | 작은 중간 강조 |
| SubLabel/XSmall | `SubLabelXSmall` | 500 | 옵션 텍스트 |

### Body 계열 (본문)
| Figma 스타일 | Vesper variant | fontWeight | 용도 |
|-------------|--------------|------------|------|
| Body/XLarge | `BodyXLarge` | 400 | 큰 본문 |
| Body/Large | `BodyLarge` | 400 | 긴 본문 |
| Body/Medium | `BodyMedium` | 400 | 일반 본문 |
| Body/Small | `BodySmall` | 400 | 발신자명, 설명 |
| Body/XSmall | `BodyXSmall` | 400 | 최소 본문 |

---

## 시맨틱 스타일 (Specific Variants)

### CXChat 관련
| Figma 스타일 | Vesper variant | fontWeight | size | 용도 |
|-------------|--------------|------------|------|------|
| Specific/CXChat/ListCardProductName | `SpecificCXChatListCardProductName` | 500 | 13 | 상품명 |
| Specific/CXChat/ListCardBrandName | `SpecificCXChatListCardBrandName` | 600 | 12 | 브랜드명 |

### 상품 아이템 관련
| Figma 스타일 | Vesper variant | 용도 |
|-------------|--------------|------|
| Specific/ProductItem/Brand | `SpecificProductItemBrand` | 상품 브랜드 |
| Specific/ProductItem/ProductName | `SpecificProductItemProductName` | 상품명 |
| Specific/ProductItem/Price | `SpecificProductItemPrice` | 가격 |

### 태그/버튼 관련
| Figma 스타일 | Vesper variant | 용도 |
|-------------|--------------|------|
| Specific/Tag/Small | `SpecificTagSmall` | 태그 텍스트 |
| Specific/Button/XSmall | `SpecificButtonXSmall` | 작은 버튼 |

---

## fontWeight 계층 가이드

| 계층 | fontWeight | 사용 용도 |
|-----|-----------|----------|
| Display | bold | 메인 타이틀 |
| Heading | 600 | 섹션 제목, 모달 헤더 |
| Label | 600 | 버튼, 강조, **선택 가능한 UI** |
| SubLabel | 500 | 중간 강조, **정보 표시 전용 UI** |
| Body | 400 | 본문, 설명 텍스트 |

---

## 사용 예시

```tsx
import { DamoaText } from '@damoa-frontend/ui/shared/vesper'
import { VesperColors } from '@rapportlabs/vesper-foundation'

// 브랜드명 (Label 계열 - 강조)
<DamoaText variant="LabelXSmall" color={VesperColors.TextStrong}>
  쉬즈미스
</DamoaText>

// 상품명 (Specific 계열 - 시맨틱)
<DamoaText variant="SpecificCXChatListCardProductName" color={VesperColors.TextNormal}>
  배색 단추 패턴 니트 가디건
</DamoaText>

// 옵션 (SubLabel 계열 - 중간 강조)
<DamoaText variant="SubLabelXSmall" color={VesperColors.TextSubNeutral}>
  블랙/90, 1개
</DamoaText>

// 발신자명 (Body 계열 - 본문)
<DamoaText variant="BodySmall" color={VesperColors.TextNeutral}>
  퀸잇
</DamoaText>
```
