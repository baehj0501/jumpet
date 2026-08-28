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
// 전용 영상(watch 페이지)에서 쓸 가상 뷰포트 폭(px). watch 플레이어는 최소 높이 ~240px라,
// 폭을 427px 기준으로 렌더한 뒤 zoom으로 프레임 구멍에 맞춘다.
const VIDEO_VIEWPORT_W = 427

// 메뉴에서 열 때 넘어온 옵션(쿼리). theme=프레임, video=재생할 유튜브 URL.
const openParams = new URLSearchParams(window.location.search)
const initialTheme = Number(openParams.get('theme') || localStorage.getItem('yt_theme') || '1')
// 특정 영상이면 플레이어만 꽉 채움, 아니면 유튜브 홈 둘러보기.
const { src: initialSrc, isVideo } = resolveYoutubeSrc(openParams.get('video') || '')

// 전용 영상(watch 페이지) — 상단 헤더/댓글/추천을 숨기고 플레이어를 프레임 위쪽에 맞춘다.
const FILL_CSS =
    'ytd-masthead,#masthead,#masthead-container{display:none!important;}' +
    '#secondary,#secondary-inner,#below,#comments,ytd-comments,#chat,#related{display:none!important;}' +
    'ytd-app{--ytd-masthead-height:0px!important;}' +
    'ytd-page-manager,#page-manager{margin-top:0!important;padding-top:0!important;}' +
    'html,body{overflow:hidden!important;}'

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
        const holeWidth = Math.round(base.width * scaleX)
        const holeHeight = Math.round(base.height * scaleY)
        let width = holeWidth
        let height = holeHeight
        let top = Math.round(base.top * scaleY)
        if (isVideo) {
            height = Math.round((holeWidth * 9) / 16)
            top += Math.round((holeHeight - height) / 2)
        }
        el.style.left = `${Math.round(base.left * scaleX)}px`
        el.style.top = `${top}px`
        el.style.width = `${width}px`
        el.style.height = `${height}px`
        try {
            el.setZoomFactor(isVideo ? width / VIDEO_VIEWPORT_W : width / BROWSE_VIEWPORT_W)
        } catch {
            // dom-ready 전이면 무시.
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
        const onReady = () => {
            positionPlayer(theme)
            try {
                el.insertCSS(isVideo ? FILL_CSS : BROWSE_CSS)
            } catch {
                // webview 미준비면 무시.
            }
        }
        el?.addEventListener('dom-ready', onReady)
        return () => {
            window.removeEventListener('resize', onResize)
            el?.removeEventListener('dom-ready', onReady)
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
            {createElement('webview', {
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
