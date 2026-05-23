import { memo, useState } from 'react'
import type { Link, LinkUpdatePatch } from '@renderer/entities/link'
import { LinkItemView } from './LinkItemView'
import { LinkItemEdit } from './LinkItemEdit'

type LinkItemProps = {
    link: Link
    onOpen: (url: string) => void
    onRemove: (id: string) => void
    onUpdate: (id: string, patch: LinkUpdatePatch) => void
}

// 단일 링크 항목.
// 보기/편집 모드 분기만 담당하고, 각 모드의 UI/로직은 LinkItemView / LinkItemEdit가 가져간다.
//
// memo로 감싸 부모(LinkList) 재렌더 시 변경 안 된 항목은 reconcile 건너뜀.
// reducer가 변경 없는 link의 reference를 유지하므로 strict-equal OK.
export const LinkItem = memo(({ link, onOpen, onRemove, onUpdate }: LinkItemProps) => {
    const [isEditing, setIsEditing] = useState(false)

    const handleRequestEdit = () => {
        setIsEditing(true)
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
    }

    const handleCommitEdit = (id: string, patch: LinkUpdatePatch) => {
        setIsEditing(false)
        onUpdate(id, patch)
    }

    if (isEditing) {
        return (
            <LinkItemEdit
                link={link}
                onCommit={handleCommitEdit}
                onCancel={handleCancelEdit}
            />
        )
    }

    return (
        <LinkItemView
            link={link}
            onOpen={onOpen}
            onRequestEdit={handleRequestEdit}
            onRemove={onRemove}
        />
    )
})
