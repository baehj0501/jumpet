# Readability (가독성)

> "코드가 얼마나 읽기 쉬운가?"

독자가 한 번에 고려해야 하는 맥락을 줄이고, 위에서 아래로 자연스럽게 흐르게 합니다.

---

## 핵심 전략

### 맥락 줄이기

- 동시에 실행되는 코드 분리
- 구현 세부사항 추상화
- 함수 분해로 복잡도 낮추기

### 이름 붙이기

- 복잡한 조건에 명확한 이름 부여
- 매직 넘버를 상수로 추출

```typescript
// ❌ Bad: 매직 넘버 + 조건 의미 불명확
if (user.age >= 18 && user.status === 1) {
    await delay(300)
}

// ✅ Good: 이름으로 의도 전달
const ANIMATION_DELAY_MS = 300
const isAdult = user.age >= 18
const isActive = user.status === UserStatus.ACTIVE

if (isAdult && isActive) {
    await delay(ANIMATION_DELAY_MS)
}
```

### 위에서 아래로 흐르기

- 시점 이동 최소화
- 삼항 연산자 단순화

---

## 상세 예시

### 1. 조건에 이름 붙이기

복잡한 조건식에 명확한 이름을 부여하면 의도가 드러납니다.

#### Before

```typescript
const matchedProducts = products.filter((product) => {
    return product.categories.some((category) => {
        return (
            category.id === targetCategory.id && product.prices.some((price) => price >= minPrice && price <= maxPrice)
        )
    })
})
```

#### After

```typescript
const matchedProducts = products.filter((product) => {
    return product.categories.some((category) => {
        const isSameCategory = category.id === targetCategory.id
        const isPriceInRange = product.prices.some((price) => price >= minPrice && price <= maxPrice)

        return isSameCategory && isPriceInRange
    })
})
```

---

### 2. 매직 넘버 제거

숫자에 의미 있는 이름을 부여합니다.

#### Before

```typescript
async function onLikeClick() {
    await postLike(url)
    await delay(300)
    await refetchPostLike()
}
```

#### After

```typescript
const ANIMATION_DELAY_MS = 300

async function onLikeClick() {
    await postLike(url)
    await delay(ANIMATION_DELAY_MS)
    await refetchPostLike()
}
```

---

### 3. Early Return 패턴

중첩을 줄이고 예외 케이스를 먼저 처리합니다.

#### Before

```typescript
function processOrder(order: Order) {
    if (order) {
        if (order.items.length > 0) {
            if (order.status === 'pending') {
                // 실제 로직
                return calculateTotal(order)
            } else {
                throw new Error('Order already processed')
            }
        } else {
            throw new Error('Order has no items')
        }
    } else {
        throw new Error('Order not found')
    }
}
```

#### After

```typescript
function processOrder(order: Order) {
    if (!order) {
        throw new Error('Order not found')
    }

    if (order.items.length === 0) {
        throw new Error('Order has no items')
    }

    if (order.status !== 'pending') {
        throw new Error('Order already processed')
    }

    return calculateTotal(order)
}
```

---

### 4. 함수 분해

하나의 함수가 너무 많은 일을 하면 분해합니다.

#### Before

```typescript
async function submitForm(data: FormData) {
    // 유효성 검사
    if (!data.name || data.name.length < 2) {
        setError('name', 'Name must be at least 2 characters')
        return
    }
    if (!data.email || !data.email.includes('@')) {
        setError('email', 'Invalid email')
        return
    }

    // API 호출
    const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(data),
    })

    // 응답 처리
    if (response.ok) {
        const result = await response.json()
        showSuccess(result.message)
        resetForm()
    } else {
        showError('Submission failed')
    }
}
```

#### After

```typescript
async function submitForm(data: FormData) {
    const validationError = validateFormData(data)
    if (validationError) {
        setError(validationError.field, validationError.message)
        return
    }

    const result = await submitToApi(data)
    handleSubmitResult(result)
}

function validateFormData(data: FormData): ValidationError | null {
    if (!data.name || data.name.length < 2) {
        return { field: 'name', message: 'Name must be at least 2 characters' }
    }
    if (!data.email || !data.email.includes('@')) {
        return { field: 'email', message: 'Invalid email' }
    }
    return null
}
```

---

### 5. 삼항 연산자 단순화

복잡한 삼항 연산자는 if문이나 함수로 분리합니다.

#### Before

```typescript
const message =
    status === 'success'
        ? count > 0
            ? `${count}개 완료`
            : '완료 (0개)'
        : status === 'pending'
          ? '처리 중...'
          : '오류 발생'
```

#### After

```typescript
function getMessage(status: Status, count: number): string {
    if (status === 'success') {
        return count > 0 ? `${count}개 완료` : '완료 (0개)'
    }
    if (status === 'pending') {
        return '처리 중...'
    }
    return '오류 발생'
}

const message = getMessage(status, count)
```

---

## References

- [Frontend Fundamentals](https://frontend-fundamentals.com)
