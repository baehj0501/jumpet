import { useEffect } from 'react'
import { Global } from '@emotion/react'
import {
    FORTUNE_LEVEL_LABELS,
    useFortuneActions,
    useTodayFortune,
} from '@renderer/entities/fortune'
import {
    closeButtonStyle,
    containerStyle,
    levelBadgeStyle,
    loadingStyle,
    messageStyle,
    pageGlobalStyles,
    scoreStyle,
    titleStyle,
} from './FortunePage.styles'

// 운세 별창의 루트. 데이터/액션은 useFortuneStore에 위임하고 UI 조합만 담당한다.
export const FortunePage = () => {
    const today = useTodayFortune()
    const { roll } = useFortuneActions()

    // 패널을 열면 오늘 운세를 보장한다(없으면 추첨). 날짜당 멱등이라 점수 중복 보상은 없다.
    useEffect(() => {
        void roll()
    }, [roll])

    return (
        <>
            <Global styles={pageGlobalStyles} />
            <div css={containerStyle}>
                <span css={titleStyle}>🌸 오늘의 운세</span>
                {today ? (
                    <>
                        <span css={levelBadgeStyle}>{FORTUNE_LEVEL_LABELS[today.level]}</span>
                        <p css={messageStyle}>{today.text}</p>
                        <span css={scoreStyle}>+{today.scoreAwarded}점 획득</span>
                    </>
                ) : (
                    <p css={loadingStyle}>운세를 보는 중…</p>
                )}
                <button
                    type='button'
                    css={closeButtonStyle}
                    onClick={() => window.close()}
                >
                    닫기
                </button>
            </div>
        </>
    )
}
