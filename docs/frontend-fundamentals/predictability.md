# Predictability (예측 가능성)

> "함수/컴포넌트의 동작을 얼마나 예상할 수 있는가?"

이름, 파라미터, 반환값만 보고도 의도를 파악할 수 있어야 합니다.

---

## 핵심 전략

### 이름 중복 방지

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

### 일관된 반환 타입

```typescript
// ❌ Bad: 때로는 값, 때로는 undefined
function findUser(id: string) {
    const user = users.find((u) => u.id === id)
    return user // User | undefined
}

// ✅ Good: 명시적 Result 타입
function checkIsNameValid(name: string): ValidationResult {
    if (name.length === 0) {
        return { ok: false, reason: 'Name cannot be empty.' }
    }
    return { ok: true }
}
```

### 숨겨진 로직 명시화

- 함수명에 부가 동작 드러내기 (예: `getWithAuth`)
- 예상치 못한 side effect 피하기

---

## 상세 예시

### 1. 명확한 네이밍으로 충돌 방지

라이브러리와 커스텀 구현의 이름이 충돌하면 혼란을 야기합니다.

#### Before

```typescript
// httpService.ts
import { http } from '@some-library/http'

// 라이브러리와 같은 이름 사용 - 혼란 유발
export const http = {
    async get(url: string) {
        const token = await fetchToken()
        return http.get(url, {
            // 어떤 http인지 불명확
            headers: { Authorization: `Bearer ${token}` },
        })
    },
}
```

#### After

```typescript
// httpService.ts
import { http as httpLibrary } from '@some-library/http'

// 명확하게 구분되는 이름
export const httpService = {
    async getWithAuth(url: string) {
        const token = await fetchToken()
        return httpLibrary.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        })
    },
}
```

```typescript
// 사용하는 쪽
import { httpService } from './httpService'

export async function fetchUser() {
    // 함수명에서 인증 로직이 포함됨을 알 수 있음
    return await httpService.getWithAuth('/api/user')
}
```

---

### 2. 일관된 반환 타입

유사한 함수들은 동일한 형태의 결과를 반환해야 합니다.

#### Before

```typescript
// 함수마다 반환 형태가 다름
function validateName(name: string): boolean {
    return name.length > 0 && name.length < 20
}

function validateAge(age: number): string | null {
    if (age < 18) return 'Too young'
    if (age > 99) return 'Invalid age'
    return null
}

function validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email.includes('@')) {
        return { valid: false, error: 'Invalid email' }
    }
    return { valid: true }
}
```

#### After

```typescript
// 일관된 ValidationResult 타입
interface ValidationResult {
    ok: boolean
    reason?: string
}

function checkIsNameValid(name: string): ValidationResult {
    if (name.length === 0) {
        return { ok: false, reason: 'Name cannot be empty.' }
    }
    if (name.length >= 20) {
        return { ok: false, reason: 'Name cannot be longer than 20 characters' }
    }
    return { ok: true }
}

function checkIsAgeValid(age: number): ValidationResult {
    if (!Number.isInteger(age)) {
        return { ok: false, reason: 'Age must be an integer.' }
    }
    if (age < 18) {
        return { ok: false, reason: 'Age must be 18 or older.' }
    }
    if (age > 99) {
        return { ok: false, reason: 'Age must be 99 or younger.' }
    }
    return { ok: true }
}

function checkIsEmailValid(email: string): ValidationResult {
    if (!email.includes('@')) {
        return { ok: false, reason: 'Invalid email format.' }
    }
    return { ok: true }
}
```

---

### 3. 숨겨진 Side Effect 피하기

함수 이름에서 예상하지 못한 동작을 하면 안 됩니다.

#### Before

```typescript
// getUserName인데 API 호출과 캐싱까지 함
function getUserName(userId: string): string {
    // 1. 캐시 확인
    const cached = cache.get(userId)
    if (cached) return cached.name

    // 2. API 호출 (Side effect!)
    const user = await fetchUser(userId)

    // 3. 캐시 저장 (Side effect!)
    cache.set(userId, user)

    // 4. Analytics 전송 (Side effect!)
    analytics.track('user_fetched', { userId })

    return user.name
}
```

#### After

```typescript
// 이름에서 동작을 명확히 드러냄
async function fetchAndCacheUser(userId: string): Promise<User> {
    const cached = cache.get(userId)
    if (cached) return cached

    const user = await fetchUser(userId)
    cache.set(userId, user)
    return user
}

// 단순한 조회 함수는 정말 단순하게
function getUserName(user: User): string {
    return user.name
}

// Analytics는 별도로 호출
function trackUserFetch(userId: string): void {
    analytics.track('user_fetched', { userId })
}
```

---

### 4. 함수 시그니처로 의도 전달

파라미터와 반환 타입만 보고 동작을 예측할 수 있어야 합니다.

#### Before

```typescript
// 무엇을 하는지 불명확
function process(data: any): any {
  // ...
}

// 너무 많은 역할
function handleUser(user: User, action: string, options?: any): any {
  if (action === 'create') { ... }
  if (action === 'update') { ... }
  if (action === 'delete') { ... }
}
```

#### After

```typescript
// 명확한 입출력
function formatPrice(amount: number, currency: Currency): string {
  // ...
}

// 단일 책임
function createUser(data: CreateUserInput): Promise<User> { ... }
function updateUser(id: string, data: UpdateUserInput): Promise<User> { ... }
function deleteUser(id: string): Promise<void> { ... }
```

---

### 5. 옵셔널 파라미터의 기본값 명시

기본 동작이 예측 가능해야 합니다.

#### Before

```typescript
// 기본값이 불명확
function fetchData(url: string, options?: RequestOptions) {
    const method = options?.method // undefined면 어떻게 되지?
    const timeout = options?.timeout // 기본 타임아웃은?
    // ...
}
```

#### After

```typescript
const DEFAULT_REQUEST_OPTIONS: Required<RequestOptions> = {
    method: 'GET',
    timeout: 5000,
    retries: 3,
}

function fetchData(url: string, options?: Partial<RequestOptions>) {
    const { method, timeout, retries } = {
        ...DEFAULT_REQUEST_OPTIONS,
        ...options,
    }
    // 이제 모든 값이 명확함
}
```

---

## References

- [Frontend Fundamentals](https://frontend-fundamentals.com)
