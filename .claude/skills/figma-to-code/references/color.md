# Color 변환 규칙

Figma Variables를 Vesper VesperColors 토큰으로 변환하는 규칙입니다.

---

## 변환 로직

Figma의 Variables는 이미 Code Syntax가 적용되어 있으므로 그대로 사용합니다.

```
Figma: var(--VesperColors.TextStrong)
  ↓ var(--) 제거
Vesper: VesperColors.TextStrong
```

---

## 시맨틱 색상 (Semantic Colors)

### 텍스트 색상

| Figma Variable                | Vesper 토큰                   | 용도                  |
| ----------------------------- | ----------------------------- | --------------------- |
| `VesperColors.TextStrong`     | `VesperColors.TextStrong`     | 강조 텍스트, 제목     |
| `VesperColors.TextNormal`     | `VesperColors.TextNormal`     | 일반 텍스트           |
| `VesperColors.TextNeutral`    | `VesperColors.TextNeutral`    | 발신자명, 중립 텍스트 |
| `VesperColors.TextSubNeutral` | `VesperColors.TextSubNeutral` | 옵션, 보조 텍스트     |
| `VesperColors.TextFaded`      | `VesperColors.TextFaded`      | 흐린 텍스트           |
| `VesperColors.TextDisabled`   | `VesperColors.TextDisabled`   | 비활성화 텍스트       |

### 배경 색상

| Figma Variable             | Vesper 토큰                | 용도            |
| -------------------------- | -------------------------- | --------------- |
| `VesperColors.BgBase`      | `VesperColors.BgBase`      | 기본 배경       |
| `VesperColors.BgSection`   | `VesperColors.BgSection`   | 섹션 배경       |
| `VesperColors.BgElevated`  | `VesperColors.BgElevated`  | 카드, 모달 배경 |
| `VesperColors.BgInversion` | `VesperColors.BgInversion` | 반전 배경       |

### 시스템 색상

| Figma Variable               | Vesper 토큰                  | 용도 |
| ---------------------------- | ---------------------------- | ---- |
| `VesperColors.SystemError`   | `VesperColors.SystemError`   | 에러 |
| `VesperColors.SystemWarning` | `VesperColors.SystemWarning` | 경고 |
| `VesperColors.SystemSuccess` | `VesperColors.SystemSuccess` | 성공 |
| `VesperColors.SystemInfo`    | `VesperColors.SystemInfo`    | 정보 |

---

## 기본 색상 (Base Colors)

### Gray 계열

| Figma Variable         | Vesper 토큰            | 용도           |
| ---------------------- | ---------------------- | -------------- |
| `VesperColors.Gray100` | `VesperColors.Gray100` | 봇 메시지 배경 |
| `VesperColors.Gray200` | `VesperColors.Gray200` | 카드 테두리    |
| `VesperColors.Gray600` | `VesperColors.Gray600` | 아이콘         |

### Primary 계열

| Figma Variable            | Vesper 토큰               | 용도               |
| ------------------------- | ------------------------- | ------------------ |
| `VesperColors.Primary100` | `VesperColors.Primary100` | 사용자 메시지 배경 |
| `VesperColors.Primary500` | `VesperColors.Primary500` | 브랜드 색상        |

---

## White 색상 규칙

**VesperColors.White 직접 사용 금지**

```tsx
// ❌ 금지
color: VesperColors.White

// ✅ 권장 (WhiteAlpha 사용)
color: VesperColors.WhiteAlpha100 // 완전 불투명
color: VesperColors.WhiteAlpha90 // 90% 투명도
color: VesperColors.WhiteAlpha80 // 80% 투명도
```

---

## 사용 예시

```tsx
import { VesperColors } from '@rapportlabs/vesper-foundation'

// 텍스트 색상
<DamoaText color={VesperColors.TextStrong}>강조 텍스트</DamoaText>
<DamoaText color={VesperColors.TextNeutral}>발신자명</DamoaText>

// 배경 색상
const Container = styled(VStack)({
  backgroundColor: VesperColors.BgBase,
})

// 테두리 색상
const Card = styled(VStack)({
  border: `1px solid ${VesperColors.Gray200}`,
})
```

---

## Hex 하드코딩 금지

```tsx
// ❌ 금지: raw hex 값
style={{ color: '#333333' }}
style={{ backgroundColor: '#f0f0f0' }}

// ✅ 권장: VesperColors 토큰
style={{ color: VesperColors.TextStrong }}
style={{ backgroundColor: VesperColors.Gray100 }}
```
