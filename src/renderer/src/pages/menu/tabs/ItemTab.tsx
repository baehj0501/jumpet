import { useRef, useState } from 'react'
import {
    DECOR_THEMES,
    THEME_LABELS,
    THEME_THUMBNAILS,
    decorByTheme,
    type DecorTheme,
    type PlacedItem,
    useOwnedDecor,
    usePlacedItems,
    useWorldActions,
    useWorldMode,
} from '@renderer/entities/world'

// 아이템(데스크탑 월드 꾸미기) 탭.
// 보관함은 테마 폴더(썸네일) → 폴더를 누르면 그 테마의 데코 목록.
// 편집은 실제 '바탕화면 데코 창'에서: 🎨 꾸미기 → 데코 클릭으로 바탕화면 배치 → 드래그/우클릭 회수 → 저장/취소.
export const ItemTab = () => {
    const owned = useOwnedDecor()
    const placed = usePlacedItems()
    const mode = useWorldMode()
    const { place, commitLayout, reset, setMode } = useWorldActions()

    const editing = mode === 'edit'

    // 열린 폴더(테마). null이면 폴더 목록.
    const [openTheme, setOpenTheme] = useState<DecorTheme | null>(null)

    // 취소용 스냅샷.
    const snapshotRef = useRef<{ owned: Record<string, number>; placed: PlacedItem[] } | null>(null)

    const enterEdit = () => {
        snapshotRef.current = { owned: { ...owned }, placed: placed.map((p) => ({ ...p })) }
        void setMode('edit')
    }
    const saveEdit = () => {
        snapshotRef.current = null
        void setMode('fixed')
    }
    const cancelEdit = async () => {
        const snap = snapshotRef.current
        if (snap) {
            await commitLayout(snap.owned, snap.placed)
            snapshotRef.current = null
        }
        await setMode('fixed')
    }

    const placeOnDesktop = (itemId: string) => {
        if (!editing || (owned[itemId] ?? 0) <= 0) {
            return
        }
        void place(itemId, 0.5, 0.5)
    }

    // 테마별 보유 합계.
    const ownedInTheme = (theme: DecorTheme): number =>
        decorByTheme(theme).reduce((sum, decor) => sum + (owned[decor.id] ?? 0), 0)

    const totalOwned = Object.values(owned).reduce((sum, count) => sum + count, 0)

    return (
        <div className='panel'>
            <div className='hint'>
                {editing
                    ? '보관함 데코를 눌러 바탕화면에 놓고, 드래그로 옮겨요 (우클릭=회수)'
                    : '바탕화면 어디든 데코로 꾸며요'}
            </div>

            {/* 툴바 */}
            <div className='world-toolbar'>
                {!editing ? (
                    <button
                        type='button'
                        className='pbtn'
                        onClick={enterEdit}
                    >
                        🎨 꾸미기
                    </button>
                ) : (
                    <>
                        <button
                            type='button'
                            className='pbtn'
                            onClick={saveEdit}
                        >
                            저장
                        </button>
                        <button
                            type='button'
                            className='pbtn ghost'
                            onClick={() => void cancelEdit()}
                        >
                            취소
                        </button>
                    </>
                )}
            </div>

            {openTheme === null ? (
                /* 폴더 목록 */
                <div className='decor-folder-grid'>
                    {DECOR_THEMES.map((theme) => (
                        <button
                            type='button'
                            key={theme}
                            className='decor-folder'
                            onClick={() => setOpenTheme(theme)}
                        >
                            <img
                                className='decor-folder-thumb'
                                src={THEME_THUMBNAILS[theme]}
                                alt={THEME_LABELS[theme]}
                                draggable={false}
                            />
                            <span className='decor-folder-name'>{THEME_LABELS[theme]}</span>
                            <span className='decor-folder-count'>{ownedInTheme(theme)}개 보유</span>
                        </button>
                    ))}
                </div>
            ) : (
                /* 폴더 안 — 해당 테마 데코 목록 */
                <>
                    <div className='decor-folder-head'>
                        <button
                            type='button'
                            className='decor-back'
                            onClick={() => setOpenTheme(null)}
                        >
                            ‹ 보관함
                        </button>
                        <span className='decor-folder-title'>{THEME_LABELS[openTheme]}</span>
                    </div>
                    <div className='item-grid'>
                        {decorByTheme(openTheme).map((decor) => {
                            const count = owned[decor.id] ?? 0
                            return (
                                <button
                                    type='button'
                                    key={decor.id}
                                    className={count > 0 ? 'item-card' : 'item-card empty'}
                                    disabled={!editing || count <= 0}
                                    onClick={() => placeOnDesktop(decor.id)}
                                    title={editing ? '눌러서 바탕화면에 배치' : undefined}
                                >
                                    <span className='item-emoji'>
                                        <img
                                            src={decor.src}
                                            alt={decor.name}
                                            draggable={false}
                                        />
                                    </span>
                                    <span className='item-name'>{decor.name}</span>
                                    <span className='item-count'>×{count}</span>
                                </button>
                            )
                        })}
                    </div>
                </>
            )}

            {totalOwned === 0 && placed.length === 0 && (
                <div className='empty-hint'>가챠에서 데코를 뽑아 월드를 꾸며 보세요</div>
            )}

            {!editing && placed.length > 0 && (
                <button
                    type='button'
                    className='world-reset'
                    onClick={() => void reset()}
                >
                    전체 비우기 (배치 {placed.length}개 회수)
                </button>
            )}
        </div>
    )
}
