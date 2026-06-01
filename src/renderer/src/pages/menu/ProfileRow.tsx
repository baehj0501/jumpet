import { useState } from 'react'

// 프로필 한 줄 — 아이콘 + 라벨 + 값 박스 + 연필(클릭 시 인라인 편집).
// 홈 탭(CareTab)과 설정 탭(SettingsTab)이 공유한다.
// onChange를 주지 않으면 읽기 전용(연필 없음) — 예: 캐릭터 이름.
export const ProfileRow = ({
    icon,
    label,
    value,
    onChange,
    placeholder,
}: {
    icon: string
    label: string
    value: string
    onChange?: (value: string) => void
    placeholder?: string
}) => {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(value)

    const startEdit = () => {
        setDraft(value)
        setEditing(true)
    }
    const commit = () => {
        const trimmed = draft.trim()
        if (trimmed !== '' && onChange) {
            onChange(trimmed)
        }
        setEditing(false)
    }

    // 읽기 전용 — 값만 표시하고 연필 자리는 빈 placeholder로 정렬만 맞춘다.
    if (!onChange) {
        return (
            <div className='profile-row'>
                <span className='profile-row-icon'>{icon}</span>
                <span className='profile-row-label'>{label}</span>
                <span className='profile-row-value'>{value}</span>
                <span className='profile-row-edit-placeholder' />
            </div>
        )
    }

    return (
        <div className='profile-row'>
            <span className='profile-row-icon'>{icon}</span>
            <span className='profile-row-label'>{label}</span>
            {editing ? (
                <input
                    className='fi profile-row-input'
                    autoFocus
                    placeholder={placeholder}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={commit}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                            commit()
                        } else if (event.key === 'Escape') {
                            setEditing(false)
                        }
                    }}
                />
            ) : (
                <span className='profile-row-value'>{value}</span>
            )}
            <button
                type='button'
                className='profile-row-edit'
                onClick={startEdit}
                title='수정'
            >
                ✎
            </button>
        </div>
    )
}
