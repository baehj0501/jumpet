import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { YoutubePage } from './YoutubePage'
import { YoutubeMenu } from './YoutubeMenu'
import './youtube.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Root element #root not found')
}

// ?menu=1 이면 이 창은 뷰어가 아니라 우클릭 메뉴 팝업 창이다(별도 창이라 안 잘림).
const isMenu = new URLSearchParams(window.location.search).get('menu') === '1'

createRoot(rootElement).render(
    <StrictMode>{isMenu ? <YoutubeMenu /> : <YoutubePage />}</StrictMode>,
)
