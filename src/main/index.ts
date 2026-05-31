import { app, shell, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerWindowIpc } from './window'
import { registerMenuIpc } from './menu'
import { applyPlayerEvent, registerPlayerStateIpc } from './playerState'
import { registerTodoIpc } from './todo'
import { applyFortuneEvent, readFortuneState, registerFortuneIpc } from './fortune'
import { openFortunePanel } from './panels'

const createWindow = (): BrowserWindow => {
    const mainWindow = new BrowserWindow({
        width: 300,
        height: 300,
        show: false,
        frame: false,
        transparent: true,
        resizable: false,
        hasShadow: false,
        alwaysOnTop: true,
        // 펫을 클릭/드래그해도 뒤에서 작업하던 창의 포커스를 빼앗지 않게 한다.
        focusable: false,
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

    // BrowserWindow 옵션의 alwaysOnTop만으로는 macOS에서 'floating' 레벨이라
    // 풀스크린 앱에 가려진다. 'screen-saver' 레벨까지 올려 풀스크린 위에도 표시.
    // Windows/Linux에서는 level 인자가 무시되고 일반 alwaysOnTop으로 동작한다.
    mainWindow.setAlwaysOnTop(true, 'screen-saver')

    // macOS의 모든 Space에서 펫이 보이게 하고, 풀스크린 Space에도 따라간다.
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

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
        onTodoCompleted: () => {
            applyPlayerEvent({ type: 'todoComplete' })
        },
    })

    // 운세 영속 데이터 IPC — todo와 같은 패턴. 새 운세가 떴을 때만 점수 보상을 조립한다.
    // (fortune은 player를 직접 import하지 않고, 보상 금액(단계 기반)만 콜백으로 위임.)
    const onFortuneRolled = (record: { scoreAwarded: number }) => {
        applyPlayerEvent({ type: 'fortune', amount: record.scoreAwarded })
    }
    registerFortuneIpc({ onFortuneRolled })

    createWindow()

    // 앱 시작 시 오늘 운세를 보장한다(없으면 추첨 + 점수 보상). 날짜당 멱등.
    // 오늘 운세가 새로 떴다면("아침 팝업") 운세 창을 자동으로 띄운다.
    const fortuneBefore = readFortuneState().today
    applyFortuneEvent({ type: 'roll' }, onFortuneRolled)
    const fortuneAfter = readFortuneState().today
    if (fortuneAfter && fortuneAfter.date !== fortuneBefore?.date) {
        openFortunePanel()
    }

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
