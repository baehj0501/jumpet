// Public API of the character entity.
// 외부 layer는 이 barrel을 통해서만 import한다.
export { CharacterView } from './ui/CharacterView'
export { SpeechBubble } from './ui/SpeechBubble'
export {
    CHARACTER_ASSETS,
    HOME_SCENE_ASSETS,
    CHARACTER_CLICK_FRAMES,
    CHARACTER_WALK_FRAMES,
} from './assets'
export { useStateMachine } from './behaviors/useStateMachine'
export { useWalking } from './behaviors/useWalking'
export { useCharacterSpeech } from './behaviors/useCharacterSpeech'
export { pickRandomClickMessage, pickTimeGreeting } from './model/clickMessages'
export {
    CHARACTER_DISPLAY_NAMES,
    withSubjectParticle,
    withVocativeParticle,
} from './model/characterNames'
export {
    useSelectedCharacterId,
    useSelectCharacter,
    initializeCharacterSelectionSync,
} from './model/useCharacterSelectionStore'
export type { CharacterState } from './model/CharacterState'
export type { CharacterId, Mood } from './model/Character'
