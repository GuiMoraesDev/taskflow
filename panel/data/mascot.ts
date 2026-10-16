import { atom, update } from 'claude-code'
import type { EngineInterface, Timer } from 'claude-code'

import type { MascotPreview } from '../../types'

const mascotPreview = atom({ plugin: 'taskflow', key: 'mascotPreview' } as const, null)
const spinnerStep = atom({ plugin: 'taskflow', key: 'spinnerStep' } as const, 0)

let spinner: Timer | null = null

// Forces Flo into a state; the loading preview keeps its spinner turning until another state is picked.
export async function previewMascot($: EngineInterface, preview: MascotPreview | null) {
  spinner?.cancel()
  spinner = preview === 'loading' ? $.clock.every(100, () => void update($, spinnerStep, step => step + 1)) : null
  await update($, mascotPreview, () => preview)
}
