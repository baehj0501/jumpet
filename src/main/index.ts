import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import Store from 'electron-store'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerWindowIpc } from './window'
import { registerMenuIpc } from './menu'
import { applyPlayerEvent, readPlayerState, registerPlayerStateIpc } from './playerState'
import { registerTodoIpc } from './todo'
import { applyFortuneEvent, registerFortuneIpc } from './fortune'
import { registerItemIpc } from './item'
import { registerScheduleIpc } from './schedule'
import { registerCharacterSelectionIpc } from './characterSelection'
import { registerProfileIpc } from './profile'
import { registerPetSelectionIpc } from './petSelection'
import { registerSettingsIpc, applyLaunchAtLogin, readSettingsState } from './settings'
import { registerWorldIpc, readWorldState } from './world'
import type { WorldState } from './world'
import { registerYoutubeIpc } from './youtube'
import { setMenuPanelOnTop } from './panels/openMenuPanel'
import { broadcastCharacterSpeech, registerCharacterIpc } from './character'
import { GACHA_COST } from '@shared/contracts/itemEvents'

const createWindow = (): BrowserWindow => {
    const mainWindow = new BrowserWindow({
        width: 300,
        height: 300,
        show: false,
        frame: false,
        transparent: true,
        resizable: false,
        hasShadow: false,
        // 일반 창 z-order: always-on-top을 쓰지 않는다. 클릭하면 앞으로 나오고
        // 다른 앱/창을 클릭하면 그 아래로 깔린다(다른 앱처럼). 펫도 일반 창.
        // 사용자가 실수로 펫을 풀스크린으로 만들지 못하게 한다.
        fullscreenable: false,
        // Windows 작업표시줄/Alt+Tab에서 숨긴다. macOS Dock에는 영향 없음.
        skipTaskbar: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    // 화면 오른쪽 아래에서 시작(작업표시줄/메뉴바 제외한 작업영역 기준 + 여백).
    const { workArea } = screen.getPrimaryDisplay()
    const margin = 24
    mainWindow.setPosition(
        Math.round(workArea.x + workArea.width - 300 - margin),
        Math.round(workArea.y + workArea.height - 300 - margin),
    )

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    return mainWindow
}

// 데코(꾸미기) 창 — 화면 전체를 덮는 투명 오버레이. 고정 모드에선 클릭 통과(바탕화면처럼),
// 꾸미기 모드에선 마우스를 받아 배치/드래그. "항상 최하단"은 macOS 제약이 있어 후속 과제.

// 데코 창 싱글톤 ref — 꾸미기 모드 토글 시 클릭통과를 조작한다.
let worldWindow: BrowserWindow | null = null

// 캐릭터(펫) 창 싱글톤 ref — 말풍선이 뜰 때 잠깐 최상단으로 끌어올린다.
let characterWindow: BrowserWindow | null = null

// 일시 최상단 해제 타이머 — 연속 완료 시 마지막 호출 기준으로 복귀 시점을 미룬다.
let characterTopTimer: ReturnType<typeof setTimeout> | null = null

// 캐릭터 창을 잠깐 최상단으로 끌어올린다(상시 always-on-top 정책은 유지).
// 할일 완료 등으로 말풍선이 뜰 때 호출 → 말풍선이 보이는 동안만 위로, 끝나면 일반 z-order로 복귀.
const CHARACTER_TOP_DURATION_MS = 2600
// persist=true면 자동 복귀 타이머를 걸지 않는다 — sticky 알림 말풍선이 닫힐 때까지(releaseCharacterWindowTop) 최상단 유지.
const bringCharacterWindowToTop = (persist = false): void => {
    if (!characterWindow || characterWindow.isDestroyed()) {
        return
    }
    if (!characterWindow.isVisible()) {
        characterWindow.show()
    }
    characterWindow.moveTop()
    characterWindow.setAlwaysOnTop(true)
    if (characterTopTimer !== null) {
        clearTimeout(characterTopTimer)
        characterTopTimer = null
    }
    if (persist) {
        return
    }
    characterTopTimer = setTimeout(() => {
        characterTopTimer = null
        if (characterWindow && !characterWindow.isDestroyed()) {
            characterWindow.setAlwaysOnTop(false)
        }
    }, CHARACTER_TOP_DURATION_MS)
}

// sticky 알림 말풍선이 닫혔을 때 — 캐릭터 창의 최상단 고정을 해제하고 일반 z-order로 복귀.
const releaseCharacterWindowTop = (): void => {
    if (characterTopTimer !== null) {
        clearTimeout(characterTopTimer)
        characterTopTimer = null
    }
    if (characterWindow && !characterWindow.isDestroyed()) {
        characterWindow.setAlwaysOnTop(false)
    }
}

// 고정 모드의 데코 오버레이를 일반 창보다 '아래' 레벨에 고정한다.
// macOS에선 캐릭터/다른 앱을 클릭해 앱이 활성화돼도 전체화면 데코가 위로 딸려 올라오지 않게
// 일반 창(normal)보다 1단계 낮은 레벨에 못박는다. (Windows는 아래 레벨 개념이 없어 always-on-top 해제만.)
const pinWorldToBottom = (): void => {
    if (!worldWindow || worldWindow.isDestroyed()) {
        return
    }
    if (process.platform === 'darwin') {
        worldWindow.setAlwaysOnTop(true, 'normal', -1)
    } else {
        worldWindow.setAlwaysOnTop(false)
    }
}

// 꾸미기 모드에 따라 데코 창의 상호작용을 토글한다.
// edit: 클릭/드래그 받음. fixed: 클릭 통과(데스크탑/다른 창 클릭 가능).
// 전체화면 창이라 포커스를 뺏으면 메뉴 창을 덮으므로 focus()는 호출하지 않는다.
const setWorldEditable = (editable: boolean): void => {
    if (!worldWindow || worldWindow.isDestroyed()) {
        return
    }
    worldWindow.setIgnoreMouseEvents(!editable)
    if (editable) {
        // 편집 중엔 최하단 고정을 풀고(일반 레벨) 앞으로 올려 상호작용 가능하게 한다.
        // 단, 'floating'(메뉴와 같은 레벨)로 올리면 전체화면 데코가 메뉴 창을 덮어 버튼이 안 눌리므로
        // 일반(normal) 레벨로만 올리고, 메뉴 창은 그보다 위(floating)에 두어 항상 클릭 가능하게 한다.
        worldWindow.setAlwaysOnTop(false)
        worldWindow.moveTop()
    } else {
        // 고정 모드로 돌아오면 다시 최하단 레벨로 못박는다.
        pinWorldToBottom()
    }
    // 메뉴 창을 데코 창 위로 — 편집 중 메뉴 버튼/보관함 클릭이 가려지지 않게.
    setMenuPanelOnTop(editable)
}

// 전체화면 데코 오버레이 표시 여부 — 꾸미기 모드이거나 배치된 데코가 있을 때만 보인다.
// (배치가 없고 고정 모드면 숨겨, 투명 미지원 환경에서 화면을 가리지 않게 한다.)
const syncWorldWindowVisibility = (state: WorldState): void => {
    if (!worldWindow || worldWindow.isDestroyed()) {
        return
    }
    const shouldShow = state.mode === 'edit' || state.placed.length > 0
    if (shouldShow) {
        if (!worldWindow.isVisible()) {
            worldWindow.showInactive()
        }
        // 고정(비편집) 모드로 보일 땐 항상 최하단 레벨에 못박아, 앱 활성화 시 위로 안 올라오게.
        if (state.mode !== 'edit') {
            pinWorldToBottom()
        }
    } else if (worldWindow.isVisible()) {
        worldWindow.hide()
    }
}

const createWorldWindow = (): BrowserWindow => {
    const primary = screen.getPrimaryDisplay()
    const { x, y, width, height } = primary.bounds

    const win = new BrowserWindow({
        x,
        y,
        width,
        height,
        show: false,
        frame: false,
        transparent: true,
        resizable: false,
        movable: false,
        focusable: false,
        hasShadow: false,
        skipTaskbar: true,
        fullscreenable: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
            partition: 'persist:world',
        },
    })

    worldWindow = win
    win.on('closed', () => {
        worldWindow = null
    })

    // 고정 모드: 마우스 이벤트 통과(바탕화면/다른 창 클릭 가능). 꾸미기 모드에서 토글.
    win.setIgnoreMouseEvents(true)
    // 모든 워크스페이스에 표시하고, always-on-top은 쓰지 않아 일반 창 아래로 깔린다.
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false })

    // 전체화면 투명 오버레이는 평소 숨겨 둔다(일부 Windows에서 투명 합성 실패 시 바탕화면이
    // 통째로 가려지는 문제 방지). 꾸미기 모드이거나 배치된 데코가 있을 때만 표시.
    win.on('ready-to-show', () => {
        syncWorldWindowVisibility(readWorldState())
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/world.html`)
    } else {
        win.loadFile(join(__dirname, '../renderer/world.html'))
    }

    return win
}

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.rapportlabs.loopf')

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // 펫 윈도우 위치/크기 조작 IPC — 드래그, 자율 이동, 모니터 경계 조회.
    registerWindowIpc()

    // 캐릭터 우클릭 컨텍스트 메뉴 IPC — 메뉴 열림/닫힘 broadcast로 자율 행동 정지 신호도 같이 보낸다.
    registerMenuIpc()

    // 플레이어 영속 데이터(점수 등) IPC — main이 SSOT, 모든 창에 broadcast해 동기화.
    registerPlayerStateIpc()

    // TODO 영속 데이터 IPC — playerState와 같은 패턴으로 main SSOT 일관성 유지.
    // todo 완료 시 일어날 부수효과들은 todo 도메인 외부에서 조립한다.
    // (todo는 점수/사운드/업적 등을 직접 import하지 않고, 사건 사실만 콜백으로 위임.)
    registerTodoIpc({
        onTodoCompleted: (reward) => {
            // 완료 시 todo에 저장된 보상(1~5점)을 지급하고 말풍선으로 알린다.
            applyPlayerEvent({ type: 'manual', delta: reward })
            broadcastCharacterSpeech(`할일 완료! +${reward}pt 🎉`)
            // 완료 축하 말풍선이 가려지지 않게 캐릭터 창을 잠깐 최상단으로.
            bringCharacterWindowToTop()
        },
        onTodoUncompleted: (reward) => {
            // 완료 취소 시 같은 보상을 차감(점수가 음수로 내려갈 수 있음).
            applyPlayerEvent({ type: 'manual', delta: -reward })
            broadcastCharacterSpeech(`완료 취소 -${reward}pt`)
        },
        onTodoSummary: (count) => {
            // 아침/저녁 남은 할일 리마인더.
            broadcastCharacterSpeech(`할 일 ${count}개 남았어요!`, { sticky: true })
            bringCharacterWindowToTop(true)
        },
    })

    // 운세 영속 데이터 IPC — todo와 같은 패턴. 새 운세가 떴을 때만 점수 보상을 조립한다.
    // (fortune은 player를 직접 import하지 않고, 보상 금액(단계 기반)만 콜백으로 위임.)
    const onFortuneRolled = (record: { scoreAwarded: number }) => {
        applyPlayerEvent({ type: 'fortune', amount: record.scoreAwarded })
    }
    registerFortuneIpc({ onFortuneRolled })

    // 소모성 아이템 인벤토리 + 뽑기 IPC.
    // 뽑기 비용 차감은 item 도메인이 잔액을 확인한 뒤 player에 위임한다(직접 import 안 함).
    registerItemIpc({
        getScore: () => readPlayerState().score,
        spendForGacha: () => {
            applyPlayerEvent({ type: 'gachaSpin', cost: GACHA_COST })
        },
    })

    // 일정 영속 데이터 IPC — 등록된 시각이 되면 캐릭터 말풍선으로 알린다.
    // (schedule은 character를 직접 import하지 않고, "일정 시각 도래" 사실만 콜백으로 위임.)
    registerScheduleIpc({
        onDue: (title) => {
            // 일정 알람 — 캐릭터를 끌어올려 sticky 말풍선(닫을 때까지 유지)으로 알린다.
            broadcastCharacterSpeech(`⏰ ${title}`, { sticky: true })
            bringCharacterWindowToTop(true)
        },
    })

    // 선택된 캐릭터(펫) IPC — 홈 탭에서 바꾼 캐릭터를 펫 윈도우와 공유(SSOT).
    registerCharacterSelectionIpc()

    // 홈 프로필(캐릭터 이름·이름·생일) IPC — 메뉴 창과 펫 창이 공유(SSOT).
    registerProfileIpc()

    // 동반 펫 장착 IPC — 펫 탭에서 장착한 펫을 펫 창과 공유(SSOT).
    registerPetSelectionIpc()

    // 환경설정(테마·캐릭터 크기) IPC — 설정 탭에서 바꾸면 메뉴/캐릭터 창이 구독해 반영.
    registerSettingsIpc()
    // 저장된 '로그인 시 자동 실행' 값을 OS에 동기화(시작 시 1회).
    applyLaunchAtLogin(readSettingsState().launchAtLogin)

    // 앱 유틸 IPC — 버전 표시 + 데이터 초기화(전체 영속 데이터 삭제 후 재시작) + 전체 종료.
    ipcMain.handle('app:getVersion', (): string => app.getVersion())
    ipcMain.handle('app:resetAll', (): void => {
        // 모든 도메인 store는 같은 config.json을 공유하므로 한 번의 clear로 전부 비운다.
        new Store().clear()
        app.relaunch()
        app.exit(0)
    })
    ipcMain.handle('app:quit', (): void => {
        app.quit()
    })

    registerYoutubeIpc()

    registerWorldIpc({
        onModeChange: (mode) => {
            setWorldEditable(mode === 'edit')
        },
        // 배치/모드 변경 시 오버레이 표시 여부 갱신.
        onChange: (state) => {
            syncWorldWindowVisibility(state)
        },
        // 데코 가챠 비용 차감 — item 가챠와 동일하게 player에 위임.
        getScore: () => readPlayerState().score,
        spendForGacha: () => {
            applyPlayerEvent({ type: 'gachaSpin', cost: GACHA_COST })
        },
    })

    // 캐릭터 위 말풍선 중계 — 메뉴 창의 돌봄 멘트 등을 캐릭터 창으로 보낸다.
    registerCharacterIpc({
        onStickySpeech: () => bringCharacterWindowToTop(true),
        onDismiss: () => releaseCharacterWindowTop(),
    })

    characterWindow = createWindow()

    // 데스크탑 하단 월드 창 — 배치된 데코를 고정 표시.
    createWorldWindow()

    // 앱 시작 시 오늘 운세를 보장한다(없으면 추첨 + 점수 보상). 날짜당 멱등.
    // (통합 메뉴 창으로 바뀐 뒤 자동 팝업은 없앴다 — 운세는 우클릭 메뉴 → 운세 탭에서 본다.)
    applyFortuneEvent({ type: 'roll' }, onFortuneRolled)

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            characterWindow = createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
