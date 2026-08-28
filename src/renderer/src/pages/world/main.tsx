import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeWorldSync } from '@renderer/entities/world'
import { WorldPage } from './WorldPage'
import './world.css'

// 데스크탑 하단 월드 창은 배치 상태(world SSOT)만 구독한다.
initializeWorldSync()

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
    <StrictMode>
        <WorldPage />
    </StrictMode>,
)
