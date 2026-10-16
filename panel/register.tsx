import type { EngineInterface, Register } from 'claude-code'

import { loadBoard } from './data/board'
import { renderPane } from './ui/pane'

const PANE = 'taskflow'
const TITLE = 'Taskflow'

async function openPane($: EngineInterface, focus = false) {
  await $.ui.open({ id: PANE, title: TITLE, columns: 60, ...(focus ? { focus: true as const } : {}) })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'taskflow', description: 'Open the Taskflow pane: plans, tasks, PRs' })
    void loadBoard($)
    void openPane($)

    return next(e)
  })

  on('command.run', { command: 'taskflow' }, async $ => {
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
