import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeTodoSync } from '@renderer/entities/todo'
import { TodoPage } from './TodoPage'
import '@renderer/app/styles/base.css'

// 모듈 사이드이펙트로 자동 호출되던 동기화를 entrypoint로 끌어왔다.
// 테스트/Storybook 등에서 entities/todo 모듈을 import만 해도 IPC가 호출되던 문제 회피.
initializeTodoSync()

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
    <StrictMode>
        <TodoPage />
    </StrictMode>,
)
