import type { PlanRow } from '../../../../types'
import type { Ui } from '../ui'

type PullRequestItemProps = { ui: Ui; row: PlanRow; repoUrl: string | null; worktree: string | undefined }

export function PullRequestItem({ ui: { Box, Text, Link }, row, repoUrl, worktree }: PullRequestItemProps) {
  const isOpened = row.prNumber !== null

  return (
    <Box flexDirection="column">
      <Text dimColor={!isOpened} wrap="truncate-end">
        {row.branch ?? row.id}
        {isOpened && (
          <Text>
            {' - '}
            {repoUrl === null ? (
              `#${row.prNumber}`
            ) : (
              <Link href={`${repoUrl}/pull/${row.prNumber}`} label={`#${row.prNumber}`} />
            )}
          </Text>
        )}
      </Text>
      {worktree && (
        <Text dimColor wrap="truncate-end">
          {'  '}worktree {worktree}
        </Text>
      )}
    </Box>
  )
}
