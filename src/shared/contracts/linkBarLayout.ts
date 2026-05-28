// 링크 미니 버튼 플로팅 창의 레이아웃 상수.
// main(BrowserWindow 높이 계산)과 renderer(스타일 적용) 양쪽이 같은 값을 보장해야
// 카드 잘림/여백 회귀가 발생하지 않는다 — 단일 출처를 contracts에 둔다.

export const LINK_BAR_LAYOUT = {
    // 윈도우 너비(고정).
    cardWidth: 160,
    // 상단 드래그 핸들 영역 높이.
    handleHeight: 16,
    // 미니 버튼 항목 1개의 높이 (LinkMiniButton의 button height).
    itemHeight: 36,
    // 항목 간 세로 gap.
    itemGap: 6,
    // 항목 리스트 ul의 padding.
    listPaddingTop: 4,
    listPaddingRight: 6,
    listPaddingBottom: 8,
    listPaddingLeft: 6,
    // 링크 0개일 때 카드 빈 영역 padding (위·아래 동일).
    emptyStatePadding: 12,
} as const

// 링크 개수에 맞춘 BrowserWindow 높이.
// main의 adjustLinkBarHeight가 사용한다. renderer는 height: '100%'로 채우므로 직접 호출하지 않는다.
export const computeLinkBarHeight = (linkCount: number): number => {
    const L = LINK_BAR_LAYOUT
    if (linkCount === 0) {
        return L.handleHeight + L.emptyStatePadding * 2
    }
    const itemsTotal = L.itemHeight * linkCount + L.itemGap * Math.max(linkCount - 1, 0)
    return L.handleHeight + L.listPaddingTop + itemsTotal + L.listPaddingBottom
}
