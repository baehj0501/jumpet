import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeCharacterSelectionSync } from '@renderer/entities/character'
import { initializeProfileSync } from '@renderer/entities/profile'
import { initializePetSync } from '@renderer/entities/pet'
import { App } from './App'
import './styles/base.css'
import './styles/global.css'

// 펫 윈도우도 선택된 캐릭터(SSOT) + 프로필(이름 등) + 동반 펫을 구독한다 — 홈/펫탭에서 바꾸면 함께 반영.
initializeCharacterSelectionSync()
initializeProfileSync()
initializePetSync()

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
