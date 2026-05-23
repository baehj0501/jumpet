import { memo, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Link, LinkEmoji, LinkUpdatePatch } from '@renderer/entities/link'
import { LinkFields } from './LinkFields'

type LinkItemEditProps = {
    link: Link
    onCommit: (id: string, patch: LinkUpdatePatch) => void
    onCancel: () => void
}

// 링크 항목 편집 모드.
// draft state(emoji/name/url 3개)를 자체 관리하고, 저장/취소 동작을 수행.
// LinkFields 공통 컴포넌트로 picker + 입력 UI를 위임 — LinkForm과 같은 화이트리스트/입력 정책 보장.
//
// 키보드: Enter=저장, Esc=취소. 두 input에 같은 단일 핸들러를 binding한다.
// (예측 가능성 — name/url 두 input이 동일한 키 동작을 갖는다는 의도가 한 곳에서 표현된다.)
export const LinkItemEdit = memo(({ link, onCommit, onCancel }: LinkItemEditProps) => {
    const [draftEmoji, setDraftEmoji] = useState<LinkEmoji>(link.emoji)
    const [draftName, setDraftName] = useState(link.name)
    const [draftUrl, setDraftUrl] = useState(link.url)
    const nameInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const input = nameInputRef.current
        if (input === null) {
            return
        }
        input.focus()
        // 캐럿을 끝으로 이동해서 곧바로 추가 입력할 수 있게 한다.
        const length = input.value.length
        input.setSelectionRange(length, length)
    }, [])

    const commit = () => {
        onCommit(link.id, {
            emoji: draftEmoji,
            name: draftName,
            url: draftUrl,
        })
    }

    const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            commit()
            return
        }
        if (event.key === 'Escape') {
            event.preventDefault()
            onCancel()
        }
    }

    // 빈 값 가드: reducer가 최종 안전망이지만 UI에서도 사전에 막아 사용자가 빈 저장으로 혼란을 겪지 않게.
    const isSubmittable = draftName.trim() !== '' && draftUrl.trim() !== ''

    return (
        <li
            css={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 6,
                background: '#f7faff',
                border: '1px solid #cfe0f5',
            }}
        >
            <LinkFields
                emoji={draftEmoji}
                name={draftName}
                url={draftUrl}
                onEmojiChange={setDraftEmoji}
                onNameChange={setDraftName}
                onUrlChange={setDraftUrl}
                onNameKeyDown={handleEditKeyDown}
                onUrlKeyDown={handleEditKeyDown}
                nameInputRef={nameInputRef}
                size='compact'
                variant='focused'
            />
            <div
                css={{
                    display: 'flex',
                    gap: 6,
                    justifyContent: 'flex-end',
                }}
            >
                <button
                    type='button'
                    css={{
                        padding: '4px 10px',
                        fontSize: 12,
                        border: '1px solid #dcdcdc',
                        borderRadius: 4,
                        background: '#ffffff',
                        color: '#555555',
                        cursor: 'pointer',
                    }}
                    onClick={onCancel}
                >
                    취소
                </button>
                <button
                    type='button'
                    css={{
                        padding: '4px 10px',
                        fontSize: 12,
                        border: 'none',
                        borderRadius: 4,
                        background: isSubmittable ? '#4a90e2' : '#bdbdbd',
                        color: '#ffffff',
                        cursor: isSubmittable ? 'pointer' : 'not-allowed',
                    }}
                    onClick={commit}
                    disabled={!isSubmittable}
                >
                    저장
                </button>
            </div>
        </li>
    )
})
