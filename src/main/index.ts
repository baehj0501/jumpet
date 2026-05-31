import { app, shell, BrowserWindow } from 'electron'
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
            // 완료 시 1~5점 랜덤 지급. 지급량을 계산해 캐릭터 말풍선으로 알린다.
            const before = readPlayerState().score
            const after = applyPlayerEvent({ type: 'todoComplete' }).score
            broadcastCharacterSpeech(`할일 완료! +${after - before}pt 🎉`)
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

    // 캐릭터 위 말풍선 중계 — 메뉴 창의 돌봄 멘트 등을 캐릭터 창으로 보낸다.
    registerCharacterIpc()

    createWindow()

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
