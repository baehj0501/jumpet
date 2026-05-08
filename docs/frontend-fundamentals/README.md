# Frontend Fundamentals

> "좋은 프론트엔드 코드는 **변경하기 쉬운** 코드다."

코드를 작성하거나 리뷰할 때 다음 4가지 원칙을 적용하세요.

---

## 1. Readability (가독성)

**코드가 얼마나 읽기 쉬운가?**

독자가 한 번에 고려해야 하는 맥락을 줄이고, 위에서 아래로 자연스럽게 흐르게 합니다.

### 핵심 전략

#### 맥락 줄이기
- 동시에 실행되는 코드 분리
- 구현 세부사항 추상화
- 함수 분해로 복잡도 낮추기

#### 이름 붙이기
- 복잡한 조건에 명확한 이름 부여
- 매직 넘버를 상수로 추출

```typescript
// ❌ Bad: 매직 넘버 + 조건 의미 불명확
if (user.age >= 18 && user.status === 1) {
  await delay(300);
}

// ✅ Good: 이름으로 의도 전달
const ANIMATION_DELAY_MS = 300;
const isAdult = user.age >= 18;
const isActive = user.status === UserStatus.ACTIVE;

if (isAdult && isActive) {
  await delay(ANIMATION_DELAY_MS);
}
```

#### 위에서 아래로 흐르기
- 시점 이동 최소화
- 삼항 연산자 단순화

📚 **상세 가이드**: [readability.md](readability.md)

---

## 2. Predictability (예측 가능성)

**함수/컴포넌트의 동작을 얼마나 예상할 수 있는가?**

이름, 파라미터, 반환값만 보고도 의도를 파악할 수 있어야 합니다.

### 핵심 전략

#### 이름 중복 방지
```typescript
// ❌ Bad: 라이브러리와 이름 충돌
import { http } from "@some-library/http";
export const http = { ... }; // 혼란 유발

// ✅ Good: 명확한 구분
import { http as httpLibrary } from "@some-library/http";
export const httpService = {
  async getWithAuth(url: string) { ... }
};
```

#### 일관된 반환 타입
```typescript
// ❌ Bad: 때로는 값, 때로는 undefined
function findUser(id: string) {
  const user = users.find(u => u.id === id);
  return user; // User | undefined
}

// ✅ Good: 명시적 Result 타입
function checkIsNameValid(name: string): ValidationResult {
  if (name.length === 0) {
    return { ok: false, reason: 'Name cannot be empty.' };
  }
  return { ok: true };
}
```

#### 숨겨진 로직 명시화
- 함수명에 부가 동작 드러내기 (예: `getWithAuth`)
- 예상치 못한 side effect 피하기

📚 **상세 가이드**: [predictability.md](predictability.md)

---

## 3. Cohesion (응집도)

**수정되어야 할 코드가 함께 수정되는가?**

한 부분 수정이 다른 부분의 오류를 야기하지 않아야 합니다.

### 핵심 전략

#### 함께 수정되는 코드를 가까이 배치
```
# ❌ Bad: 관련 코드 분산
src/
├── constants/
│   └── animation.ts      # ANIMATION_DELAY
├── utils/
│   └── delay.ts          # delay 함수
└── components/
    └── LikeButton.tsx    # 위 둘을 사용

# ✅ Good: 관련 코드 함께 배치
src/components/LikeButton/
├── index.tsx
├── constants.ts          # 이 컴포넌트용 상수
└── utils.ts              # 이 컴포넌트용 유틸
```

#### 매직 넘버 제거
- 의미 있는 상수명으로 추출
- 변경 시 한 곳만 수정하도록

#### Form 관련 응집도
- 유효성 검사 로직을 Form 가까이에 배치

📚 **상세 가이드**: [cohesion.md](cohesion.md)

---

## 4. Coupling (결합도)

**코드 수정 시 영향 범위는 얼마나 되는가?**

영향이 적을수록 변경이 쉬워집니다.

### 핵심 전략

#### 책임을 개별적으로 관리
```typescript
// ❌ Bad: 높은 결합도 - 내부에서 API 직접 호출
function BannerCard({ banner }: Props) {
  const handleDelete = () => {
    fetch(`/api/banners/${banner.id}`, { method: 'DELETE' });
  };
}

// ✅ Good: 낮은 결합도 - Props로 주입
function BannerCard({ banner, onDelete }: Props) {
  return <button onClick={() => onDelete(banner.id)}>삭제</button>;
}
```

#### 중복 코드 허용 (신중하게)
- 섣부른 추상화보다 약간의 중복이 나을 수 있음
- 진짜 공통점이 확실할 때만 추상화

#### Props Drilling 제거
- Context 또는 상태 관리 도구 활용
- 단, 과도한 Context 사용은 다른 결합도 문제 유발

📚 **상세 가이드**: [coupling.md](coupling.md)

---

## 원칙 간 균형

가독성과 응집도는 상충할 수 있습니다.

| 상황 | 우선 원칙 |
|------|----------|
| 버그 발생 시 위험이 큰 코드 | **응집도** 우선 |
| 자주 읽히는 일반 코드 | **가독성** 우선 |

---

## References

- [Frontend Fundamentals](https://frontend-fundamentals.com)
