import type { PlanRow } from '../../../../types'
import type { Ui } from '../ui'

type PullRequestItemProps = { ui: Ui; row: PlanRow; repoUrl: string | null; worktree: string | undefined }

export function PullRequestItem({ ui: { Box, Text, Link }, row, repoUrl, worktree }: PullRequestItemProps) {
  return (
    <Box flexDirection="column">
      <Text>
        <Text dimColor>{row.status}</Text>{' '}
        {row.prNumber !== null && repoUrl !== null ? (
          <Link href={`${repoUrl}/pull/${row.prNumber}`} label={`#${row.prNumber}`} />
        ) : (
          <Text weight="bold">{row.id}</Text>
        )}{' '}
        {row.summary.split(' · ')[0]}
      </Text>
      <Text dimColor wrap="truncate-end">
        {'  '}branch {row.branch ?? 'not named'} · worktree {worktree ?? 'not checked out'}
      </Text>
    </Box>
  )
}
