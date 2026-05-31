import { useState } from 'react'
import { CareTab } from './tabs/CareTab'
import { TodoTab } from './tabs/TodoTab'
import { FortuneTab } from './tabs/FortuneTab'
import { GachaTab } from './tabs/GachaTab'
import { PlaceholderTab } from './tabs/PlaceholderTab'

export type TabId =
    | 'care'
    | 'todo'
    | 'fortune'
    | 'gacha'
    | 'schedule'
    | 'item'
    | 'youtube'
    | 'settings'

const TABS: { id: TabId; icon: string; label: string }[] = [
    { id: 'care', icon: '🐾', label: '돌봄' },
    { id: 'todo', icon: '✅', label: '할일' },
    { id: 'fortune', icon: '🌸', label: '운세' },
    { id: 'gacha', icon: '🎰', label: '가챠' },
    { id: 'schedule', icon: '📅', label: '일정' },
    { id: 'item', icon: '🎒', label: '아이템' },
    { id: 'youtube', icon: '🎵', label: '유튜브' },
    { id: 'settings', icon: '⚙️', label: '설정' },
]

// 통합 메뉴 창의 루트. 우클릭으로 열리며 탭으로 각 기능을 전환한다.
// 별창 패턴을 대체 — 모든 패널이 이 한 창의 탭으로 산다.
export const MenuPage = () => {
    const [activeTab, setActiveTab] = useState<TabId>('care')

    const renderTab = () => {
        switch (activeTab) {
            case 'care':
                return <CareTab onSwitchTab={setActiveTab} />
            case 'todo':
                return <TodoTab />
            case 'fortune':
                return <FortuneTab />
            case 'gacha':
                return <GachaTab />
            case 'schedule':
                return <PlaceholderTab icon='📅' label='일정' />
            case 'item':
                return <PlaceholderTab icon='🎒' label='아이템' />
            case 'youtube':
                return <PlaceholderTab icon='🎵' label='유튜브' />
            case 'settings':
                return <PlaceholderTab icon='⚙️' label='설정' />
        }
    }

    return (
        <>
            <div className='titlebar'>
                <div className='title'>
                    <div className='dot' />
                    JUMPET
                </div>
                <button
                    type='button'
                    className='close-btn'
                    onClick={() => window.close()}
                >
                    ✕
                </button>
            </div>

            <div className='tabs'>
                {TABS.map((tab) => (
                    <div
                        key={tab.id}
                        className={tab.id === activeTab ? 'tab active' : 'tab'}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className='tab-icon'>{tab.icon}</span>
                        {tab.label}
                    </div>
                ))}
            </div>

            {renderTab()}
        </>
    )
}
