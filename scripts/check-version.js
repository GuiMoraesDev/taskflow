import { execFileSync } from 'node:child_process'

const MANIFEST = '.claude-plugin/plugin.json'

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

const versionAt = revision => JSON.parse(git('show', `${revision}:${MANIFEST}`)).version

const parse = version => version.split('.').map(Number)

const isAbove = (candidate, base) => {
  const [first, second] = [parse(candidate), parse(base)]
  const index = first.findIndex((part, position) => part !== second[position])

  return index !== -1 && first[index] > second[index]
}

let head
try {
  head = git('symbolic-ref', '--short', 'refs/remotes/origin/HEAD')
} catch {
  head = 'origin/main'
}

const staged = versionAt('')
let base
try {
  base = versionAt(head)
} catch {
  console.log(`check-version: no ${MANIFEST} on ${head}, skipping`)
  process.exit(0)
}

if (!isAbove(staged, base)) {
  console.error(`check-version: ${MANIFEST} is ${staged}, it must be above ${head}'s ${base}`)
  process.exit(1)
}
