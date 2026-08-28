import { useEffect, useRef, useState } from 'react'
import { CHARACTER_ASSETS, useSelectedCharacterId } from '@renderer/entities/character'
import { usePlayerStore } from '@renderer/entities/player'
import { CareTab } from './tabs/CareTab'
import { TodoTab } from './tabs/TodoTab'
import { FortuneTab } from './tabs/FortuneTab'
import { GachaTab } from './tabs/GachaTab'
import { ScheduleTab } from './tabs/ScheduleTab'
import { TimerTab } from './tabs/TimerTab'
import { PetTab } from './tabs/PetTab'
import { ItemTab } from './tabs/ItemTab'
import { YoutubeTab } from './tabs/YoutubeTab'
import { SettingsTab } from './tabs/SettingsTab'
import { PixelArt } from './PixelArt'
import { TAB_ICON_ART } from './tabIcons'
import { useTimerStore } from './timerStore'
import { useTheme } from '@renderer/entities/settings'

export type TabId =
    | 'care'
    | 'pet'
    | 'todo'
    | 'timer'
    | 'fortune'
    | 'gacha'
    | 'schedule'
    | 'item'
    | 'youtube'
    | 'settings'

const TABS: { id: TabId; label: string }[] = [
    { id: 'care', label: '홈' },
    { id: 'schedule', label: '일정' },
    { id: 'todo', label: '할일' },
    { id: 'timer', label: '타이머' },
    { id: 'fortune', label: '운세' },
    { id: 'gacha', label: '뽑기' },
    { id: 'pet', label: '펫' },
    { id: 'item', label: '아이템' },
    { id: 'youtube', label: '유튜브' },
    { id: 'settings', label: '설정' },
]

// 통합 메뉴 창의 루트. 우클릭으로 열리며 탭으로 각 기능을 전환한다.
// 별창 패턴을 대체 — 모든 패널이 이 한 창의 탭으로 산다.
export const MenuPage = () => {
    const [activeTab, setActiveTab] = useState<TabId>('care')

    // 포모도로 타이머 tick 엔진 — 탭과 무관하게 항상 마운트된 MenuPage에서 1초마다 진행.
    const timerRunning = useTimerStore((state) => state.running)
    const tickTimer = useTimerStore((state) => state.tick)
    useEffect(() => {
        if (!timerRunning) {
            return
        }
        const intervalId = setInterval(() => tickTimer(), 1000)
        return () => clearInterval(intervalId)
    }, [timerRunning, tickTimer])

    // 타이머 완료 시 상단에 캐릭터가 떠서 멘트하는 배너.
    const banner = useTimerStore((state) => state.banner)
    const dismissBanner = useTimerStore((state) => state.dismissBanner)
    const characterId = useSelectedCharacterId()

    // 설정 탭에서 고른 테마(SSOT)를 문서 루트에 반영 — pixel-theme.css의 [data-theme] 토큰 전환.
    const theme = useTheme()
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    // 포인트 변동 피드백 — 점수가 바뀌면 +N/-N 토스트를 잠깐 띄운다.
    const score = usePlayerStore((state) => state.player.score)
    const prevScoreRef = useRef(score)
    const mountAtRef = useRef(Date.now())
    const [pointFx, setPointFx] = useState<{ delta: number; key: number } | null>(null)
    useEffect(() => {
        const prev = prevScoreRef.current
        prevScoreRef.current = score
        if (score === prev) {
            return
        }
        // 창 열릴 때의 초기 sync(0→실제값)는 피드백에서 제외.
        if (Date.now() - mountAtRef.current < 800) {
            return
        }
        setPointFx({ delta: score - prev, key: Date.now() })
    }, [score])

    const renderTab = () => {
        switch (activeTab) {
            case 'care':
                return <CareTab />
            case 'pet':
                return <PetTab />
            case 'todo':
                return <TodoTab />
            case 'timer':
                return <TimerTab />
            case 'fortune':
                return <FortuneTab />
            case 'gacha':
                return <GachaTab />
            case 'schedule':
                return <ScheduleTab />
            case 'item':
                return <ItemTab />
            case 'youtube':
                return <YoutubeTab />
            case 'settings':
                return <SettingsTab />
        }
    }

    return (
        <>
            {pointFx && (
                <div
                    key={pointFx.key}
                    className={pointFx.delta >= 0 ? 'point-fx plus' : 'point-fx minus'}
                    onAnimationEnd={() => setPointFx(null)}
                >
                    {pointFx.delta >= 0 ? `+${pointFx.delta}` : pointFx.delta}P
                </div>
            )}

            {banner && (
                <div
                    className='timer-banner'
                    onClick={dismissBanner}
                >
                    <img
                        className='timer-banner-character'
                        src={CHARACTER_ASSETS[characterId].default}
                        alt='캐릭터'
                        draggable={false}
                    />
                    <div className='timer-banner-text'>
                        <div className='timer-banner-title'>{banner.title}</div>
                        {banner.lines.map((line, index) => (
                            <div
                                key={index}
                                className='timer-banner-line'
                            >
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className='titlebar'>
                <div className='title'>LOOPF DESKMATE</div>
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
                            <PixelArt
                                pixels={TAB_ICON_ART[tab.id].pixels}
                                palette={TAB_ICON_ART[tab.id].palette}
                                cell={1.5}
                            />
                        </span>
                        {tab.label}
                    </div>
                ))}
            </div>

            {renderTab()}
        </>
    )
}
