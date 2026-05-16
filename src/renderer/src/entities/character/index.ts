// Public API of the character entity.
// 외부 layer는 이 barrel을 통해서만 import한다.
export { CharacterView } from './ui/CharacterView'
export { useStateMachine } from './behaviors/useStateMachine'
export { useWalking } from './behaviors/useWalking'
export type { CharacterState } from './model/CharacterState'
export type { CharacterId, Mood } from './model/Character'
