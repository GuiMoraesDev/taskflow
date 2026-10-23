import type { PlanProject } from '../../../../types'
import { boardNeedsYou } from '../../../domain/attention'
import { NeedsYouCard } from '../molecules/NeedsYouCard'
import { PlanCard } from '../molecules/PlanCard'
import { palette } from '../palette'
import type { Ui } from '../ui'

type PlanListProps = {
  ui: Ui
  projects: PlanProject[]
  columns: number
  message: string | null
  onOpen: (name: string) => void
  onRefresh: () => void
  onSettings: () => void
  onOpenTrash: () => void
}

export function PlanList({
  ui,
  projects,
  columns,
  message,
  onOpen,
  onRefresh,
  onSettings,
  onOpenTrash,
}: PlanListProps) {
  const { Box, Text, Button } = ui

  return (
    <Box flexDirection="column" gap={1}>
      <Box justifyContent="space-between">
        <Text weight="bold" color={palette.text}>
          Plans <Text color={palette.muted}>{projects.length}</Text>
        </Text>
        <Box gap={1}>
          <Button key="settings" hotkey="s" label="⚙" onPress={onSettings} />
          <Button key="trash" hotkey="t" label="🗑️ Trash (t)" onPress={onOpenTrash} />
          <Button key="refresh" hotkey="r" label="🔄" onPress={onRefresh} />
        </Box>
      </Box>
      <NeedsYouCard ui={ui} items={boardNeedsYou(projects)} columns={columns - 4} onOpen={onOpen} />
      {projects.slice(0, 9).map((project, index) => (
        <PlanCard
          key={`card-${project.name}`}
          ui={ui}
          project={project}
          hotkey={String(index + 1)}
          columns={columns}
          onOpen={() => onOpen(project.name)}
        />
      ))}
      {message && <Text color={palette.muted}>{message}</Text>}
    </Box>
  )
}
