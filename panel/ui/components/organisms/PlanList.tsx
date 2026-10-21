import type { PlanProject } from '../../../../types'
import { PlanCard } from '../molecules/PlanCard'
import type { Ui } from '../ui'

type PlanListProps = {
  ui: Ui
  projects: PlanProject[]
  message: string | null
  onOpen: (name: string) => void
  onRefresh: () => void
  onOpenTrash: () => void
}

export function PlanList({ ui, projects, message, onOpen, onRefresh, onOpenTrash }: PlanListProps) {
  const { Box, Text, Button } = ui

  return (
    <Box flexDirection="column" gap={1}>
      <Box justifyContent="space-between">
        <Text weight="bold">
          Plans <Text dimColor>{projects.length}</Text>
        </Text>
        <Box gap={1}>
          <Button key="trash" hotkey="t" label="🗑️ Trash (t)" onPress={onOpenTrash} />
          <Button key="refresh" hotkey="r" label="🔄" onPress={onRefresh} />
        </Box>
      </Box>
      {projects.slice(0, 9).map((project, index) => (
        <PlanCard
          key={`card-${project.name}`}
          ui={ui}
          project={project}
          hotkey={String(index + 1)}
          onOpen={() => onOpen(project.name)}
        />
      ))}
      {message && <Text dimColor>{message}</Text>}
    </Box>
  )
}
