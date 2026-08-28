# 캐릭터 시스템

## 한 줄 정체성

OS 바탕화면 위에 떠 있는 강아지. 자율적으로 돌아다니다가, 사용자가 드래그/클릭하면 반응한다.

## 명세

### 외형

- 기본 표현: **PNG 프레임 3장** (`frame01`, `frame02`, `frame03`) + 투명 배경.
- 창 테두리 없이 캐릭터 이미지만 보임.
- **일반 창 z-order** — always-on-top을 쓰지 않는다(사용자 요청). 클릭하면 앞으로 나오고, 다른 앱/창을 클릭하면 그 아래로 깔린다. 펫이 다른 창에 가려질 수 있다.

### 위치 / 이동

- **드래그**: 좌클릭 누르고 끌면 캐릭터가 따라옴.
  - mousemove 동안 OS 윈도우를 `setPosition`으로 갱신.
  - 마우스가 펫 윈도우 영역을 빠르게 벗어나도 끊기지 않게 `window` 레벨에서 mousemove/mouseup 구독.
  - requestAnimationFrame 기반 throttle.
- **자율 walking**: 일정 확률로 idle ↔ walking 전환.
  - walking 진입 시 랜덤 방향 선택 → 60 px/초로 윈도우 이동.
  - 모니터 작업 영역(메뉴바·독 제외) 경계에서 반사.
  - 사용자가 인터랙션(드래그·메뉴 열림) 중에는 정지.
- **위치 저장 (계획)**: 사용자가 마지막으로 둔 위치를 기억하고 재시작 시 복원.

### 애니메이션 — PNG 3프레임 (v2.0 명세 §2.2)

- 사용자가 캐릭터를 **길게 누르고 있는 동안** PNG 프레임이 순환:
  - 순서: `frame01 → frame02 → frame03 → frame02 → 반복`
  - 프레임 전환 간격: 120ms
- 클릭을 떼면 `frame01`(기본 자세)로 복귀.
- **짧은 클릭(탭)** 은 애니메이션 없이 말풍선만.
- **드래그 중**에는 마우스 방향에 따라 캐릭터가 흔들리듯 회전 → 드래그 종료 시 원위치.

### GIF 표정 모션 (v2.0 명세 §3)

특정 트리거 발생 시 PNG → GIF로 잠깐 전환, 3초 후 자동 복귀.

| 트리거 | GIF 모션 | 지속 |
|---|---|---|
| 🐾 돌봄 — 밥 주기 | 먹는 모션 | 3초 |
| 🐾 돌봄 — 놀아주기 | 신난 모션 | 3초 |
| 🐾 돌봄 — 쓰다듬기 | 애정 모션 | 3초 |
| 🐾 돌봄 — 눕기 | 쉬는 모션 | 3초 |
| ✅ To-Do 완료 | 칭찬/박수 모션 | 3초 |
| 🎰 뽑기 당첨 | 기뻐하는 모션 | 3초 |
| 📅 일정 알림 / 🎂 생일 | 알림 / 축하(만세) 모션 | 3초 |
| 🎊 레벨업 | 축하 모션 | 3초 |

규칙:
- 트리거 → GIF 즉시 전환.
- 3초 후 자동으로 기본 PNG 복귀.
- 재생 중 다른 트리거가 들어오면 새 GIF로 교체 (이전 GIF는 잘림).
- GIF는 빌드 타임 에셋. 사용자가 별도로 준비/교체할 수 있는 구조(파일 교체)지만 우리 단계에선 번들 포함.

### 상호작용 트리거 요약

| 동작 | 결과 |
|---|---|
| 짧은 클릭(탭) | 랜덤 메시지 말풍선 |
| 길게 누르기 (200ms+) | PNG 3프레임 애니메이션 재생 |
| 드래그 | 위치 이동 + 흔들기 회전 효과 |
| 우클릭 | 컨텍스트 메뉴 표시 — [context-menu.md](./context-menu.md) |

## 아키텍처 / 데이터 흐름

### 캐릭터 윈도우 생성

`src/main/index.ts` — `createWindow()`:

