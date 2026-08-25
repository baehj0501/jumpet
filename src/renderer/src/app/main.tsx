import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeCharacterSelectionSync } from '@renderer/entities/character'
import { initializeProfileSync } from '@renderer/entities/profile'
import { initializePetSync } from '@renderer/entities/pet'
import { initializeSettingsSync } from '@renderer/entities/settings'
import { App } from './App'
import { runTestUnlockIfEnabled } from './testUnlock'
import './styles/base.css'
import './styles/global.css'

// 펫 윈도우도 선택된 캐릭터(SSOT) + 프로필(이름 등) + 동반 펫 + 환경설정(크기)을 구독한다.
initializeCharacterSelectionSync()
initializeProfileSync()
initializePetSync()
initializeSettingsSync()

// 테스트 빌드(VITE_TEST_UNLOCK=1)에서만 캐릭터·펫·데코 전체 잠금 해제. 배포 빌드에선 무동작.
void runTestUnlockIfEnabled()

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
