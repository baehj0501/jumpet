import { ipcMain } from 'electron'
import { getYoutubeWindow, openYoutubePanel } from '../panels/openYoutubePanel'
import { openYoutubeMenuPanel, closeYoutubeMenuPanel } from '../panels/openYoutubeMenuPanel'

// 유튜브 별창 제어 — 영속 상태 없는 윈도우 조작 채널(fire-and-forget).
export const registerYoutubeIpc = (): void => {
    // 메뉴 창에서 '유튜브 열기'(+ 테마/링크 옵션).
    ipcMain.on('youtube:open', (_event, options: { theme?: number; url?: string } = {}) => {
        openYoutubePanel(options)
    })

    // 드래그 이동 — 화면 좌표 델타만큼 창을 옮긴다.
    ipcMain.on('youtube:move', (_event, { dx, dy }: { dx: number; dy: number }) => {
        const win = getYoutubeWindow()
        if (!win) {
            return
        }
        const [x, y] = win.getPosition()
        win.setPosition(Math.round(x + dx), Math.round(y + dy))
    })

    // 크기 조정 / 미니 모드.
    ipcMain.on('youtube:resize', (_event, { width, height }: { width: number; height: number }) => {
        const win = getYoutubeWindow()
        if (!win) {
            return
        }
        win.setSize(Math.max(160, Math.round(width)), Math.max(120, Math.round(height)))
    })

    // 가장자리/모서리 드래그 리사이즈 — 웹페이지 창처럼. edge 방향에 따라 bounds를 조정한다.
    ipcMain.on(
        'youtube:resizeEdge',
        (_event, { edge, dx, dy }: { edge: string; dx: number; dy: number }) => {
            const win = getYoutubeWindow()
            if (!win) {
                return
            }
            const MIN_W = 200
            const MIN_H = 150
            const b = win.getBounds()
            let { x, y, width, height } = b

            if (edge.includes('e')) {
                width = Math.max(MIN_W, width + dx)
            }
            if (edge.includes('s')) {
                height = Math.max(MIN_H, height + dy)
            }
            if (edge.includes('w')) {
                const newWidth = Math.max(MIN_W, width - dx)
                x = x + (width - newWidth)
                width = newWidth
            }
            if (edge.includes('n')) {
                const newHeight = Math.max(MIN_H, height - dy)
                y = y + (height - newHeight)
                height = newHeight
            }

            win.setBounds({ x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) })
        },
    )

    // 항상 위 / 일반 z-order 토글 — 사용자가 뷰어를 다른 창 위에 고정할지 선택.
    ipcMain.on('youtube:setAlwaysOnTop', (_event, value: boolean) => {
        getYoutubeWindow()?.setAlwaysOnTop(Boolean(value))
    })

    // 우클릭 → 별도 팝업 창에 커스텀(썸네일) 메뉴를 띄운다(작은 뷰어에서도 안 잘림).
    ipcMain.on(
        'youtube:openContextMenu',
        (
            _event,
            state: {
                theme: number
                sizeStep: number
                alwaysOnTop: boolean
                sizeCount: number
            },
        ) => {
            if (!getYoutubeWindow()) {
                return
            }
            openYoutubeMenuPanel(state)
        },
    )

    // 팝업 메뉴에서 고른 결과 → 유튜브 뷰어 렌더러로 relay(상태·localStorage·부수효과는 뷰어가 처리) 후 팝업 닫기.
    ipcMain.on('youtube:menuSelect', (_event, action: { type: string; value?: number | boolean }) => {
        getYoutubeWindow()?.webContents.send('youtube:menuAction', action)
        closeYoutubeMenuPanel()
    })

    ipcMain.on('youtube:close', () => {
        getYoutubeWindow()?.close()
    })
}
