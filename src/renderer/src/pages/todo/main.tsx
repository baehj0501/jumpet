import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TodoPage } from './TodoPage'
import '@renderer/app/styles/base.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
    <StrictMode>
        <TodoPage />
    </StrictMode>,
)
