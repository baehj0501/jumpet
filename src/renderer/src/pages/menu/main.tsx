import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializePlayerSync } from '@renderer/entities/player'
import { initializeItemSync } from '@renderer/entities/item'
import { initializeTodoSync } from '@renderer/entities/todo'
import { initializeFortuneSync } from '@renderer/entities/fortune'
import { initializeScheduleSync } from '@renderer/entities/schedule'
import { initializeCharacterSelectionSync } from '@renderer/entities/character'
import { initializeProfileSync } from '@renderer/entities/profile'
import { initializePetSync } from '@renderer/entities/pet'
import { initializeWorldSync } from '@renderer/entities/world'
import { MenuPage } from './MenuPage'
import '@renderer/app/styles/pixel-theme.css'

// 통합 메뉴 창은 여러 도메인을 한 창에서 본다 — 각 동기화를 1회씩 명시 호출.
initializePlayerSync()
initializeItemSync()
initializeTodoSync()
initializeFortuneSync()
initializeScheduleSync()
initializeCharacterSelectionSync()
initializeProfileSync()
initializePetSync()
initializeWorldSync()

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
    <StrictMode>
        <MenuPage />
    </StrictMode>,
)
