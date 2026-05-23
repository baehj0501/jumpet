import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeLinkSync } from '@renderer/entities/link'
import { LinkManagerPage } from './LinkManagerPage'
import '@renderer/app/styles/base.css'

// 모듈 사이드이펙트 대신 entrypoint에서 명시 호출.
// 테스트/Storybook 등 window.api가 없는 환경에서 import만으로 깨지는 일을 막는다.
initializeLinkSync()

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
    <StrictMode>
        <LinkManagerPage />
    </StrictMode>,
)
