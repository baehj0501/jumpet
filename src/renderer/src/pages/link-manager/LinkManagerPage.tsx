import { Global } from '@emotion/react'
import { MAX_LINKS, useLinkActions, useLinks } from '@renderer/entities/link'
import { LinkForm } from './LinkForm'
import { LinkList } from './LinkList'
import {
    containerStyle,
    headerStyle,
    pageGlobalStyles,
    subtitleStyle,
    titleStyle,
} from './LinkManagerPage.styles'

// 링크 관리 별창의 루트. 데이터/액션은 useLinkStore에 위임하고 UI 조합만 담당한다.
export const LinkManagerPage = () => {
    const links = useLinks()
    const { addLink, removeLink, updateLink, openLink } = useLinkActions()

    // 5개 가득 차면 입력 자체를 비활성. reducer가 최종 안전망이지만 UI에서 사전에 막는다.
    const isFull = links.length >= MAX_LINKS

    return (
        <>
            <Global styles={pageGlobalStyles} />
            <div css={containerStyle}>
                <header css={headerStyle}>
                    <h1 css={titleStyle}>링크 관리</h1>
                    <p css={subtitleStyle}>
                        자주 쓰는 사이트를 최대 {MAX_LINKS}개까지 등록할 수 있어요. ({links.length}/{MAX_LINKS})
                    </p>
                    <LinkForm
                        onAdd={addLink}
                        disabled={isFull}
                    />
                </header>
                <LinkList
                    links={links}
                    onOpen={openLink}
                    onRemove={removeLink}
                    onUpdate={updateLink}
                />
            </div>
        </>
    )
}
