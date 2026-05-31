import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeCharacterSelectionSync } from '@renderer/entities/character'
import { App } from './App'
import './styles/base.css'
import './styles/global.css'

// 펫 윈도우도 선택된 캐릭터(SSOT)를 구독한다 — 홈 탭에서 바꾸면 함께 교체.
initializeCharacterSelectionSync()

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
