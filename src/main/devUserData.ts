import { app } from 'electron'
import { is } from '@electron-toolkit/utils'

// 개발(dev)에서는 배포 앱과 '다른' 저장소를 쓰게 한다.
// dev와 배포 앱은 앱 이름이 같아(userData=…/loopf) 같은 config.json을 공유하는데,
// 개발 중 dev를 켜면 배포 앱이 저장한 데이터(뽑기로 얻은 데코 등)를 덮어써 버려
// "뽑았는데 보관함이 비어 있다"처럼 보이는 혼선이 생긴다.
// dev만 별도 폴더(…/loopf-dev)를 쓰면 배포 데이터를 절대 건드리지 않는다. (배포 빌드엔 영향 없음.)
//
// 주의: electron-store는 생성자에서 userData 경로를 확정하므로, 어떤 도메인 store 모듈보다
// '먼저' 이 파일이 실행되어야 한다 — index.ts에서 최상단으로 import한다.
if (is.dev) {
    app.setPath('userData', `${app.getPath('userData')}-dev`)
}
