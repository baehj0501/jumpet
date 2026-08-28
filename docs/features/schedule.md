# 일정 (Schedule)

> 참조 앱(JUMPET_4)의 "일정(diary)" 비즈니스 로직을 이식한 신규 기능.

## 한 줄 정체성

월 단위 캘린더에 일정을 등록해 두면, 시간이 되었을 때 캐릭터가 알려주는 가벼운 일정·알림 도우미. 생일도 함께 챙긴다.

## 명세

### 캘린더

- 월 단위 보기 + 이전/다음 달 네비게이션(◀ / ▶).
- 날짜별 등록된 일정 표시.

### 일정 이벤트

| 속성 | 형식 | 설명 |
|---|---|---|
| id | string | 고유 ID |
| date | `YYYY-MM-DD` | 일정 날짜 |
| time | `HH:MM` | 일정 시각 |
| title | string | 일정 내용 |
| notified | boolean | 알림 발송 여부(중복 방지) |

- 이벤트 추가/삭제 폼 제공.

### 알림

- main이 **1분 주기**로 검사: 오늘 날짜·현재 시각(`HH:MM`)과 일치하고 아직 `notified=false`인 이벤트가 있으면 알림 발송.
- 알림 발송 시:
  - `notified=true`로 표시(같은 분에 중복 발송 방지) + 저장.
  - 캐릭터 윈도우(및 열린 패널)에 알림 배너 + 말풍선("⏰ {title}").

### 생일

- 설정([settings.md](./settings.md))의 `birthday`와 오늘 날짜(월-일)를 비교.
- 일치하면 생일 축하: 🎂 배너 + 축하 모션(만세 류) + 축하 말풍선.
- 매년 반복(연도 무시, `MM-DD` 비교).

## 아키텍처 / 데이터 흐름

### 도메인 모델 제안

`src/shared/contracts/scheduleEvents.ts` (신규):

```ts
export type ScheduleItem = {
    id: string
    date: string        // 'YYYY-MM-DD'
    time: string        // 'HH:MM'
    title: string
    notified: boolean
}

export type ScheduleState = {
    items: ScheduleItem[]
}

export type ScheduleEvent =
    | { type: 'add'; date: string; time: string; title: string }
    | { type: 'remove'; id: string }
    | { type: 'markNotified'; id: string }     // 알림 발송 기록
```

### 알림 체크 (main, 1분 주기)

```
[main: setInterval 60초]  (앱 시작 시 1회 등록)
   ↓ checkScheduleNotifications()
   현재 'YYYY-MM-DD' / 'HH:MM' 계산
   items 중 (date===today && time===now && !notified) 찾기
   ↓ 있으면:
   - applyScheduleEvent({ type: 'markNotified', id })
   - broadcastCharacterSpeech('⏰ ' + title) + 알림 배너
   ↓ 생일 체크:
   readSettingsState().birthday 의 MM-DD === today MM-DD?
   - 맞으면 생일 축하 모션 + 🎂 배너 (당일 1회)
```

- 1분 주기 타이머는 `src/main/schedule/ipc.ts`(또는 전용 scheduler)에서 등록.
- 알림의 "당일 1회" 보장: 이벤트는 `notified` 플래그, 생일은 마지막 축하 날짜 기록 등으로 중복 방지(세부는 Open Question).

### 데이터 흐름 (등록)

```
[일정 패널 — 사용자가 일정 추가]
   ↓ useScheduleStore.apply({ type: 'add', date, time, title })
   ↓ window.api.schedule.apply
[main reducer]
   randomUUID로 id 생성 + items.push (notified:false)
   ↓ writeScheduleState + broadcast 'schedule:changed'
   ↓ 모든 윈도우의 캘린더 갱신
```

### 부수효과 조립 (main/index.ts)

```ts
registerScheduleIpc({
    getBirthday: () => readSettingsState().birthday,    // 생일 체크용
    onNotify: (title) => {
        broadcastCharacterSpeech('⏰ ' + title)
    },
    onBirthday: () => {
        broadcastCharacterMotion('banzai', 3000)
        broadcastCharacterSpeech('🎂 생일 축하해!')
    },
})
```

schedule 도메인은 settings/character를 직접 import하지 않고 콜백으로 위임(기존 패턴 일관).

### 새 패널 추가 흐름

1. `PanelId` union에 `'schedule'` 추가 (이미 메뉴에 있음)
2. `src/main/panels/openSchedulePanel.ts`
3. `src/main/panels/index.ts` switch 등록
4. `src/renderer/schedule.html` + `src/renderer/src/pages/schedule/`(캘린더 UI)
5. `electron.vite.config.ts` rollup input 등록

### 관련 코드 (계획)

| 영역 | 파일 |
|---|---|
| 타입 (공유) | `src/shared/contracts/scheduleEvents.ts` (신규) |
| reducer | `src/main/schedule/scheduleState.ts` (신규) |
| 영속화 | `src/main/schedule/store.ts` (신규) |
| IPC + 1분 타이머 | `src/main/schedule/ipc.ts` (신규) |
| barrel | `src/main/schedule/index.ts` (신규) |
| renderer slice | `src/renderer/src/entities/schedule/` (신규) |
| 일정 패널 | `src/renderer/src/pages/schedule/` (신규) |

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출함** | character (알림 말풍선·생일 모션), settings (생일 값 read) |
| **호출됨** | 우클릭 메뉴의 '📅 일정' / 1분 주기 타이머(알림 체크) |

## Open Questions

- **알림 전달 채널** — OS 네이티브 알림(`Notification`) vs 캐릭터 말풍선/배너. 참조 앱은 인앱 배너+말풍선. 둘 다?
- **앱 꺼져 있던 시간의 지난 일정** — 앱이 안 떠 있을 때 지나간 일정은 놓침. 켜질 때 "놓친 일정" 안내할지.
- **생일 중복 방지** — 같은 날 여러 번 켜도 1회만 축하하도록 마지막 축하 날짜 저장.
- **반복 일정** — 매일/매주 반복 일정 지원 여부(참조 앱은 단발 이벤트만).
- **타이머 정확도** — 1분 폴링이면 최대 ~1분 지연. 충분한지.
- **포인트 보상 연동** — 일정 완료/확인에 포인트를 줄지(참조 앱은 없음). 현재는 보상 없음으로 둠.
