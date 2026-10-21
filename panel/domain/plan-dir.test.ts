import { expect, test } from 'claude-code/testing'

import { parseWorkflowEnv, resolvePlanDir } from './plan-dir'

const REPO = '/code/myrepo'
const OBSIDIAN = 'TASKFLOW_PLANS_SOURCE=obsidian\nTASKFLOW_OBSIDIAN_PATH=taskflow/myrepo\n'

test('keeps a relative projectsDir under the repo', () => {
  expect(resolvePlanDir({ projectsDir: 'docs/projects', env: {}, obsidianVaults: null, repoRoot: REPO })).toEqual({
    base: '/code/myrepo/docs/projects',
    label: 'docs/projects',
  })
})

test('defaults to docs/projects', () => {
  expect(resolvePlanDir({ projectsDir: null, env: {}, obsidianVaults: null, repoRoot: REPO })).toEqual({
    base: '/code/myrepo/docs/projects',
    label: 'docs/projects',
  })
})

test('resolves a vault by folder name', () => {
  const env = parseWorkflowEnv(`# plans live in Obsidian\n${OBSIDIAN}TASKFLOW_OBSIDIAN_VAULT=Work\n`)
  const obsidianVaults = ['/Users/me/Notes/Personal', '/Users/me/Notes/Work']

  expect(resolvePlanDir({ projectsDir: 'docs/projects', env, obsidianVaults, repoRoot: REPO })).toEqual({
    base: '/Users/me/Notes/Work/taskflow/myrepo',
    label: 'Obsidian · Work/taskflow/myrepo',
  })
})

test('prefers an absolute vault path over the name', () => {
  const env = parseWorkflowEnv(`${OBSIDIAN}TASKFLOW_OBSIDIAN_VAULT=Other\nTASKFLOW_OBSIDIAN_VAULT_PATH=/abs/Work\n`)

  expect(resolvePlanDir({ projectsDir: null, env, obsidianVaults: null, repoRoot: REPO })).toEqual({
    base: '/abs/Work/taskflow/myrepo',
    label: 'Obsidian · Work/taskflow/myrepo',
  })
})

test('errors on a missing or ambiguous vault', () => {
  const env = parseWorkflowEnv(`${OBSIDIAN}TASKFLOW_OBSIDIAN_VAULT=Work\n`)
  const resolve = (obsidianVaults: string[] | null) =>
    resolvePlanDir({ projectsDir: 'docs/projects', env, obsidianVaults, repoRoot: REPO })

  expect(resolve(null)).toEqual({ error: expect.stringContaining('obsidian.json') })
  expect(resolve(['/a/Personal'])).toEqual({ error: expect.stringContaining('No Obsidian vault named "Work"') })
  expect(resolve(['/a/Work', '/b/Work'])).toEqual({
    error: expect.stringContaining('2 Obsidian vaults are named "Work"'),
  })
  expect(
    resolvePlanDir({ projectsDir: null, env: parseWorkflowEnv(OBSIDIAN), obsidianVaults: [], repoRoot: REPO }),
  ).toEqual({ error: expect.stringContaining('TASKFLOW_OBSIDIAN_VAULT') })
})

test('uses the repo unless source is obsidian', () => {
  for (const source of ['', 'TASKFLOW_PLANS_SOURCE=repo\n', 'TASKFLOW_PLANS_SOURCE=vault\n']) {
    const env = parseWorkflowEnv(`${source}TASKFLOW_OBSIDIAN_VAULT_PATH=/abs/Work\nTASKFLOW_OBSIDIAN_PATH=plans\n`)

    expect(resolvePlanDir({ projectsDir: 'plans', env, obsidianVaults: ['/abs/Work'], repoRoot: REPO })).toEqual({
      base: '/code/myrepo/plans',
      label: 'plans',
    })
  }
})

test('refuses .. and absolute inner paths', () => {
  for (const inner of ['../escape', 'taskflow/../../escape', '/etc']) {
    const env = parseWorkflowEnv(
      `TASKFLOW_PLANS_SOURCE=obsidian\nTASKFLOW_OBSIDIAN_VAULT_PATH=/abs/Work\nTASKFLOW_OBSIDIAN_PATH=${inner}\n`,
    )

    expect(resolvePlanDir({ projectsDir: null, env, obsidianVaults: null, repoRoot: REPO })).toEqual({
      error: expect.stringContaining('TASKFLOW_OBSIDIAN_PATH'),
    })
  }
})

test('ignores keys outside the allow-list', () => {
  expect(
    parseWorkflowEnv('TASKFLOW_GATES_LINT=rm -rf /\nPROJECTS_DIR=/tmp\nTASKFLOW_PLANS_SOURCE = obsidian \n'),
  ).toEqual({
    TASKFLOW_PLANS_SOURCE: 'obsidian',
  })
})
