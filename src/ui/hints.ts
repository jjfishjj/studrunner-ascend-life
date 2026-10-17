import { LEVEL_INFO } from '../game/levels'

export const buildLevelHint = (id: number) => LEVEL_INFO[id - 1]?.hint ?? ''
