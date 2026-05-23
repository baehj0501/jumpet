import { useState } from 'react'
import type { FormEvent } from 'react'
import { LINK_EMOJIS, type LinkEmoji } from '@renderer/entities/link'
import { LinkFields } from './LinkFields'

type LinkFormProps = {
    // 빈 값/잘못된 값은 reducer에서 무시되지만, 여기서도 UX 상 제출 자체를 막는다.
    onAdd: (emoji: LinkEmoji, name: string, url: string) => void
    // 5개 가득 차면 비활성.
    disabled: boolean
}

// 새 링크 입력 폼.
// 이모지(12개 중 1개) + 이름 + URL 한 줄 입력 후 추가 버튼으로 제출.
// 명세 §9.3: 이름 ≤ 20자, URL은 reducer가 https:// 자동 prefix.
// 입력 위젯은 LinkFields 공통 컴포넌트에 위임 (LinkItem 편집 모드와 동일 위젯).
export const LinkForm = ({ onAdd, disabled }: LinkFormProps) => {
    // 기본 선택 이모지 — 첫 번째(🔗). 사용자가 picker에서 다른 걸로 바꿀 수 있다.
    const [emoji, setEmoji] = useState<LinkEmoji>(LINK_EMOJIS[0])
    const [name, setName] = useState('')
    const [url, setUrl] = useState('')

    // 제출 가능 여부 — disabled prop + 입력 빈 값 가드를 한 boolean으로 모은다.
    const isSubmittable = !disabled && name.trim() !== '' && url.trim() !== ''

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!isSubmittable) {
            return
        }
        onAdd(emoji, name, url)
        setName('')
        setUrl('')
        setEmoji(LINK_EMOJIS[0])
    }

    return (
        <form
            css={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                opacity: disabled ? 0.5 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
            }}
            onSubmit={handleSubmit}
            aria-disabled={disabled}
        >
            <LinkFields
                emoji={emoji}
                name={name}
                url={url}
                onEmojiChange={setEmoji}
                onNameChange={setName}
                onUrlChange={setUrl}
                size='comfortable'
            />
            <div
                css={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                }}
            >
                <button
                    type='submit'
                    css={{
                        padding: '8px 14px',
                        fontSize: 13,
                        fontWeight: 500,
                        border: 'none',
                        borderRadius: 6,
                        background: '#4a90e2',
                        color: '#ffffff',
                        cursor: 'pointer',
                        '&:hover': {
                            background: '#3a7ec8',
                        },
                        '&:disabled': {
                            background: '#bdbdbd',
                            cursor: 'not-allowed',
                        },
                    }}
                    disabled={!isSubmittable}
                >
                    추가
                </button>
            </div>
        </form>
    )
}
