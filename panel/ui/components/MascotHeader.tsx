import type { MascotPreview, PlanRow } from '../../../types'
import { Loading } from './Loading'
import { Mascot } from './Mascot'
import type { Ui } from './ui'

const PREVIEWS: MascotPreview[] = ['idle', 'working', 'blocked', 'asking', 'done', 'loading']

type MascotHeaderProps = {
  ui: Ui
  rows: PlanRow[]
  preview: MascotPreview | null
  step: number
  onPreview: (preview: MascotPreview | null) => void
}

// Heads every view: a row that forces Flo into any state, then Flo itself.
export function MascotHeader({ ui, rows, preview, step, onPreview }: MascotHeaderProps) {
  const { Box, Button } = ui

  return (
    <Box flexDirection="column" alignItems="center" gap={1}>
      <Box gap={1} flexWrap="wrap">
        <Button key="mascot-auto" plain dimColor={preview !== null} label="Auto" onPress={() => onPreview(null)} />
        {PREVIEWS.map(option => (
          <Button
            key={`mascot-${option}`}
            plain
            dimColor={preview !== option}
            label={option}
            onPress={() => onPreview(option)}
          />
        ))}
      </Box>
      {preview === 'loading' ? (
        <Loading ui={ui} step={step} />
      ) : (
        <Mascot ui={ui} rows={rows} step={step} mood={preview ?? undefined} />
      )}
    </Box>
  )
}
