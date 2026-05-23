import { memo } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import {
    LINK_EMOJIS,
    MAX_LINK_NAME_LENGTH,
    type LinkEmoji,
} from '@renderer/entities/link'

// 입력 위젯의 크기 변형.
// - 'comfortable': 새 링크 추가 폼(LinkForm)에서 사용. 패널 헤더의 여유 있는 입력.
// - 'compact': 항목 인라인 편집(LinkItemEdit)에서 사용. 리스트 안 좁은 공간.
export type LinkFieldsSize = 'comfortable' | 'compact'

type SizeTokens = {
    emojiButton: number
    emojiFontSize: number
    inputPadding: string
    inputFontSize: number
    gridGap: number
}

const SIZE_TOKENS: Record<LinkFieldsSize, SizeTokens> = {
    comfortable: {
        emojiButton: 28,
        emojiFontSize: 16,
        inputPadding: '8px 10px',
        inputFontSize: 13,
        gridGap: 4,
    },
    compact: {
        emojiButton: 24,
        emojiFontSize: 14,
        inputPadding: '5px 8px',
        inputFontSize: 13,
        gridGap: 3,
    },
}

type LinkFieldsProps = {
    emoji: LinkEmoji
    name: string
    url: string
    onEmojiChange: (next: LinkEmoji) => void
    onNameChange: (next: string) => void
    onUrlChange: (next: string) => void
    onNameKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
    onUrlKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
    nameInputRef?: React.Ref<HTMLInputElement>
    urlInputRef?: React.Ref<HTMLInputElement>
    namePlaceholder?: string
    urlPlaceholder?: string
    size: LinkFieldsSize
    // 편집 모드는 input border를 강조 색(파랑)으로, 추가 모드는 기본 색으로 — 동일 위젯의 모드 표시.
    variant?: 'default' | 'focused'
}

// 링크 입력 3-필드 위젯.
// 이모지 picker(12개 화이트리스트) + 이름 input + URL input을 한 곳에 응집.
// LinkForm(추가)과 LinkItemEdit(편집)이 모두 이 컴포넌트를 사용해 picker UI와 입력 검증의
// 단일 출처를 보장한다. picker는 data-attribute + 단일 핸들러 위임으로 12개 inline 클로저를 제거.
export const LinkFields = memo(
    ({
        emoji,
        name,
        url,
        onEmojiChange,
        onNameChange,
        onUrlChange,
        onNameKeyDown,
        onUrlKeyDown,
        nameInputRef,
        urlInputRef,
        namePlaceholder = '이름',
        urlPlaceholder = 'example.com',
        size,
        variant = 'default',
    }: LinkFieldsProps) => {
        const tokens = SIZE_TOKENS[size]

        // data-attribute로 어떤 이모지를 골랐는지 식별 → 단일 핸들러로 위임.
        // map 안의 inline 클로저(매 렌더 재생성) 12개를 제거한다.
        const handleEmojiPick = (event: MouseEvent<HTMLButtonElement>) => {
            const picked = event.currentTarget.dataset.emoji
            if (picked === undefined) {
                return
            }
            // LINK_EMOJIS 외 값이 data-attribute에 들어올 일은 없지만, 타입 안전을 위해 narrowing.
            onEmojiChange(picked as LinkEmoji)
        }

        const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
            onNameChange(event.target.value)
        }

        const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
            onUrlChange(event.target.value)
        }

        const inputBorderColor = variant === 'focused' ? '#4a90e2' : '#dcdcdc'

        return (
            <div
                css={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                }}
            >
                <div
                    css={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: tokens.gridGap,
                    }}
                    role='radiogroup'
                    aria-label='이모지'
                >
                    {LINK_EMOJIS.map((option) => (
                        <button
                            key={option}
                            type='button'
                            css={{
                                width: tokens.emojiButton,
                                height: tokens.emojiButton,
                                border: '1px solid transparent',
                                borderRadius: 6,
                                background: 'transparent',
                                fontSize: tokens.emojiFontSize,
                                lineHeight: 1,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                '&:hover': {
                                    background: '#f0f3f8',
                                },
                                '&[data-selected="true"]': {
                                    borderColor: '#4a90e2',
                                    background: '#eaf2fc',
                                },
                            }}
                            data-emoji={option}
                            data-selected={emoji === option}
                            role='radio'
                            aria-checked={emoji === option}
                            aria-label={option}
                            onClick={handleEmojiPick}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                <div
                    css={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                    }}
                >
                    <input
                        ref={nameInputRef}
                        css={{
                            padding: tokens.inputPadding,
                            fontSize: tokens.inputFontSize,
                            border: `1px solid ${inputBorderColor}`,
                            borderRadius: 4,
                            outline: 'none',
                            background: '#ffffff',
                            color: 'inherit',
                            fontFamily: 'inherit',
                            '&:focus': {
                                borderColor: '#4a90e2',
                            },
                        }}
                        type='text'
                        value={name}
                        onChange={handleNameChange}
                        onKeyDown={onNameKeyDown}
                        placeholder={namePlaceholder}
                        aria-label='링크 이름'
                        maxLength={MAX_LINK_NAME_LENGTH}
                    />
                    <input
                        ref={urlInputRef}
                        css={{
                            padding: tokens.inputPadding,
                            fontSize: tokens.inputFontSize,
                            border: `1px solid ${inputBorderColor}`,
                            borderRadius: 4,
                            outline: 'none',
                            background: '#ffffff',
                            color: 'inherit',
                            fontFamily: 'inherit',
                            '&:focus': {
                                borderColor: '#4a90e2',
                            },
                        }}
                        type='text'
                        value={url}
                        onChange={handleUrlChange}
                        onKeyDown={onUrlKeyDown}
                        placeholder={urlPlaceholder}
                        aria-label='링크 URL'
                    />
                </div>
            </div>
        )
    },
)
