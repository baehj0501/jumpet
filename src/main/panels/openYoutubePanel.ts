import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

// 유튜브 별창 싱글톤. 캐릭터 옆에 떠 있는 작은 플로팅 webview 창(테마 프레임 오버레이).
let youtubeWindow: BrowserWindow | null = null

const DEFAULT_W = 560
const DEFAULT_H = 407

export const getYoutubeWindow = (): BrowserWindow | null =>
    youtubeWindow && !youtubeWindow.isDestroyed() ? youtubeWindow : null

type OpenOptions = { theme?: number; url?: string }

const buildQuery = (options: OpenOptions): string => {
    const params = new URLSearchParams()
    if (options.theme) {
        params.set('theme', String(options.theme))
    }
    if (options.url && options.url.trim() !== '') {
        params.set('video', options.url.trim())
    }
    const query = params.toString()
    return query ? `?${query}` : ''
}

export const openYoutubePanel = (options: OpenOptions = {}): void => {
    const existing = getYoutubeWindow()
    if (existing) {
        // 이미 열려 있으면 새 옵션으로 다시 로드(테마/링크 반영) 후 포커스.
        const q = buildQuery(options)
        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            existing.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/youtube.html${q}`)
        } else {
            existing.loadFile(join(__dirname, '../renderer/youtube.html'), {
                search: q ? q.slice(1) : undefined,
            })
        }
        existing.show()
        existing.focus()
        return
    }

    const work = screen.getPrimaryDisplay().workArea
    youtubeWindow = new BrowserWindow({
        width: DEFAULT_W,
        height: DEFAULT_H,
        x: work.x + work.width - DEFAULT_W - 24,
        y: work.y + work.height - DEFAULT_H - 24,
        show: false,
        frame: false,
        transparent: true,
        resizable: true,
        alwaysOnTop: true,
        hasShadow: false,
        skipTaskbar: true,
        fullscreenable: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
            // <webview>로 유튜브를 띄우므로 webviewTag 활성화.
            webviewTag: true,
            partition: 'persist:youtube',
        },
    })

    youtubeWindow.on('closed', () => {
        youtubeWindow = null
    })

    youtubeWindow.on('ready-to-show', () => {
        youtubeWindow?.show()
    })

    // 투명 창 안 <webview>(유튜브)가 HTML 전체화면(⛶)에 들어갔다 ESC로 나오면
    // Electron/Chromium 버그로 창의 투명 영역이 검정으로 굳는다(특히 Windows).
    // 전체화면 이탈 시 배경색을 투명으로 다시 지정하고 크기를 1px 흔들어
    // 컴포지터가 알파 채널로 표면을 재할당하게 해 투명을 복구한다.
    youtubeWindow.webContents.on('did-attach-webview', (_event, guest) => {
        const restoreTransparency = () => {
            // 전체화면 표면 정리가 끝난 뒤 복구하도록 한 틱 미룬다(즉시 실행 시 놓치는 경우가 있음).
            setTimeout(() => {
                if (!youtubeWindow || youtubeWindow.isDestroyed()) {
                    return
                }
                youtubeWindow.setBackgroundColor('#00000000')
                const bounds = youtubeWindow.getBounds()
                youtubeWindow.setBounds({ ...bounds, height: bounds.height + 1 })
                youtubeWindow.setBounds(bounds)
            }, 80)
        }
        guest.on('leave-html-full-screen', restoreTransparency)
    })

    const q = buildQuery(options)
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        youtubeWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/youtube.html${q}`)
    } else {
        youtubeWindow.loadFile(join(__dirname, '../renderer/youtube.html'), {
            search: q ? q.slice(1) : undefined,
        })
    }
}
