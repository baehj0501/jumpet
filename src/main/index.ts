import { app, shell, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerWindowIpc } from './window'
import { registerMenuIpc } from './menu'
import { applyPlayerEvent, registerPlayerStateIpc } from './playerState'
import { registerTodoIpc } from './todo'
import { registerLinkIpc } from './link'
import { adjustLinkBarHeight, applyLinkBarEvent, readLinkBarState, setupLinkBar } from './linkBar'

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
    // 메뉴 안의 "즐겨찾기 바 표시" 토글이 linkBar 도메인을 호출하도록 콜백 주입.
    registerMenuIpc({
        isLinkBarVisible: () => readLinkBarState().visible,
        toggleLinkBar: () => {
            applyLinkBarEvent({ type: 'toggle' })
        },
    })

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

    // 링크 영속 데이터 IPC + 외부 URL 열기 위임.
    // 링크 개수 변경 시 미니 버튼 창의 높이를 자동 조정하도록 onLinksChanged 콜백 주입.
    registerLinkIpc({
        onLinksChanged: (state) => {
            adjustLinkBarHeight(state.links.length)
        },
    })

    // 캐릭터 윈도우 생성 후, 미니 버튼 플로팅 창을 setup. 영속화된 visible/position을 적용.
    // - visible=false(기본) → 윈도우는 만들어 두되 hide 상태 유지
    // - visible=true → 마지막 위치(or 캐릭터 오른쪽 default)에 등장
    // 두 창은 이후 독립적으로 동작 — 캐릭터가 움직여도 미니 버튼 창은 따라가지 않는다.
    const characterWindow = createWindow()
    setupLinkBar(characterWindow)

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            const recreatedCharacterWindow = createWindow()
            setupLinkBar(recreatedCharacterWindow)
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
