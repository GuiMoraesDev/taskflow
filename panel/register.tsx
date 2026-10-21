import { atom, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { boardSignature, loadBoard } from './data/board'
import { renderPane } from './ui/pane'

const PANE = 'taskflow'
const TITLE = 'Taskflow'
const WATCH_MS = 1000

const animationStep = atom({ plugin: 'taskflow', key: 'animationStep' } as const, 0)

async function openPane($: EngineInterface, focus = false) {
  await $.ui.open({ id: PANE, title: TITLE, columns: 60, ...(focus ? { focus: true as const } : {}) })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'open-mod', description: 'Open the Taskflow pane: plans, tasks, PRs' })
    void loadBoard($)
    void openPane($)
    $.clock.every(100, () => void update($, animationStep, step => step + 1))

    // Reload whenever a PROGRESS.md changes - mid-turn, from a subagent or from Obsidian - not only at turn end.
    let lastSignature = ''
    $.clock.every(WATCH_MS, async () => {
      const signature = await boardSignature($)
      if (signature === lastSignature) return
      lastSignature = signature
      await loadBoard($)
    })

    return next(e)
  })

  on('command.run', { command: 'open-mod' }, async $ => {
    await loadBoard($)
    await openPane($, true)

    return { text: 'Taskflow pane opened.' }
  })

  on('turn.complete', async ($, e, next) => {
    void loadBoard($)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, renderPane)
}
