// 캐릭터 종류. 새 캐릭터 추가 시 union에 ID를 더하고,
// assets/{id}/ 폴더 + CHARACTER_ASSETS 매핑을 함께 채워야 한다.
export type CharacterId = 'piyoo' | 'qupee' | 'suupee' | 'wingpee'

// 캐릭터의 감정 표현. 행동 상태(idle/walking)와 별개 축으로 다룬다.
// 행동은 코드 로직(윈도우 이동 등), 감정은 시각 표현(이미지 교체)을 담당.
export type Mood = 'default' | 'happy' | 'sad'
