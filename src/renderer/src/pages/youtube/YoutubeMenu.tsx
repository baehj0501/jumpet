import { useState } from 'react'
import { YOUTUBE_THEMES as THEMES } from './themes'

// 별도 팝업 창에 뜨는 유튜브 뷰어 우클릭 메뉴(썸네일 유지). 현재 상태는 쿼리로 받는다.
const params = new URLSearchParams(window.location.search)
const CURRENT_THEME = Number(params.get('theme') || '1')
const CURRENT_SIZE = Number(params.get('size') || '1')
const CURRENT_AOT = params.get('aot') === '1'
const SIZE_COUNT = Number(params.get('sizeCount') || '5')

export const YoutubeMenu = () => {
    // 항상 위 토글은 클릭 즉시 표시가 바뀌도록 로컬 상태로 둔다(메뉴는 닫히지 않고 유지).
    const [alwaysOnTop, setAlwaysOnTop] = useState(CURRENT_AOT)

    const select = (action: { type: string; value?: number | boolean }): void => {
        window.api.youtube.selectMenu(action)
    }

    return (
        <div
            className='yt-ctx yt-ctx-popup'
            onContextMenu={(event) => event.preventDefault()}
        >
            <div className='yt-ctx-title'>🎨 테마</div>
            <div className='yt-ctx-themes'>
                {THEMES.map((theme) => (
                    <button
                        type='button'
                        key={theme.id}
                        className={
                            theme.id === CURRENT_THEME ? 'yt-ctx-theme active' : 'yt-ctx-theme'
                        }
                        title={theme.name}
                        onClick={() => select({ type: 'theme', value: theme.id })}
                    >
                        <img
                            src={theme.src}
                            alt={theme.name}
                            draggable={false}
                        />
                    </button>
                ))}
            </div>

            <div className='yt-ctx-title'>📐 크기</div>
            <div className='yt-ctx-sizes'>
                {Array.from({ length: SIZE_COUNT }, (_, index) => index + 1).map((step) => (
                    <button
                        type='button'
                        key={step}
                        className={step === CURRENT_SIZE ? 'yt-ctx-size active' : 'yt-ctx-size'}
                        onClick={() => select({ type: 'size', value: step })}
                    >
                        {step}
                    </button>
                ))}
            </div>

            <div className='yt-ctx-title'>📌 표시</div>
            <button
                type='button'
                className={alwaysOnTop ? 'yt-ctx-item active' : 'yt-ctx-item'}
                onClick={() => {
                    const next = !alwaysOnTop
                    setAlwaysOnTop(next)
                    select({ type: 'alwaysOnTop', value: next })
                }}
            >
                {alwaysOnTop ? '✓ 항상 위에 표시' : '항상 위에 표시'}
            </button>
            <button
                type='button'
                className='yt-ctx-item danger'
                onClick={() => select({ type: 'close' })}
            >
                닫기
            </button>
        </div>
    )
}