```ts
new BrowserWindow({
    width: 300, height: 300,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    fullscreenable: false,
    skipTaskbar: true,
    autoHideMenuBar: true,
    webPreferences: { preload, sandbox: false, contextIsolation: true, nodeIntegration: false },
})
mainWindow.center()
// always-on-top / visibleOnAllWorkspaces / focusable:false 미사용 — 일반 창 z-order.
```

### 윈도우 위치 IPC

`src/main/window/` — 드래그·자율 이동에 필요한 IPC:

| 채널 | 방향 | 용도 |
|---|---|---|
| `window:startDrag` | renderer → main | 드래그 시작 (시작 시점 좌표 캐싱) |
| `window:dragTo` | renderer → main | 드래그 진행 좌표 송신 |
| `window:endDrag` | renderer → main | 드래그 종료 |
| `window:moveTo` | renderer → main | 자율 이동 — 절대 좌표 |
| `window:getBounds` | renderer → main → renderer | 현재 윈도우 위치/크기 |
| `window:getDisplayWorkArea` | renderer → main → renderer | 현재 모니터 작업 영역 |

### 자율 행동 일시정지 신호

캐릭터의 자율 walking은 사용자 인터랙션 중에는 정지해야 함. 단일 ref(`isInteractingRef`)로 토글:

- features/drag(useWindowDrag)가 mousedown/mouseup에 따라 토글
- features/context-menu가 메뉴 열림/닫힘에 따라 토글
- entities/character/behaviors가 read-only로 받음 (`{ readonly current: boolean }`)

`app/App.tsx`에서 ref 생성 후 양쪽에 주입.

### 관련 코드

| 영역 | 파일 |
|---|---|
| 윈도우 생성 | `src/main/index.ts` (createWindow) |
| 윈도우 IPC | `src/main/window/` |
| 캐릭터 상태 머신 (idle/walking) | `src/renderer/src/entities/character/behaviors/useStateMachine.ts` |
| Walking 루프 | `src/renderer/src/entities/character/behaviors/useWalking.ts` |
| 캐릭터 뷰 | `src/renderer/src/entities/character/ui/CharacterView.tsx` |
| 캐릭터 카탈로그 (이미지) | `src/renderer/src/entities/character/assets/` |
| 드래그 hook | `src/renderer/src/features/drag/useWindowDrag.ts` |
| 조합부 | `src/renderer/src/app/App.tsx` |

### 캐릭터 × 감정 카탈로그

이미지는 **2차원 매핑** (`CharacterId × Mood`)로 관리. `src/renderer/src/entities/character/assets/index.ts`:

```ts
export const CHARACTER_ASSETS: Record<CharacterId, Record<Mood, string>> = {
    dog: {
        default: dogDefault,
        happy: dogDefault,    // 폴백 — 진짜 GIF 도착 시 교체
        sad: dogDefault,
    },
}
```

새 캐릭터 추가 시: `CharacterId` union에 한 줄 + `assets/{id}/` 폴더 + 매핑 한 블록.

## 의존성

| 의존 방향 | 무엇 |
|---|---|
| **호출됨** | 모든 인터랙션 트리거(클릭/드래그/우클릭/먹이/놀이/완료 등)가 캐릭터 시각을 바꾼다 |
| **호출함** | window IPC (위치 이동), context-menu (우클릭) |

## Open Questions

- **길게 누르기 트리거 200ms** — pointer events로 구현? 마우스 다운 시간 측정?
- **드래그 회전 효과** — 마우스 속도/방향 어떻게 측정? CSS `transform: rotate()`의 각도 공식?
- **GIF 파일 미존재 시 폴백** — 폴백을 default mood로? 아니면 PNG 그대로 두기?
- **PNG/GIF 에셋 작화** — 사용자가 직접 그릴지, 외주/AI 생성?
- **위치 저장**: `player`/`todo`처럼 별도 도메인으로 (`src/main/windowPosition/`)? 아니면 `player`의 한 필드로?
- **다중 모니터 위치 복원** — 마지막 모니터가 disconnect됐을 때 어디로?
