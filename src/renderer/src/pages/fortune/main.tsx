import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeFortuneSync } from '@renderer/entities/fortune'
import { FortunePage } from './FortunePage'
import '@renderer/app/styles/base.css'

// 모듈 사이드이펙트가 아니라 entrypoint에서 동기화를 1회 명시 호출한다.
initializeFortuneSync()

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
    <StrictMode>
        <FortunePage />
    </StrictMode>,
)
