import { expect, test } from 'claude-code/testing'

import { updateWorkflowEnv } from './workflow-env'

const VAULT = { source: 'obsidian', vaultPath: '/abs/Work', path: 'taskflow/myrepo' } as const

test('writes only the allow-listed keys', () => {
  const settings = { ...VAULT, extra: 'x', TASKFLOW_GATES: 'rm -rf /' }

  expect(updateWorkflowEnv('', settings)).toEqual({
    text: 'TASKFLOW_PLANS_SOURCE=obsidian\nTASKFLOW_OBSIDIAN_VAULT_PATH=/abs/Work\nTASKFLOW_OBSIDIAN_PATH=taskflow/myrepo\n',
  })
  expect(updateWorkflowEnv('TASKFLOW_OBSIDIAN_VAULT=Old\n', { source: 'obsidian', vault: 'Work' })).toEqual({
    text: 'TASKFLOW_OBSIDIAN_VAULT=Work\nTASKFLOW_PLANS_SOURCE=obsidian\n',
  })
})

test('preserves lines it does not own', () => {
  const existing = '# my notes\nOTHER=1\nTASKFLOW_OBSIDIAN_VAULT=Old\n\nTASKFLOW_PLANS_SOURCE=repo\n# end\n'

  expect(updateWorkflowEnv(existing, VAULT)).toEqual({
    text: '# my notes\nOTHER=1\n\nTASKFLOW_PLANS_SOURCE=obsidian\n# end\nTASKFLOW_OBSIDIAN_VAULT_PATH=/abs/Work\nTASKFLOW_OBSIDIAN_PATH=taskflow/myrepo\n',
  })
})

test('refuses an escaping inner path', () => {
  for (const path of ['../other', 'a/../../b', '/etc']) {
    expect(updateWorkflowEnv('OTHER=1\n', { ...VAULT, path })).toEqual({
      error: expect.stringContaining('inside the vault'),
    })
  }
  expect(updateWorkflowEnv('', { ...VAULT, vaultPath: 'rel/Work' })).toEqual({
    error: expect.stringContaining('absolute'),
  })
  expect(updateWorkflowEnv('', { ...VAULT, vault: 'Work\nTASKFLOW_GATES=x', vaultPath: undefined })).toEqual({
    error: expect.stringContaining('one line'),
  })
})
