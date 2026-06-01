// Public API of the schedule entity (일정).
// 외부 layer는 이 barrel을 통해서만 import한다.
export type { ScheduleItem } from '@shared/contracts/scheduleEvents'
export { MAX_SCHEDULE_TITLE_LENGTH, MAX_SCHEDULE_MEMO_LENGTH } from '@shared/contracts/scheduleEvents'
export { useScheduleItems, useScheduleActions, initializeScheduleSync } from './model/useScheduleStore'
