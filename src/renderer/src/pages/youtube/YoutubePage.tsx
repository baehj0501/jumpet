import { createElement, useEffect, useRef, useState } from 'react'
import {
    BASE_H,
    BASE_W,
    THEME_HOLES,
    YOUTUBE_THEMES as THEMES,
    resolveYoutubeSrc,
    themeSrc,
} from './themes'

// 뷰어(프레임) 크기 5단계(%). 1=가장 작게 … 5=가장 크게(120%). 우클릭 메뉴에서 고른다.
const SIZE_STEP_PCTS = [60, 75, 90, 105, 120]
const DEFAULT_SIZE_STEP = 3

// 둘러보기(비-전용영상)에서 webview에 렌더할 유튜브 페이지의 가상 뷰포트 폭(px).
// 값이 작을수록 페이지가 더 좁은(=크게 확대된) 레이아웃으로 렌더돼 영상이 커진다.
const BROWSE_VIEWPORT_W = 450

// 메뉴에서 열 때 넘어온 옵션(쿼리). theme=프레임, video=재생할 유튜브 URL.
const openParams = new URLSearchParams(window.location.search)
const initialTheme = Number(openParams.get('theme') || localStorage.getItem('yt_theme') || '1')
// 특정 영상이면 임베드 iframe으로 재생, 아니면 유튜브 홈 둘러보기(webview).
const { src: initialSrc, isVideo } = resolveYoutubeSrc(openParams.get('video') || '')

// 홈/둘러보기 — 상단 헤더만 숨김(재생 레이아웃 안 건드림).
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

    // 영상=iframe, 둘러보기=webview. 둘 다 같은 id/CSS로 프레임 구멍에 맞춘다.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerRef = useRef<any>(null)

    // 뷰포트(실제 창) 크기 기준으로 플레이어를 프레임 구멍에 맞춘다.
    const positionPlayer = (themeId: number) => {
        const el = playerRef.current
        if (!el) {
            return
        }
        const scaleX = window.innerWidth / BASE_W
        const scaleY = window.innerHeight / BASE_H
        // 삭제된 테마 id가 저장돼 있어도 안전하게 — 없으면 기본(1)으로 폴백.
        const base = THEME_HOLES[themeId] ?? THEME_HOLES[1]
        const width = Math.round(base.width * scaleX)
        const height = Math.round(base.height * scaleY)
        el.style.left = `${Math.round(base.left * scaleX)}px`
        el.style.top = `${Math.round(base.top * scaleY)}px`
        el.style.width = `${width}px`
        el.style.height = `${height}px`
        // 둘러보기 webview만 좁은 가상 뷰포트로 확대. 영상(iframe 임베드)은 그대로 프레임을 꽉 채운다.
        if (!isVideo) {
            try {
                el.setZoomFactor(width / BROWSE_VIEWPORT_W)
            } catch {
                // dom-ready 전이면 무시.
            }
        }
    }

    useEffect(() => {
        positionPlayer(theme)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme])

    useEffect(() => {
        const onResize = () => positionPlayer(theme)
        window.addEventListener('resize', onResize)
        const el = playerRef.current
        // 둘러보기 webview는 dom-ready에서 헤더 숨김 CSS 주입. 영상 iframe은 load에서 위치만 재보정.
        const readyEvent = isVideo ? 'load' : 'dom-ready'
        const onReady = () => {
            positionPlayer(theme)
            if (!isVideo) {
                try {
                    el.insertCSS(BROWSE_CSS)
                } catch {
                    // webview 미준비면 무시.
                }
            }
        }
        el?.addEventListener(readyEvent, onReady)
        return () => {
            window.removeEventListener('resize', onResize)
            el?.removeEventListener(readyEvent, onReady)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme])

    // 프레임 우클릭 → OS 네이티브 컨텍스트 메뉴를 main에 요청한다.
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
            {isVideo
                ? createElement('iframe', {
                      id: 'yt-webview',
                      ref: playerRef,
                      src: initialSrc,
                      allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
                      allowFullScreen: true,
                  })
                : createElement('webview', {
                      id: 'yt-webview',
                      ref: playerRef,
                      src: initialSrc,
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
