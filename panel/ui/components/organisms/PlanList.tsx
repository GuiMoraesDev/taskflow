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
  isMenuOpen: boolean
  dim: boolean
  onOpen: (name: string) => void
  onToggleMenu: () => void
}

export function PlanList({ ui, projects, columns, message, isMenuOpen, dim, onOpen, onToggleMenu }: PlanListProps) {
  const { Box, Text, Button } = ui

  return (
    <Box flexDirection="column" gap={1}>
      <Box justifyContent="space-between">
        <Text weight="bold" color={dim ? palette.faint : palette.text}>
          Plans <Text color={dim ? palette.faint : palette.muted}>{projects.length}</Text>
        </Text>
        <Button key="menu" hotkey="m" label={isMenuOpen ? '✕' : '☰'} onPress={onToggleMenu} />
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
