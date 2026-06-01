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
import { registerSettingsIpc } from './settings'
import { registerWorldIpc } from './world'
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

    mainWindow.center()

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

// 꾸미기 모드에 따라 데코 창의 상호작용을 토글한다.
// edit: 클릭/드래그 받음. fixed: 클릭 통과(데스크탑/다른 창 클릭 가능).
// 전체화면 창이라 포커스를 뺏으면 메뉴 창을 덮으므로 focus()는 호출하지 않는다.
const setWorldEditable = (editable: boolean): void => {
    if (!worldWindow || worldWindow.isDestroyed()) {
        return
    }
    worldWindow.setIgnoreMouseEvents(!editable)
    if (editable) {
        // 편집 중엔 데코 창을 앞으로(캐릭터 위), 메뉴는 그보다 위로 띄운다.
        worldWindow.moveTop()
    }
    // 메뉴 창을 데코 창 위로 — 편집 중 메뉴 버튼/보관함 클릭이 가려지지 않게.
    setMenuPanelOnTop(editable)
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

    win.on('ready-to-show', () => {
        win.showInactive()
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/world.html`)
    } else {
        win.loadFile(join(__dirname, '../renderer/world.html'))
    }

    return win
}

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.rapportlabs.game')

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
        },
        onTodoUncompleted: (reward) => {
            // 완료 취소 시 같은 보상을 차감(점수가 음수로 내려갈 수 있음).
            applyPlayerEvent({ type: 'manual', delta: -reward })
            broadcastCharacterSpeech(`완료 취소 -${reward}pt`)
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
            broadcastCharacterSpeech(`⏰ ${title}`)
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
        // 데코 가챠 비용 차감 — item 가챠와 동일하게 player에 위임.
        getScore: () => readPlayerState().score,
        spendForGacha: () => {
            applyPlayerEvent({ type: 'gachaSpin', cost: GACHA_COST })
        },
    })

    // 캐릭터 위 말풍선 중계 — 메뉴 창의 돌봄 멘트 등을 캐릭터 창으로 보낸다.
    registerCharacterIpc()

    createWindow()

    // 데스크탑 하단 월드 창 — 배치된 데코를 고정 표시.
    createWorldWindow()

    // 앱 시작 시 오늘 운세를 보장한다(없으면 추첨 + 점수 보상). 날짜당 멱등.
    // (통합 메뉴 창으로 바뀐 뒤 자동 팝업은 없앴다 — 운세는 우클릭 메뉴 → 운세 탭에서 본다.)
    applyFortuneEvent({ type: 'roll' }, onFortuneRolled)

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
