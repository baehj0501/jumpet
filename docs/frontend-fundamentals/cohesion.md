# Cohesion (응집도)

> "수정되어야 할 코드가 함께 수정되는가?"

관련 코드는 함께, 무관한 코드는 분리합니다. 한 부분 수정이 다른 부분의 오류를 야기하지 않아야 합니다.

---

## 핵심 전략

### 함께 수정되는 코드를 가까이 배치

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

### 매직 넘버 제거
- 의미 있는 상수명으로 추출
- 변경 시 한 곳만 수정하도록

### Form 관련 응집도
- 유효성 검사 로직을 Form 가까이에 배치

---

## 상세 예시

### 1. Feature 기반 구조

관련 코드가 분산되면 변경 시 여러 파일을 수정해야 합니다.

#### Before: 관련 코드 분산
```
src/
├── constants/
│   ├── animation.ts        # ANIMATION_DELAY = 300
│   ├── validation.ts       # MAX_NAME_LENGTH = 20
│   └── api.ts              # API_TIMEOUT = 5000
├── utils/
│   ├── animation.ts        # delay 함수
│   ├── validation.ts       # validate 함수들
│   └── api.ts              # fetch wrapper
└── components/
    ├── LikeButton.tsx      # animation 상수 + delay 유틸 사용
    ├── UserForm.tsx        # validation 상수 + validate 유틸 사용
    └── ProductList.tsx     # api 상수 + fetch 유틸 사용
```

#### After: Feature 기반 구조
```
src/features/
├── like/
│   ├── LikeButton.tsx
│   ├── constants.ts        # ANIMATION_DELAY = 300
│   └── utils.ts            # delay 함수
├── user/
│   ├── UserForm.tsx
│   ├── validation.ts       # MAX_NAME_LENGTH + validate 함수
│   └── types.ts
└── product/
    ├── ProductList.tsx
    ├── api.ts              # API_TIMEOUT + fetch 함수
    └── types.ts
```

---

### 2. 폼 유효성 검사 응집도

폼과 유효성 검사 로직은 함께 있어야 합니다.

#### Before: 유효성 검사 분리
```typescript
// validators/userValidator.ts (폼과 멀리 떨어짐)
export const userValidators = {
  name: (value: string) => value.length > 0 && value.length < 20,
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  age: (value: number) => value >= 18 && value <= 99,
};

// components/UserForm.tsx
import { userValidators } from '../validators/userValidator';
// 유효성 검사 규칙을 보려면 다른 파일로 이동해야 함
```

#### After: 폼과 함께 배치
```typescript
// features/user/UserForm.tsx
const VALIDATION_RULES = {
  name: {
    required: 'Name is required',
    maxLength: { value: 20, message: 'Name must be less than 20 characters' },
  },
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format',
    },
  },
  age: {
    min: { value: 18, message: 'Must be 18 or older' },
    max: { value: 99, message: 'Must be 99 or younger' },
  },
};

export function UserForm() {
  const { control } = useForm();

  return (
    <form>
      <Controller
        name="name"
        control={control}
        rules={VALIDATION_RULES.name}
        render={({ field }) => <Input {...field} />}
      />
      {/* ... */}
    </form>
  );
}
```

---

### 3. 컴포넌트 내부 상수

컴포넌트에서만 사용하는 상수는 컴포넌트 파일에 둡니다.

#### Before
```typescript
// constants/productCard.ts
export const PRODUCT_CARD_WIDTH = 200;
export const PRODUCT_CARD_HEIGHT = 300;
export const PRODUCT_IMAGE_RATIO = 0.6;

// components/ProductCard.tsx
import { PRODUCT_CARD_WIDTH, PRODUCT_CARD_HEIGHT, PRODUCT_IMAGE_RATIO } from '../constants/productCard';
```

#### After
```typescript
// components/ProductCard.tsx
const CARD_WIDTH = 200;
const CARD_HEIGHT = 300;
const IMAGE_RATIO = 0.6;

export function ProductCard({ product }: Props) {
  const imageHeight = CARD_HEIGHT * IMAGE_RATIO;
  // ...
}
```

---

## References

- [Frontend Fundamentals](https://frontend-fundamentals.com)
