import { createElement, useEffect, useRef, useState } from 'react'
import {
    BASE_H,
    BASE_W,
    THEME_HOLES,
    YOUTUBE_THEMES as THEMES,
    resolveYoutubeSrc,
    themeSrc,
    watchUrl,
} from './themes'

// 뷰어(프레임) 크기 5단계(%). 1=가장 작게 … 5=가장 크게(120%). 우클릭 메뉴에서 고른다.
const SIZE_STEP_PCTS = [60, 75, 90, 105, 120]
const DEFAULT_SIZE_STEP = 3

// 둘러보기(비-전용영상)에서 webview에 렌더할 유튜브 페이지의 가상 뷰포트 폭(px).
// 값이 작을수록 페이지가 더 좁은(=크게 확대된) 레이아웃으로 렌더돼 영상이 커진다.
// (1280=데스크탑 원본 → 영상 작음. 값이 작을수록 크게 확대된다.)
const BROWSE_VIEWPORT_W = 450

// 메뉴에서 열 때 넘어온 옵션(쿼리). theme=프레임, video=재생할 유튜브 URL.
const openParams = new URLSearchParams(window.location.search)
const initialTheme = Number(openParams.get('theme') || localStorage.getItem('yt_theme') || '1')
// 특정 영상이면 플레이어만 꽉 채움, 아니면 유튜브 홈 둘러보기.
const { src: initialVideo, isVideo, videoId } = resolveYoutubeSrc(openParams.get('video') || '')

// 전용 영상으로 열었을 때 — 플레이어만 남기고 꽉 채움(검증된 규칙). 스크롤 잠금 + 검정 배경.
const FILL_CSS =
    'ytd-masthead,#masthead,#masthead-container{display:none!important;}' +
    '#secondary,#below,ytd-comments,#chat{display:none!important;}' +
    'ytd-page-manager{margin-top:0!important;}' +
    'ytd-watch-flexy #primary,#primary,#primary-inner,#player,#player-container,' +
    '#player-container-outer,#player-container-inner,#movie_player,.html5-video-player' +
    '{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;}' +
    'video.html5-main-video{width:100%!important;height:100%!important;}' +
    'html,body{overflow:hidden!important;background:#000!important;}'

// 홈/둘러보기 — 상단 헤더만 숨김(검증된 원래 규칙, 재생 레이아웃 안 건드림).
const BROWSE_CSS =
    'ytd-masthead,#masthead,#masthead-container{display:none!important;}' +
    'ytd-page-manager{margin-top:0!important;}'

export const YoutubePage = () => {
    const [theme, setTheme] = useState(() => initialTheme)
    const [sizeStep, setSizeStep] = useState(() => {
        const saved = Number(localStorage.getItem('yt_size_step'))
        return saved >= 1 && saved <= SIZE_STEP_PCTS.length ? saved : DEFAULT_SIZE_STEP
    })
    // 항상 위 / 일반 z-order. 기본 true(항상 위). 우클릭 메뉴에서 토글, localStorage에 저장.
    const [alwaysOnTop, setAlwaysOnTop] = useState(
        () => localStorage.getItem('yt_always_on_top') !== 'false',
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webviewRef = useRef<any>(null)
    // 임베드가 오류 153(임베드 차단)으로 실패하면 watch 페이지로 한 번만 폴백한다.
    const watchFallbackRef = useRef(false)

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
            // 임베드로 재생 중인 전용 영상은 줌 1(이미 프레임을 꽉 채움).
            // 둘러보기·watch 폴백 영상은 좁은 가상 뷰포트로 렌더해 영상을 크게 확대한다.
            const isEmbedFull = isVideo && !watchFallbackRef.current
            wv.setZoomFactor(isEmbedFull ? 1 : width / BROWSE_VIEWPORT_W)
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
            // 임베드로 연 전용 영상이 오류 153(임베드 차단)을 띄우면 watch 페이지로 폴백(1회).
            if (isVideo && videoId && !watchFallbackRef.current) {
                setTimeout(() => {
                    wv.executeJavaScript("!!document.querySelector('.ytp-error')")
                        .then((hasError: boolean) => {
                            if (hasError && !watchFallbackRef.current) {
                                watchFallbackRef.current = true
                                wv.src = watchUrl(videoId)
                            }
                        })
                        .catch(() => {})
                }, 1600)
            }
        }
        wv?.addEventListener('dom-ready', onReady)
        return () => {
            window.removeEventListener('resize', onResize)
            wv?.removeEventListener('dom-ready', onReady)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme])

    // 프레임 우클릭 → OS 네이티브 컨텍스트 메뉴를 main에 요청한다.
    // (HTML 메뉴는 작은 창 안에 그려져 잘리므로, 창 크기와 무관한 네이티브 메뉴로 띄운다.)
    useEffect(() => {
        const onCtx = (event: MouseEvent) => {
            event.preventDefault()
            window.api.youtube.openContextMenu({
                theme,
                sizeStep,
                alwaysOnTop,
                sizeCount: SIZE_STEP_PCTS.length,
                themes: THEMES.map((t) => ({ id: t.id, name: t.name })),
            })
        }
        window.addEventListener('contextmenu', onCtx)
        return () => window.removeEventListener('contextmenu', onCtx)
    }, [theme, sizeStep, alwaysOnTop])

    const applySize = (step: number) => {
        const pct = SIZE_STEP_PCTS[step - 1] ?? SIZE_STEP_PCTS[DEFAULT_SIZE_STEP - 1]
        window.api.youtube.resize(
            Math.round((BASE_W * pct) / 100),
            Math.round((BASE_H * pct) / 100),
        )
    }
    // 창을 열 때 저장된 단계 크기 + 항상 위 설정을 한 번 적용한다.
    useEffect(() => {
        applySize(sizeStep)
        window.api.youtube.setAlwaysOnTop(alwaysOnTop)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const applyAlwaysOnTop = (value: boolean) => {
        setAlwaysOnTop(value)
        localStorage.setItem('yt_always_on_top', String(value))
        window.api.youtube.setAlwaysOnTop(value)
    }
    const chooseSize = (step: number) => {
        setSizeStep(step)
        localStorage.setItem('yt_size_step', String(step))
        applySize(step)
    }
    const chooseTheme = (id: number) => {
        setTheme(id)
        localStorage.setItem('yt_theme', String(id))
    }

    // 네이티브 컨텍스트 메뉴에서 고른 결과(main→renderer)를 받아 적용한다.
    useEffect(() => {
        return window.api.youtube.onMenuAction((action) => {
            if (action.type === 'theme') {
                chooseTheme(Number(action.value))
            } else if (action.type === 'size') {
                chooseSize(Number(action.value))
            } else if (action.type === 'alwaysOnTop') {
                applyAlwaysOnTop(Boolean(action.value))
            } else if (action.type === 'close') {
                window.api.youtube.close()
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
        </>
    )
}
