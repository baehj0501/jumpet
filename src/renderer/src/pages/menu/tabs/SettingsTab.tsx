import { useEffect, useState } from 'react'
import {
    CHARACTER_DISPLAY_NAMES,
    useSelectedCharacterId,
} from '@renderer/entities/character'
import { useProfile, useProfileActions } from '@renderer/entities/profile'
import {
    PET_SCALE_MAX,
    PET_SCALE_MIN,
    THEME_IDS,
    type ThemeId,
    usePetScale,
    useSettingsActions,
    useTheme,
} from '@renderer/entities/settings'
import { ProfileRow } from '../ProfileRow'

// 테마 미리보기 색 — pixel-theme.css의 [data-theme] --bg/--accent와 동일하게 맞춘 칩 색.
const THEME_META: Record<ThemeId, { label: string; bg: string; accent: string }> = {
    skyblue: { label: '스카이블루', bg: '#e8f4ff', accent: '#3a8fc4' },
    green: { label: '연두', bg: '#eaf5e8', accent: '#3a9a3a' },
    babypink: { label: '핑크', bg: '#fde8f2', accent: '#d05090' },
    brown: { label: '브라운', bg: '#f5ede4', accent: '#8b5e3c' },
    light: { label: '라이트', bg: '#ffffff', accent: '#505050' },
    dark: { label: '다크', bg: '#1a1a1a', accent: '#c0c0c0' },
}

export const SettingsTab = () => {
    const theme = useTheme()
    const petScale = usePetScale()
    const { setTheme, setPetScale } = useSettingsActions()

    // 슬라이더는 드래그 중 즉각 반응해야 하므로 로컬 상태로 잡고, SSOT 값이 바뀌면 동기화한다.
    const [scaleDraft, setScaleDraft] = useState(petScale)
    useEffect(() => {
        setScaleDraft(petScale)
    }, [petScale])

    // 내 정보(profile SSOT) — 홈 탭과 같은 값을 편집한다.
    const profile = useProfile()
    const { setField } = useProfileActions()
    const currentCharacterId = useSelectedCharacterId()
    // 캐릭터 이름은 선택된 캐릭터의 고정 종류명(수정 불가).
    const characterName = CHARACTER_DISPLAY_NAMES[currentCharacterId] ?? currentCharacterId

    const [version, setVersion] = useState('')
    useEffect(() => {
        // preload가 아직 app을 노출하지 않으면(dev에서 preload 미재시작) 건너뛴다.
        if (!window.api?.app) {
            return
        }
        void window.api.app
            .getVersion()
            .then(setVersion)
            .catch(() => setVersion(''))
    }, [])

    const onScaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = Number(event.target.value) / 100
        setScaleDraft(next)
        void setPetScale(next)
    }

    const onResetAll = () => {
        const confirmed = window.confirm(
            '모든 데이터(점수·할일·일정·아이템·데코·설정)를 삭제하고 앱을 다시 시작할까요?\n이 작업은 되돌릴 수 없어요.',
        )
        if (confirmed) {
            void window.api.app.resetAll()
        }
    }

    return (
        <div className='panel settings-panel'>
            {/* 테마 */}
            <div className='section-title-1'>테마</div>
            <div className='theme-grid'>
                {THEME_IDS.map((id) => {
                    const meta = THEME_META[id]
                    return (
                        <button
                            type='button'
                            key={id}
                            className={id === theme ? 'theme-swatch active' : 'theme-swatch'}
                            onClick={() => void setTheme(id)}
                            title={meta.label}
                        >
                            <span
                                className='theme-swatch-chip'
                                style={{ background: meta.bg }}
                            >
                                <span
                                    className='theme-swatch-dot'
                                    style={{ background: meta.accent }}
                                />
                            </span>
                            <span className='theme-swatch-label'>{meta.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* 캐릭터 크기 */}
            <div className='section-title-1'>캐릭터 크기</div>
            <div className='scale-row'>
                <input
                    type='range'
                    className='settings-slider'
                    min={Math.round(PET_SCALE_MIN * 100)}
                    max={Math.round(PET_SCALE_MAX * 100)}
                    step={10}
                    value={Math.round(scaleDraft * 100)}
                    onChange={onScaleChange}
                />
                <span className='scale-value'>{Math.round(scaleDraft * 100)}%</span>
            </div>

            {/* 내 정보 */}
            <div className='section-title-1'>내 정보</div>
            <div className='profile-rows'>
                <ProfileRow
                    icon='🌿'
                    label='캐릭터 이름'
                    value={characterName}
                />
                <ProfileRow
                    icon='💗'
                    label='내 이름'
                    value={profile.petName}
                    onChange={(value) => void setField('petName', value)}
                />
                <ProfileRow
                    icon='🎂'
                    label='생일'
                    value={profile.birthday}
                    onChange={(value) => void setField('birthday', value)}
                />
            </div>

            {/* 앱 정보 / 종료 */}
            <div className='section-title-1'>앱</div>
            <div className='hint'>JUMPET {version && `v${version}`}</div>
            <button
                type='button'
                className='pbtn ghost'
                onClick={onResetAll}
            >
                데이터 초기화
            </button>
            <button
                type='button'
                className='pbtn'
                onClick={() => void window.api.app.quit()}
            >
                앱 종료
            </button>
        </div>
    )
}
