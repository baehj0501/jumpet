# Coupling (결합도)

> "코드 수정 시 영향 범위는 얼마나 되는가?"

모듈 간 의존성을 최소화합니다. 영향이 적을수록 변경이 쉬워집니다.

---

## 핵심 전략

### 책임을 개별적으로 관리

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

### 중복 코드 허용 (신중하게)

- 섣부른 추상화보다 약간의 중복이 나을 수 있음
- 진짜 공통점이 확실할 때만 추상화

### Props Drilling 제거

- Context 또는 상태 관리 도구 활용
- 단, 과도한 Context 사용은 다른 결합도 문제 유발

---

## 상세 예시

### 1. Props를 통한 의존성 주입

컴포넌트 내부에서 외부 의존성을 직접 호출하면 결합도가 높아집니다.

#### Before: 높은 결합도

```typescript
function BannerCard({ banner }: Props) {
  const queryClient = useQueryClient();

  // 컴포넌트가 API 호출 방식에 강하게 결합
  const handleDelete = async () => {
    await fetch(`/api/banners/${banner.id}`, { method: 'DELETE' });
    queryClient.invalidateQueries(['banners']);
    message.success('삭제되었습니다.');
  };

  return (
    <Card>
      <h3>{banner.title}</h3>
      <Button onClick={handleDelete}>삭제</Button>
    </Card>
  );
}
```

#### After: 낮은 결합도

```typescript
// BannerCard는 순수한 프레젠테이션 컴포넌트
function BannerCard({ banner, onDelete }: Props) {
  return (
    <Card>
      <h3>{banner.title}</h3>
      <Button onClick={() => onDelete(banner.id)}>삭제</Button>
    </Card>
  );
}

// 부모 컴포넌트에서 로직 관리
function BannerList() {
  const { mutate: deleteBanner } = useMutation({
    mutationFn: (id: string) => BannerApiCaller.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['banners']);
      message.success('삭제되었습니다.');
    },
  });

  return (
    <div>
      {banners.map(banner => (
        <BannerCard
          key={banner.id}
          banner={banner}
          onDelete={deleteBanner}
        />
      ))}
    </div>
  );
}
```

---

### 2. 인터페이스를 통한 추상화

구체적인 구현이 아닌 인터페이스에 의존합니다.

#### Before: 구체 구현에 의존

```typescript
// localStorage에 강하게 결합
function useUserPreferences() {
    const [prefs, setPrefs] = useState(() => {
        const stored = localStorage.getItem('prefs')
        return stored ? JSON.parse(stored) : DEFAULT_PREFS
    })

    const updatePrefs = (newPrefs: Preferences) => {
        localStorage.setItem('prefs', JSON.stringify(newPrefs))
        setPrefs(newPrefs)
    }

    return { prefs, updatePrefs }
}
```

#### After: Storage 추상화

```typescript
// storage 인터페이스 정의
interface Storage {
    get<T>(key: string): T | null
    set<T>(key: string, value: T): void
}

// 구현체들
const localStorageAdapter: Storage = {
    get: (key) => JSON.parse(localStorage.getItem(key) ?? 'null'),
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
}

const sessionStorageAdapter: Storage = {
    get: (key) => JSON.parse(sessionStorage.getItem(key) ?? 'null'),
    set: (key, value) => sessionStorage.setItem(key, JSON.stringify(value)),
}

// 훅은 Storage 인터페이스에만 의존
function useUserPreferences(storage: Storage = localStorageAdapter) {
    const [prefs, setPrefs] = useState(() => storage.get<Preferences>('prefs') ?? DEFAULT_PREFS)

    const updatePrefs = (newPrefs: Preferences) => {
        storage.set('prefs', newPrefs)
        setPrefs(newPrefs)
    }

    return { prefs, updatePrefs }
}
```

---

### 3. 적절한 추상화 수준

너무 이른 추상화는 오히려 결합도를 높입니다.

#### Before: 과도한 추상화

```typescript
// 한 곳에서만 쓰이는데 추상화
interface ButtonConfig {
  type: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  onClick: () => void;
  label: string;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

function createButton(config: ButtonConfig) {
  return (
    <Button
      type={config.type}
      size={config.size}
      onClick={config.onClick}
      icon={config.icon}
      loading={config.loading}
      disabled={config.disabled}
    >
      {config.label}
    </Button>
  );
}

// 사용
createButton({
  type: 'primary',
  size: 'medium',
  onClick: handleSubmit,
  label: '저장',
  loading: isSubmitting,
});
```

#### After: 필요할 때만 추상화

```typescript
// 단순하게 직접 사용
<Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
  저장
</Button>

// 진짜 반복되는 패턴이 있을 때만 추상화
function SubmitButton({ loading, children }: Props) {
  return (
    <Button type="primary" htmlType="submit" loading={loading}>
      {children}
    </Button>
  );
}
```

---

### 4. 모듈 경계 명확히 하기

#### Before: 모듈 간 깊은 의존

```typescript
// features/order/OrderSummary.tsx
import { useUserPoints } from '../user/hooks/useUserPoints'
import { calculateDiscount } from '../promotion/utils/discount'
import { formatShippingDate } from '../shipping/utils/date'
import { SHIPPING_COST } from '../shipping/constants'

// 여러 도메인을 직접 참조
```

#### After: 명확한 모듈 경계

```typescript
// features/order/OrderSummary.tsx
import { useOrderSummary } from './hooks/useOrderSummary'

// 이 훅이 필요한 정보를 조합
function useOrderSummary(orderId: string) {
    const { data: order } = useQuery(OrderApiCaller.getOptions(orderId))
    const { data: user } = useQuery(UserApiCaller.getOptions())

    // 다른 도메인 로직은 API 또는 서비스 레이어에서 처리
    return {
        items: order?.items,
        totalPrice: order?.totalPrice,
        discount: order?.appliedDiscount,
        shippingDate: order?.estimatedShippingDate,
        userPoints: user?.points,
    }
}
```

---

## References

- [Frontend Fundamentals](https://frontend-fundamentals.com)
