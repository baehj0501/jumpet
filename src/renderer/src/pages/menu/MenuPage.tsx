import { useState } from 'react'
import { CareTab } from './tabs/CareTab'
import { TodoTab } from './tabs/TodoTab'
import { FortuneTab } from './tabs/FortuneTab'
import { GachaTab } from './tabs/GachaTab'
import { ScheduleTab } from './tabs/ScheduleTab'
import { PlaceholderTab } from './tabs/PlaceholderTab'
import { PixelIcon } from './PixelIcon'

export type TabId =
    | 'care'
    | 'todo'
    | 'fortune'
    | 'gacha'
    | 'schedule'
    | 'item'
    | 'youtube'
    | 'settings'

const TABS: { id: TabId; label: string }[] = [
    { id: 'care', label: '홈' },
    { id: 'todo', label: '할일' },
    { id: 'fortune', label: '운세' },
    { id: 'gacha', label: '가챠' },
    { id: 'schedule', label: '일정' },
    { id: 'item', label: '아이템' },
    { id: 'youtube', label: '유튜브' },
    { id: 'settings', label: '설정' },
]

// 탭별 픽셀 아이콘(7×7). '#'=칠함. 그리드만 고치면 모양 변경.
const TAB_ICON_PIXELS: Record<TabId, string[]> = {
    care: ['...#...', '..###..', '.#####.', '#######', '.#####.', '.##.##.', '.##.##.'],
    todo: ['.......', '......#', '.....#.', '#...#..', '.#.#...', '..#....', '.......'],
    fortune: ['...#...', '..###..', '#######', '..###..', '...#...', '.#...#.', '#.....#'],
    gacha: ['..###..', '.#####.', '#######', '#######', '.#####.', '..###..', '...#...'],
    schedule: ['.#...#.', '#######', '#######', '#.#.#.#', '#######', '#.#.#.#', '#######'],
    item: ['.#####.', '#######', '##.#.##', '##.#.##', '#######', '#######', '.#####.'],
    youtube: ['..#....', '..##...', '..###..', '..####.', '..###..', '..##...', '..#....'],
    settings: ['.#.#.#.', '.#####.', '###.###', '##...##', '###.###', '.#####.', '.#.#.#.'],
}

// 통합 메뉴 창의 루트. 우클릭으로 열리며 탭으로 각 기능을 전환한다.
// 별창 패턴을 대체 — 모든 패널이 이 한 창의 탭으로 산다.
export const MenuPage = () => {
    const [activeTab, setActiveTab] = useState<TabId>('care')

    const renderTab = () => {
        switch (activeTab) {
            case 'care':
                return <CareTab />
            case 'todo':
                return <TodoTab />
            case 'fortune':
                return <FortuneTab />
            case 'gacha':
                return <GachaTab />
            case 'schedule':
                return <ScheduleTab />
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
                        <span className='tab-icon'>
                            <PixelIcon pixels={TAB_ICON_PIXELS[tab.id]} />
                        </span>
                        {tab.label}
                    </div>
                ))}
            </div>

            {renderTab()}
        </>
    )
}
