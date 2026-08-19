// 유튜브 별창 테마 프레임 정의 — 메뉴 유튜브 탭(미리 선택)과 별창(YoutubePage)이 공유.
import theme1 from './assets/theme1.png'
import theme2 from './assets/theme2.png'
import theme4 from './assets/theme4.png'
import theme5 from './assets/theme5.png'
import theme6 from './assets/theme6.png'
import theme7 from './assets/theme7.png'

// 100% 기준 창 크기.
export const BASE_W = 560
export const BASE_H = 407
export const MINI_W = 280
export const MINI_H = 204

export type YoutubeTheme = { id: number; name: string; src: string }

export const YOUTUBE_THEMES: YoutubeTheme[] = [
    { id: 1, name: '빼꼼1', src: theme1 },
    { id: 2, name: '빼꼼2', src: theme2 },
    { id: 4, name: '쿠피', src: theme4 },
    { id: 5, name: '슈피', src: theme5 },
    { id: 6, name: '피요', src: theme6 },
    { id: 7, name: '윙피', src: theme7 },
]

// 100% 기준 webview "구멍" 좌표. (JUMPET_4 이식)
export const THEME_HOLES: Record<
    number,
    { left: number; top: number; width: number; height: number }
> = {
    1: { left: 126, top: 147, width: 249, height: 139 },
    2: { left: 126, top: 139, width: 250, height: 140 },
    4: { left: 107, top: 111, width: 355, height: 198 },
    5: { left: 103, top: 108, width: 359, height: 203 },
    6: { left: 103, top: 107, width: 360, height: 204 },
    7: { left: 103, top: 106, width: 358, height: 204 },
}

export const themeSrc = (id: number): string =>
    YOUTUBE_THEMES.find((t) => t.id === id)?.src ?? theme1

// 입력 URL에서 유튜브 영상 ID를 추출(watch?v= / youtu.be / embed / shorts).
const extractVideoId = (input: string): string | null => {
    const m =
        input.match(/[?&]v=([\w-]{11})/) ||
        input.match(/youtu\.be\/([\w-]{11})/) ||
        input.match(/\/(?:embed|shorts)\/([\w-]{11})/)
    return m ? m[1] : null
}

// 재생 소스 결정.
// isVideo=특정 영상 → 임베드 플레이어로 연다(페이지 잡동사니·레터박스 없이 프레임을 꽉 채움).
//   (watch 페이지는 작은 창에서 영상이 작게 letterbox 되는 문제가 있어 임베드를 쓴다.
//    단, 업로더가 임베드를 막아둔 일부 영상은 오류가 날 수 있음.)
// false=홈/검색 등 둘러보기.
export const resolveYoutubeSrc = (
    input?: string,
): { src: string; isVideo: boolean; videoId: string | null } => {
    const value = (input ?? '').trim()
    if (value === '') {
        return { src: 'https://www.youtube.com', isVideo: false, videoId: null }
    }
    const id = extractVideoId(value)
    if (id) {
        return {
            src: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`,
            isVideo: true,
            videoId: id,
        }
    }
    // 유튜브 URL이지만 ID를 못 찾으면 그대로(검색결과/채널 등) 로드.
    return { src: value, isVideo: false, videoId: null }
}

// 임베드 차단(오류 153) 시 폴백할 watch URL.
export const watchUrl = (videoId: string): string =>
    `https://www.youtube.com/watch?v=${videoId}`
