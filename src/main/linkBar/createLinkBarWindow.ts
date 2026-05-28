import { BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { LINK_BAR_LAYOUT, computeLinkBarHeight } from '@shared/contracts/linkBarLayout'
import { clampToWorkArea, getWorkAreaForWindow, getWorkAreaNearestPoint } from './geometry'
import type { LinkBarPosition } from './linkBarState'

// 링크 미니 버튼 플로팅 창은 앱 시작 시 캐릭터 윈도우와 함께 1회 생성된다.
// 캐릭터 윈도우와 동일한 *상시 표시* 정책을 따르되, 표시 여부는 우클릭 메뉴 토글로 사용자가 제어.
//
// 위치 정책:
// - 영속화된 position이 있으면 그걸 (사용자가 마지막으로 옮긴 위치) — 단, 화면 영역으로 clamp.
//   모니터 구성이 바뀌어 이전 좌표가 무효일 수 있어 그대로 쓰면 창이 화면 밖에 위치 → 보이지 않음.
// - 없으면 캐릭터 오른쪽 default — 첫 실행/리셋 사용자.
// 두 창은 이후 독립적으로 동작 — 캐릭터가 움직여도 미니 버튼 창은 따라가지 않는다.
//
// 윈도우 ref 보유는 caller(setupLinkBar) → controller.setLinkBarWindow가 단일하게 한다.
// 이 모듈은 새 BrowserWindow를 생성·반환만 수행 — SSOT 유지 + 중복 호출 방지는 caller 책임.

// 시작 시 BrowserWindow 사이즈. 이후 adjustLinkBarHeight가 실제 링크 개수에 맞춰 조정한다.
// 5개(MAX_LINKS) 가득 찬 높이로 시작 — 영속 링크가 많은 케이스에서 사이즈 점프를 줄인다.
const LINK_BAR_INITIAL_SIZE = {
    width: LINK_BAR_LAYOUT.cardWidth,
    height: computeLinkBarHeight(5),
}

// 캐릭터 윈도우와의 시각적 간격 (px).
const GAP_TO_CHARACTER = 10

// 캐릭터 윈도우 위치 + 크기 + 작업 영역을 종합해 미니 버튼 창의 default 위치를 정한다.
// 우측 공간이 부족하면 좌측으로 fallback. 좌·상·하단도 clampToWorkArea로 안전 보정.
const computeInitialPosition = (characterWindow: BrowserWindow): { x: number; y: number } => {
    const [charX, charY] = characterWindow.getPosition()
    const [charWidth] = characterWindow.getSize()
    const workArea = getWorkAreaForWindow(characterWindow)

    let x = charX + charWidth + GAP_TO_CHARACTER
    const y = charY

    // 캐릭터 오른쪽 공간 부족 시 왼쪽으로.
    if (x + LINK_BAR_INITIAL_SIZE.width > workArea.x + workArea.width) {
        x = charX - LINK_BAR_INITIAL_SIZE.width - GAP_TO_CHARACTER
    }

    return clampToWorkArea(
        { x, y, width: LINK_BAR_INITIAL_SIZE.width, height: LINK_BAR_INITIAL_SIZE.height },
        workArea,
    )
}

// 영속화된 좌표를 사용할 때는 *그 좌표 근처의* 디스플레이 workArea를 기준으로 clamp.
// 모니터가 분리되어 이전 좌표가 어떤 디스플레이에도 속하지 않더라도 가장 가까운 화면 안으로 끌어들인다.
const resolvePersistedPosition = (position: LinkBarPosition): { x: number; y: number } => {
    const workArea = getWorkAreaNearestPoint(position)
    return clampToWorkArea(
        {
            x: position.x,
            y: position.y,
            width: LINK_BAR_INITIAL_SIZE.width,
            height: LINK_BAR_INITIAL_SIZE.height,
        },
        workArea,
    )
}

// 미니 버튼 창 생성.
// 캐릭터 윈도우(`src/main/index.ts`의 createWindow)와 거의 동일한 옵션 — 상시 표시 + frameless + transparent.
// `show: false`로 시작 — 토글에 따라 controller가 show()/hide()를 결정한다.
// preload는 캐릭터/패널과 공유한다 (window.api.link.* 그대로 사용).
export const createLinkBarWindow = (
    characterWindow: BrowserWindow,
    persistedPosition: LinkBarPosition | null,
): BrowserWindow => {
    const { x, y } = persistedPosition
        ? resolvePersistedPosition(persistedPosition)
        : computeInitialPosition(characterWindow)

    const window = new BrowserWindow({
        x,
        y,
        width: LINK_BAR_INITIAL_SIZE.width,
        height: LINK_BAR_INITIAL_SIZE.height,
        // 토글이 ON이어도 ready-to-show 후 show()를 controller가 결정한다.
        show: false,
        frame: false,
        transparent: true,
        resizable: false,
        hasShadow: false,
        alwaysOnTop: true,
        // 캐릭터 윈도우와 동일 — 미니 버튼 클릭이 뒷창 포커스를 빼앗지 않는다.
        focusable: false,
        fullscreenable: false,
        skipTaskbar: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    // macOS 풀스크린 앱/모든 Space에서도 미니 버튼이 보이도록 캐릭터와 동일 정책 적용.
    window.setAlwaysOnTop(true, 'screen-saver')
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

    // 패널/캐릭터와 동일 — 새창 요청은 OS 브라우저로 위임.
    window.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/link-bar.html`)
    } else {
        window.loadFile(join(__dirname, '../renderer/link-bar.html'))
    }

    return window
}
