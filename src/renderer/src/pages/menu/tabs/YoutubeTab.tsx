import { useState } from 'react'
import { YOUTUBE_THEMES } from '../../youtube/themes'

// 유튜브 탭 — 열기 전에 프레임 테마를 고르고 링크를 입력한 뒤 별창을 연다.
export const YoutubeTab = () => {
    const [theme, setTheme] = useState(() => Number(localStorage.getItem('yt_theme') || '1'))
    const [url, setUrl] = useState('')

    const open = () => {
        localStorage.setItem('yt_theme', String(theme))
        window.api.youtube.open({ theme, url: url.trim() })
    }

    return (
        <div className='panel'>
            <div className='section-title-1'>유튜브</div>
            <div className='hint'>프레임을 고르고 링크를 넣어 캐릭터 옆에 띄워요</div>

            <div className='section-title-2'>프레임 테마</div>
            <div className='yt-theme-pick'>
                {YOUTUBE_THEMES.map((t) => (
                    <button
                        type='button'
                        key={t.id}
                        className={t.id === theme ? 'yt-pick active' : 'yt-pick'}
                        onClick={() => setTheme(t.id)}
                        title={t.name}
                    >
                        <img
                            src={t.src}
                            alt={t.name}
                            draggable={false}
                        />
                        <span>{t.name}</span>
                    </button>
                ))}
            </div>

            <div className='section-title-2'>유튜브 링크 (선택)</div>
            <input
                className='fi'
                placeholder='https://youtube.com/watch?v=...  (비우면 홈)'
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                        open()
                    }
                }}
            />

            <div className='yt-open-wrap'>
                <button
                    type='button'
                    className='pbtn'
                    onClick={open}
                >
                    ▶ 유튜브 열기
                </button>
            </div>
        </div>
    )
}
