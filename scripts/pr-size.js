// Counts the branch's changed lines against the code and total budgets in .claude/workflow.json.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const DEFAULT_TEST_GLOBS = ['**/*.test.*', '**/*.spec.*']

const base = process.argv[2]
if (!base) {
  console.error('pr-size: usage: node scripts/pr-size.js <base>')
  process.exit(2)
}

const CONFIG = '.claude/workflow.json'

let config = {}
if (existsSync(CONFIG)) {
  try {
    config = JSON.parse(readFileSync(CONFIG, 'utf8')).pullRequests ?? {}
  } catch {
    console.error(`pr-size: cannot parse ${CONFIG}`)
    process.exit(2)
  }
}

const excludeFromCount = config.excludeFromCount ?? []
const codeExcludes = config.codeExcludes ?? DEFAULT_TEST_GLOBS
const maxLines = config.maxLines ?? 400
const hasTotalBudget = config.codeExcludes !== undefined || config.maxTotalLines !== undefined
const maxTotalLines = hasTotalBudget ? config.maxTotalLines ?? 600 : undefined

const count = excludes => {
  const pathspecs = excludes.map(pattern => `:(glob,exclude)${pattern}`)
  const rows = execFileSync('git', ['diff', '--cached', '--numstat', base, '--', '.', ...pathspecs], { encoding: 'utf8' })

  return rows
    .split('\n')
    .map(row => row.split('\t'))
    .filter(([added, deleted]) => added !== '-' && deleted !== '-' && added !== '')
    .reduce((sum, [added, deleted]) => sum + Number(added) + Number(deleted), 0)
}

const code = count([...excludeFromCount, ...codeExcludes])
const total = count(excludeFromCount)

const parts = [`${code}/${maxLines} code`]
if (maxTotalLines !== undefined) parts.push(`${total}/${maxTotalLines} total`)
console.log(parts.join(' · '))

const over = []
if (code > maxLines) over.push('code budget')
if (maxTotalLines !== undefined && total > maxTotalLines) over.push('total budget')

if (over.length) {
  console.error(`pr-size: over the ${over.join(' and the ')}`)
  process.exit(1)
}
