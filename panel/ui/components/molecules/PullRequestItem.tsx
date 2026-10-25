import type { PullRequestGroup } from '../../../domain/plan-shape'
import { palette } from '../palette'
import type { Ui } from '../ui'

type PullRequestItemProps = {
  ui: Ui
  group: PullRequestGroup
  repoUrl: string | null
  worktree: string | undefined
}

const looks: Record<string, { glyph: string; color: string; word: string }> = {
  '✅': { glyph: '●', color: palette.purple, word: 'merged' },
  '👀': { glyph: '◐', color: palette.amber, word: 'ready' },
  '📝': { glyph: '◐', color: palette.amber, word: 'draft' },
  '⬜': { glyph: '○', color: palette.faint, word: 'not opened' },
  '📋': { glyph: '○', color: palette.faint, word: 'in discussion' },
}

export function PullRequestItem({ ui: { Box, Text, Link }, group, repoUrl, worktree }: PullRequestItemProps) {
  const { pr, done, total } = group

  if (pr === null) return null

  const look = looks[pr.status.split(' ')[0] ?? ''] ?? { glyph: '○', color: palette.faint, word: pr.status }

  return (
    <Box flexDirection="column">
      <Text wrap="truncate-end">
        <Text color={look.color}>{look.glyph}</Text> <Text color={palette.text}>{pr.id}</Text>
        {pr.prNumber !== null && (
          <Text>
            {' '}
            {repoUrl === null ? (
              `#${pr.prNumber}`
            ) : (
              <Link href={`${repoUrl}/pull/${pr.prNumber}`} label={`#${pr.prNumber}`} />
            )}
          </Text>
        )}
        <Text color={palette.muted}>
          {' '}
          {look.word} · {done}/{total}
        </Text>
      </Text>
      {worktree && (
        <Text dimColor wrap="truncate-end">
          {'  '}worktree {worktree}
        </Text>
      )}
    </Box>
  )
}
