import { BrowserWindow, ipcMain, shell } from 'electron'
import { isAllowedExternalUrl, type LinkEvent, type LinkState } from '@shared/contracts/linkEvents'
import { reduceLinkState } from './linkState'
import { readLinkState, writeLinkState } from './store'

const LINK_CHANGED_CHANNEL = 'link:changed'

const broadcastLinkState = (next: LinkState): void => {
    const allWindows = BrowserWindow.getAllWindows()
    for (const targetWindow of allWindows) {
        if (targetWindow.isDestroyed()) {
            continue
        }
        targetWindow.webContents.send(LINK_CHANGED_CHANNEL, next)
    }
}

// 외부 모듈이 link state 변경 시점에 부수효과를 합성할 수 있게 콜백을 받는다.
// todo의 onTodoCompleted와 같은 의존성 주입 패턴 — link 도메인이 linkBar/character 등을 직접 import하지 않게 한다.
// 조립은 src/main/index.ts에서.
type LinkIpcDeps = {
    onLinksChanged?: (state: LinkState) => void
}

let onLinksChangedRef: ((state: LinkState) => void) | undefined

// renderer IPC 진입점과 main 내부 트리거 둘 다 같은 함수를 거치게 해
// 영속화·broadcast·invariant 검증을 한 군데에 모은다 (playerState와 같은 패턴).
export const applyLinkEvent = (event: LinkEvent): LinkState => {
    const current = readLinkState()
    const next = reduceLinkState(current, event)
    // 변경이 없으면 (예: 가득 찬 상태에서 add, 잘못된 id로 remove) 디스크 쓰기/broadcast 생략.
    if (next === current) {
        return current
    }
    writeLinkState(next)
    broadcastLinkState(next)
    onLinksChangedRef?.(next)
    return next
}

export const registerLinkIpc = (deps: LinkIpcDeps = {}): void => {
    onLinksChangedRef = deps.onLinksChanged

    ipcMain.handle('link:get', (): LinkState => {
        return readLinkState()
    })

    ipcMain.handle('link:apply', (_event, eventInput: LinkEvent): LinkState => {
        return applyLinkEvent(eventInput)
    })

    // 외부 브라우저로 URL 열기는 main에 위임한다.
    // - renderer에 shell을 직접 노출하지 않아 preload 표면을 좁게 유지.
    // - 채널/함수명에 'openExternal'을 박아 fire-and-forget(send) 모델임을 caller에게 알린다.
    //   (link:get / link:apply는 invoke 기반이지만 이 채널만 응답이 필요 없어 send 사용.)
    // - reducer가 저장 시 https:// prefix를 보장하지만, IPC 경계에서 한 번 더
    //   isAllowedExternalUrl로 검증해 file://, javascript: 같은 스킴이 흘러들지 않게 한다.
    ipcMain.on('link:openExternal', (_event, url: unknown) => {
        if (!isAllowedExternalUrl(url)) {
            return
        }
        void shell.openExternal(url)
    })
}
