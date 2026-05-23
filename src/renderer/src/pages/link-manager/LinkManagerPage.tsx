import { Global, css } from '@emotion/react'
import { MAX_LINKS, useLinkActions, useLinks } from '@renderer/entities/link'
import { LinkForm } from './LinkForm'
import { LinkList } from './LinkList'

// 링크 관리 별창의 루트. 데이터/액션은 useLinkStore에 위임하고 UI 조합만 담당한다.
//
// 펫 윈도우의 global.css(transparent 배경)와 격리되어 이 창에서만 light theme이 적용되도록
// emotion <Global>로 :root, body 기본을 주입한다 (TodoPage와 같은 정책).
const pageGlobalStyles = css`
    :root {
        color-scheme: light;
    }

    body {
        background: #f7f7f7;
        color: #1a1a1a;
    }
`

export const LinkManagerPage = () => {
    const links = useLinks()
    const { addLink, removeLink, updateLink, openLink } = useLinkActions()

    // 5개 가득 차면 입력 자체를 비활성. reducer가 최종 안전망이지만 UI에서 사전에 막는다.
    const isFull = links.length >= MAX_LINKS

    return (
        <>
            <Global styles={pageGlobalStyles} />
            <div
                css={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    background: '#ffffff',
                }}
            >
                <header
                    css={{
                        padding: '16px 18px 12px',
                        borderBottom: '1px solid #eeeeee',
                    }}
                >
                    <h1
                        css={{
                            fontSize: 18,
                            fontWeight: 600,
                            marginBottom: 4,
                            color: '#1a1a1a',
                        }}
                    >
                        링크 관리
                    </h1>
                    <p
                        css={{
                            fontSize: 12,
                            color: '#888888',
                            marginBottom: 12,
                        }}
                    >
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
