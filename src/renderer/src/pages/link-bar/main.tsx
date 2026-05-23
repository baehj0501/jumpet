import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeLinkSync } from '@renderer/entities/link'
import { LinkBarPage } from './LinkBarPage'
import '@renderer/app/styles/base.css'

// 관리 패널과 동일 entrypoint 패턴. 모듈 import 자체로 IPC를 호출하지 않고, 여기서 1회 명시 호출.
initializeLinkSync()

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
    <StrictMode>
        <LinkBarPage />
    </StrictMode>,
)
