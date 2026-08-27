import { type CSSProperties, useState } from 'react'
import {
    CHARACTER_ASSETS,
    CHARACTER_DISPLAY_NAMES,
    type CharacterId,
    useChooseCharacter,
} from '@renderer/entities/character'
import { useProfileActions } from '@renderer/entities/profile'
import { MAX_PROFILE_VALUE_LENGTH } from '@shared/contracts/profileEvents'

// 첫 실행 온보딩 — 캐릭터 창(기본 300px) 위에 뜨는 선택 오버레이.
// 2단계: ① 캐릭터 선택 → ② 내 이름·생일 입력 → '시작하기'.
// 시작하기에서만 select()가 chosen=true로 확정 → 오버레이가 사라진다.
// (특정 캐릭터를 하드코딩하지 않고 카탈로그 순서대로 노출한다.)

const CHARACTER_IDS = Object.keys(CHARACTER_ASSETS) as CharacterId[]

// 생일 드롭다운 옵션 — 월 1~12, 일 1~31(월별 일수 검증은 생략, 생일 표기용).
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1)

// 창(기본 300px, petScale로 축소 가능)보다 콘텐츠가 커지면 위가 잘리지 않도록
// 상단 정렬 + 세로 스크롤. 크기는 작은 창에서도 다 보이게 컴팩트하게.
const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    overflowY: 'auto',
    background: '#fff8df',
    borderRadius: 16,
    boxSizing: 'border-box',
    padding: '12px 10px',
}
const titleStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: '#3a5a2a',
    textAlign: 'center',
    lineHeight: 1.3,
    flexShrink: 0,
}
const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 6,
    width: '100%',
    flexShrink: 0,
}
const cellStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '6px 4px',
    background: '#f4f8ec',
    border: '2px solid #cfe3a8',
    borderRadius: 10,
    cursor: 'pointer',
}
const thumbStyle: CSSProperties = {
    width: 50,
    height: 50,
    objectFit: 'contain',
}
const nameStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#43602c',
}

// --- 2단계(프로필 입력) 스타일 ---
const fieldStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    width: '100%',
    flexShrink: 0,
}
const labelStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#43602c',
}
const inputStyle: CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '6px 8px',
    fontSize: 12,
    border: '2px solid #cfe3a8',
    borderRadius: 8,
    outline: 'none',
    background: '#fbfdf6',
    color: '#2f4414',
}
const birthdayRowStyle: CSSProperties = {
    display: 'flex',
    gap: 6,
    width: '100%',
}
const selectStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    boxSizing: 'border-box',
    padding: '6px 8px',
    fontSize: 12,
    border: '2px solid #cfe3a8',
    borderRadius: 8,
    outline: 'none',
    background: '#fbfdf6',
    color: '#2f4414',
    cursor: 'pointer',
}
const buttonsRowStyle: CSSProperties = {
    display: 'flex',
    gap: 6,
    width: '100%',
    flexShrink: 0,
}
const backButtonStyle: CSSProperties = {
    flex: '0 0 auto',
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: 700,
    color: '#5a7a3a',
    background: '#eef4e2',
    border: '2px solid #cfe3a8',
    borderRadius: 8,
    cursor: 'pointer',
}
const startButtonStyle: CSSProperties = {
    flex: 1,
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
    background: '#8fbf3e',
    border: '2px solid #6f9e2c',
    borderRadius: 8,
    cursor: 'pointer',
}
const startButtonDisabledStyle: CSSProperties = {
    ...startButtonStyle,
    background: '#cddbb0',
    border: '2px solid #b6c896',
    cursor: 'not-allowed',
}
const pickedThumbStyle: CSSProperties = {
    width: 56,
    height: 56,
    objectFit: 'contain',
    flexShrink: 0,
}

export const CharacterPicker = () => {
    const choose = useChooseCharacter()
    const { setField } = useProfileActions()

    const [picked, setPicked] = useState<CharacterId | null>(null)
    const [name, setName] = useState('')
    const [birthMonth, setBirthMonth] = useState('')
    const [birthDay, setBirthDay] = useState('')
    const [starting, setStarting] = useState(false)

    const handleStart = async () => {
        if (!picked || name.trim() === '' || starting) {
            return
        }
        setStarting(true)
        // 프로필 먼저 저장하고, 마지막에 select()로 chosen=true 확정(→ 오버레이 언마운트).
        await setField('petName', name.trim())
        if (birthMonth !== '' && birthDay !== '') {
            // 월/일 드롭다운 → "M월 D일" (앱 공통 생일 형식, 연도 제외).
            await setField('birthday', `${birthMonth}월 ${birthDay}일`)
        }
        // 온보딩 최초 선택 — 스타터 확정(chosen=true, 이 캐릭터만 보유 → 나머지는 잠금).
        await choose(picked)
    }

    // 1단계 — 캐릭터 선택.
    if (!picked) {
        return (
            <div style={overlayStyle}>
                <div style={titleStyle}>
                    함께할 친구를
                    <br />
                    골라주세요
                </div>
                <div style={gridStyle}>
                    {CHARACTER_IDS.map((id) => (
                        <button
                            type='button'
                            key={id}
                            style={cellStyle}
                            onClick={() => setPicked(id)}
                        >
                            <img
                                src={CHARACTER_ASSETS[id].default}
                                alt={CHARACTER_DISPLAY_NAMES[id] ?? id}
                                style={thumbStyle}
                                draggable={false}
                            />
                            <span style={nameStyle}>{CHARACTER_DISPLAY_NAMES[id] ?? id}</span>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // 2단계 — 내 이름 + 생일.
    const canStart = name.trim() !== '' && !starting
    return (
        <div style={overlayStyle}>
            <img
                src={CHARACTER_ASSETS[picked].default}
                alt={CHARACTER_DISPLAY_NAMES[picked] ?? picked}
                style={pickedThumbStyle}
                draggable={false}
            />
            <div style={titleStyle}>
                {CHARACTER_DISPLAY_NAMES[picked] ?? picked}와(과)
                <br />
                함께 시작해요!
            </div>
            <div style={fieldStyle}>
                <span style={labelStyle}>내 이름</span>
                <input
                    style={inputStyle}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder='이름을 입력하세요'
                    maxLength={MAX_PROFILE_VALUE_LENGTH}
                    autoFocus
                />
            </div>
            <div style={fieldStyle}>
                <span style={labelStyle}>생일</span>
                <div style={birthdayRowStyle}>
                    <select
                        style={selectStyle}
                        value={birthMonth}
                        onChange={(event) => setBirthMonth(event.target.value)}
                    >
                        <option value=''>월</option>
                        {MONTHS.map((month) => (
                            <option
                                key={month}
                                value={month}
                            >
                                {month}월
                            </option>
                        ))}
                    </select>
                    <select
                        style={selectStyle}
                        value={birthDay}
                        onChange={(event) => setBirthDay(event.target.value)}
                    >
                        <option value=''>일</option>
                        {DAYS.map((day) => (
                            <option
                                key={day}
                                value={day}
                            >
                                {day}일
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div style={buttonsRowStyle}>
                <button
                    type='button'
                    style={backButtonStyle}
                    onClick={() => setPicked(null)}
                    disabled={starting}
                >
                    뒤로
                </button>
                <button
                    type='button'
                    style={canStart ? startButtonStyle : startButtonDisabledStyle}
                    onClick={() => void handleStart()}
                    disabled={!canStart}
                >
                    시작하기
                </button>
            </div>
        </div>
    )
}
