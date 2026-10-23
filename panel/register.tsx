import { atom, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { SessionWait } from '../types'
import { boardSignature, loadBoard } from './data/board'
import { endsOnQuestion } from './domain/mascot'
import { renderPane } from './ui/pane'

const PANE = 'taskflow'
const TITLE = 'Taskflow'
const WATCH_MS = 1000

const animationStep = atom({ plugin: 'taskflow', key: 'animationStep' } as const, 0)
const waiting = atom({ plugin: 'taskflow', key: 'waiting' } as const, {
  dialog: false,
  permission: false,
  lastTurnAsked: false,
})

function setWaiting($: EngineInterface, change: Partial<SessionWait>) {
  void update($, waiting, wait => ({ ...wait, ...change }))
}

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
    if (!e.agentId) setWaiting($, { permission: false, lastTurnAsked: !e.isAborted && endsOnQuestion(e.answer) })

    return next(e)
  }).catch(($, e, next) => (next.called ? undefined : next(e)))

  on('prompt.submit', async ($, e, next) => {
    setWaiting($, e.isMeta ? { permission: false } : { permission: false, lastTurnAsked: false })

    return next(e)
  }).catch(($, e, next) => (next.called ? undefined : next(e)))

  on('tool.call', { tool: 'AskUserQuestion' }, async ($, e, next) => {
    setWaiting($, { dialog: true })
    try {
      return await next(e)
    } finally {
      setWaiting($, { dialog: false })
    }
  }).catch(($, e, next) => (next.called ? undefined : next(e)))

  // The permission prompt is answered inside tool.call's next(e), so its end clears the flag.
  on('tool.call', async ($, e, next) => {
    try {
      return await next(e)
    } finally {
      setWaiting($, { permission: false })
    }
  }).catch(($, e, next) => (next.called ? undefined : next(e)))

  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    if (verdict.decision === 'ask' && e.tool_use_id && !e.agentId) setWaiting($, { permission: true })

    return verdict
  }).catch(($, e, next) => (next.called ? undefined : next(e)))

  on('ui.render', { component: 'Pane', requestId: PANE }, renderPane)
}
