import { createElement, useEffect, useRef, useState } from 'react'
import {
    BASE_H,
    BASE_W,
    THEME_HOLES,
    YOUTUBE_THEMES as THEMES,
    resolveYoutubeSrc,
    themeSrc,
} from './themes'

// 뷰어 크기 5단계(%). 1=가장 작게 … 5=가장 크게(120%). 우클릭 메뉴에서 고른다.
const SIZE_STEP_PCTS = [60, 75, 90, 105, 120]
const DEFAULT_SIZE_STEP = 3

// 메뉴에서 열 때 넘어온 옵션(쿼리). theme=프레임, video=재생할 유튜브 URL.
const openParams = new URLSearchParams(window.location.search)
const initialTheme = Number(openParams.get('theme') || localStorage.getItem('yt_theme') || '1')
// 특정 영상이면 플레이어만 꽉 채움, 아니면 유튜브 홈 둘러보기.
const { src: initialVideo, isVideo } = resolveYoutubeSrc(openParams.get('video') || '')

// watch 페이지에서 플레이어만 남기고 꽉 채우는 CSS(추천/댓글/헤더 숨김 + 플레이어 100%).
const FILL_CSS =
    'ytd-masthead,#masthead,#masthead-container{display:none!important;}' +
    '#secondary,#below,ytd-comments,#chat{display:none!important;}' +
    'ytd-page-manager{margin-top:0!important;}' +
    'ytd-watch-flexy #primary,#primary,#primary-inner,#player,#player-container,' +
    '#player-container-outer,#player-container-inner,#movie_player,.html5-video-player' +
    '{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;}' +
    'video.html5-main-video{width:100%!important;height:100%!important;}' +
    'html,body{overflow:hidden!important;background:#000!important;}'

// 홈/둘러보기 — 상단 헤더만 숨김.
const BROWSE_CSS =
    'ytd-masthead,#masthead,#masthead-container{display:none!important;}' +
    'ytd-page-manager{margin-top:0!important;}'

export const YoutubePage = () => {
    const [theme, setTheme] = useState(() => initialTheme)
    const [sizeStep, setSizeStep] = useState(() => {
        const saved = Number(localStorage.getItem('yt_size_step'))
        return saved >= 1 && saved <= SIZE_STEP_PCTS.length ? saved : DEFAULT_SIZE_STEP
    })
    const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webviewRef = useRef<any>(null)

    // 뷰포트(실제 창) 크기 기준으로 webview를 프레임 구멍에 맞춘다.
    const positionWebview = (themeId: number) => {
        const wv = webviewRef.current
        if (!wv) {
            return
        }
        const scaleX = window.innerWidth / BASE_W
        const scaleY = window.innerHeight / BASE_H
        const base = THEME_HOLES[themeId]
        const width = Math.round(base.width * scaleX)
        const height = Math.round(base.height * scaleY)
        wv.style.left = `${Math.round(base.left * scaleX)}px`
        wv.style.top = `${Math.round(base.top * scaleY)}px`
        wv.style.width = `${width}px`
        wv.style.height = `${height}px`
        try {
            wv.setZoomFactor(isVideo ? 1 : width / 1280)
        } catch {
            // dom-ready 전이면 무시.
        }
    }

    useEffect(() => {
        positionWebview(theme)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme])

    useEffect(() => {
        const onResize = () => positionWebview(theme)
        window.addEventListener('resize', onResize)
        const wv = webviewRef.current
        const onReady = () => {
            positionWebview(theme)
            try {
                wv.insertCSS(isVideo ? FILL_CSS : BROWSE_CSS)
            } catch {
                // webview 미준비면 무시.
            }
        }
        wv?.addEventListener('dom-ready', onReady)
        return () => {
            window.removeEventListener('resize', onResize)
            wv?.removeEventListener('dom-ready', onReady)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme])

    // 컨텍스트 메뉴 — 프레임 우클릭.
    useEffect(() => {
        const onCtx = (event: MouseEvent) => {
            event.preventDefault()
            const x = Math.min(event.clientX, window.innerWidth - 180)
            const y = Math.min(event.clientY, window.innerHeight - 200)
            setCtx({ x: Math.max(4, x), y: Math.max(4, y) })
        }
        const onClickAway = () => setCtx(null)
        window.addEventListener('contextmenu', onCtx)
        window.addEventListener('mousedown', onClickAway)
        return () => {
            window.removeEventListener('contextmenu', onCtx)
            window.removeEventListener('mousedown', onClickAway)
        }
    }, [])

    const applySize = (step: number) => {
        const pct = SIZE_STEP_PCTS[step - 1] ?? SIZE_STEP_PCTS[DEFAULT_SIZE_STEP - 1]
        window.api.youtube.resize(
            Math.round((BASE_W * pct) / 100),
            Math.round((BASE_H * pct) / 100),
        )
    }
    // 창을 열 때 저장된 단계 크기로 한 번 맞춘다.
    useEffect(() => {
        applySize(sizeStep)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const chooseSize = (step: number) => {
        setSizeStep(step)
        localStorage.setItem('yt_size_step', String(step))
        applySize(step)
        setCtx(null)
    }
    const chooseTheme = (id: number) => {
        setTheme(id)
        localStorage.setItem('yt_theme', String(id))
        setCtx(null)
    }

    return (
        <>
            {createElement('webview', {
                id: 'yt-webview',
                ref: webviewRef,
                src: initialVideo,
                allowpopups: '',
                webpreferences: 'contextIsolation=false',
            })}

            <img
                className='yt-frame-img'
                src={themeSrc(theme)}
                alt=''
                draggable={false}
            />

            {/* 프레임 우클릭 컨텍스트 메뉴 — 테마 / 크기(1~5) / 닫기 */}
            {ctx && (
                <div
                    className='yt-ctx'
                    style={{ left: ctx.x, top: ctx.y }}
                    onMouseDown={(event) => event.stopPropagation()}
                    onContextMenu={(event) => event.preventDefault()}
                >
                    <div className='yt-ctx-title'>🎨 테마</div>
                    <div className='yt-ctx-themes'>
                        {THEMES.map((t) => (
                            <button
                                type='button'
                                key={t.id}
                                className={t.id === theme ? 'yt-ctx-theme active' : 'yt-ctx-theme'}
                                onClick={() => chooseTheme(t.id)}
                                title={t.name}
                            >
                                <img
                                    src={t.src}
                                    alt={t.name}
                                    draggable={false}
                                />
                            </button>
                        ))}
                    </div>
                    <div className='yt-ctx-title'>📐 크기</div>
                    <div className='yt-ctx-sizes'>
                        {SIZE_STEP_PCTS.map((_, index) => {
                            const step = index + 1
                            return (
                                <button
                                    type='button'
                                    key={step}
                                    className={step === sizeStep ? 'yt-ctx-size active' : 'yt-ctx-size'}
                                    onClick={() => chooseSize(step)}
                                >
                                    {step}
                                </button>
                            )
                        })}
                    </div>
                    <button
                        type='button'
                        className='yt-ctx-item danger'
                        onClick={() => window.api.youtube.close()}
                    >
                        닫기
                    </button>
                </div>
            )}
        </>
    )
}
