import { createElement, useEffect, useRef, useState, type CSSProperties } from 'react'
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

// 전용 영상(watch 페이지)에서 쓸 가상 뷰포트 폭(px). watch 플레이어는 최소 높이 ~240px라,
// 폭이 240*16/9≈427px 이상일 때 비로소 플레이어=영상이 정확히 16:9로 최상단을 꽉 채운다.
// 이보다 좁으면 영상이 플레이어 안에서 어긋나 위/아래에 검은 여백이 생긴다.
// 그래서 뷰포트를 427로 고정 렌더한 뒤 zoom(=구멍폭/427)으로 구멍 크기에 맞춰 축소한다.
const VIDEO_VIEWPORT_W = 427

// 메뉴에서 열 때 넘어온 옵션(쿼리). theme=프레임, video=재생할 유튜브 URL.
const openParams = new URLSearchParams(window.location.search)
const initialTheme = Number(openParams.get('theme') || localStorage.getItem('yt_theme') || '1')
// 특정 영상이면 플레이어만 꽉 채움, 아니면 유튜브 홈 둘러보기.
const { src: initialVideo, isVideo, videoId } = resolveYoutubeSrc(openParams.get('video') || '')

// 전용 영상(watch 페이지)으로 열었을 때 — 상단 헤더/댓글/추천 등 잡동사니만 숨기고
// 플레이어 레이아웃/영상 요소는 건드리지 않는다.
// (과거처럼 #player/#movie_player/video에 width·height 100%를 강제하면 Windows webview에서
//  플레이어 내부 레이아웃이 깨져 영상이 검정으로만 나왔다(소리만). 강제 규칙 제거.
//  #secondary를 숨기면 #primary가 뷰포트 전체 폭이 되어, 영상이 프레임 폭을 자연히 채운다.)
const FILL_CSS =
    'ytd-masthead,#masthead,#masthead-container{display:none!important;}' +
    '#secondary,#secondary-inner,#below,#comments,ytd-comments,#chat,#related{display:none!important;}' +
    // 헤더를 숨겨도 #page-manager엔 헤더 높이만큼 padding-top(~56px)이 남아 영상을 아래로 밀어
    // 위쪽에 검은 여백이 생긴다. padding/margin과 헤더 높이 변수를 모두 0으로 만들어 최상단 정렬.
    'ytd-app{--ytd-masthead-height:0px!important;}' +
    'ytd-page-manager,#page-manager{margin-top:0!important;padding-top:0!important;}' +
    'html,body{overflow:hidden!important;}'

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
    // 우클릭 메뉴(뷰어 안에 직접 그림). null이면 닫힘. {x,y}는 창 기준 위치.
    const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)

    // 뷰포트(실제 창) 크기 기준으로 webview를 프레임 구멍에 맞춘다.
    const positionWebview = (themeId: number) => {
        const wv = webviewRef.current
        if (!wv) {
            return
        }
        const scaleX = window.innerWidth / BASE_W
        const scaleY = window.innerHeight / BASE_H
        // 삭제된 테마 id가 저장돼 있어도 안전하게 — 없으면 기본(1)으로 폴백.
        const base = THEME_HOLES[themeId] ?? THEME_HOLES[1]
        const holeWidth = Math.round(base.width * scaleX)
        const holeHeight = Math.round(base.height * scaleY)
        let left = Math.round(base.left * scaleX)
        let top = Math.round(base.top * scaleY)
        let width = holeWidth
        let height = holeHeight
        // 전용 영상은 webview를 16:9로 잡아 구멍 세로 중앙에 둔다. 뷰포트 폭을 VIDEO_VIEWPORT_W(427)로
        // 고정 렌더(아래 zoom)하면 플레이어=영상이 16:9로 최상단을 꽉 채우므로, 이 16:9 webview에 딱 맞는다.
        // (둘러보기는 페이지 전체를 봐야 하므로 구멍 전체를 그대로 쓴다.)
        if (isVideo) {
            width = holeWidth
            height = Math.round((holeWidth * 9) / 16)
            top += Math.round((holeHeight - height) / 2)
        }
        wv.style.left = `${left}px`
        wv.style.top = `${top}px`
        wv.style.width = `${width}px`
        wv.style.height = `${height}px`
        try {
            // 전용 영상: 뷰포트를 427폭으로 렌더(=구멍폭/427 zoom)해 영상이 딱 맞게 축소된다.
            // 둘러보기: 좁은 가상 뷰포트로 렌더해 영상을 크게 확대한다.
            wv.setZoomFactor(
                isVideo ? width / VIDEO_VIEWPORT_W : width / BROWSE_VIEWPORT_W,
            )
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

    // 프레임 우클릭 → 뷰어 안에 메뉴를 직접 띄운다(별도 창 없음 → 즉시·안정적).
    // 창 기준 위치로 클램프(메뉴 크기 ~200x360). macOS는 렌더러 contextmenu로,
    // Windows는 프레임이 드래그 영역이라 contextmenu가 안 와서, main이 system-context-menu를
    // 가로채 'youtube:openMenuRequest'(화면좌표)로 신호 → 창 기준으로 변환해 연다.
    const openMenuAt = (clientX: number, clientY: number) => {
        const MW = 200
        const MH = 360
        const x = Math.max(4, Math.min(clientX, window.innerWidth - MW - 4))
        const y = Math.max(4, Math.min(clientY, window.innerHeight - MH - 4))
        setMenuPos({ x, y })
    }
    useEffect(() => {
        const onCtx = (event: MouseEvent) => {
            event.preventDefault()
            openMenuAt(event.clientX, event.clientY)
        }
        window.addEventListener('contextmenu', onCtx)
        const unsubscribe = window.api.youtube.onOpenMenuRequest((point) => {
            // point는 화면 좌표 → 창 좌상단 기준으로 변환.
            openMenuAt(point.x - window.screenX, point.y - window.screenY)
        })
        return () => {
            window.removeEventListener('contextmenu', onCtx)
            unsubscribe()
        }
    }, [])

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

            {menuPos && (
                <>
                    {/* 바깥 클릭 시 닫힘 — 창 전체를 덮는 투명 백드롭(드래그 영역 아님). */}
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 19,
                            WebkitAppRegion: 'no-drag',
                        } as CSSProperties}
                        onMouseDown={() => setMenuPos(null)}
                        onContextMenu={(event) => {
                            event.preventDefault()
                            openMenuAt(event.clientX, event.clientY)
                        }}
                    />
                    <div
                        className='yt-ctx yt-ctx-popup'
                        style={{
                            position: 'fixed',
                            left: menuPos.x,
                            top: menuPos.y,
                            zIndex: 20,
                            maxHeight: 'calc(100vh - 8px)',
                            overflowY: 'auto',
                            WebkitAppRegion: 'no-drag',
                        } as CSSProperties}
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
                                    title={t.name}
                                    onClick={() => {
                                        chooseTheme(t.id)
                                        setMenuPos(null)
                                    }}
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
                            {SIZE_STEP_PCTS.map((_, index) => index + 1).map((step) => (
                                <button
                                    type='button'
                                    key={step}
                                    className={step === sizeStep ? 'yt-ctx-size active' : 'yt-ctx-size'}
                                    onClick={() => {
                                        chooseSize(step)
                                        setMenuPos(null)
                                    }}
                                >
                                    {step}
                                </button>
                            ))}
                        </div>

                        <div className='yt-ctx-title'>📌 표시</div>
                        <button
                            type='button'
                            className={alwaysOnTop ? 'yt-ctx-item active' : 'yt-ctx-item'}
                            onClick={() => applyAlwaysOnTop(!alwaysOnTop)}
                        >
                            {alwaysOnTop ? '✓ 항상 위에 표시' : '항상 위에 표시'}
                        </button>
                        <button
                            type='button'
                            className='yt-ctx-item danger'
                            onClick={() => window.api.youtube.close()}
                        >
                            닫기
                        </button>
                    </div>
                </>
            )}
        </>
    )
}
