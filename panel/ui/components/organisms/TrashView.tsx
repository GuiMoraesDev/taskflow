import type { TrashEntry } from '../../../../types'
import type { Ui } from '../ui'

type TrashViewProps = {
  ui: Ui
  entries: TrashEntry[]
  isClearing: boolean
  message: string | null
  onBack: () => void
  onRecover: (entry: string) => void
  onAskClear: () => void
  onConfirmClear: () => void
  onCancelClear: () => void
}

const formatDeletedAt = (deletedAt: number) => new Date(deletedAt).toLocaleString()

export function TrashView(props: TrashViewProps) {
  const { ui, entries, isClearing, message } = props
  const { Box, Text, Button } = ui

  return (
    <Box flexDirection="column" gap={1}>
      <Box justifyContent="space-between">
        <Button key="back" hotkey="b" label="← Plans (b)" onPress={props.onBack} />
        <Text weight="bold">
          Trash <Text dimColor>{entries.length}</Text>
        </Text>
      </Box>

      {entries.length === 0 && <Text dimColor>The trash is empty.</Text>}
      {entries.slice(0, 9).map((item, index) => (
        <Box key={`trash-${item.entry}`} justifyContent="space-between" borderStyle="round" paddingX={1}>
          <Box flexDirection="column" flexShrink={1}>
            <Text weight="bold" wrap="truncate-end">
              {item.name}
            </Text>
            <Text dimColor>Deleted {formatDeletedAt(item.deletedAt)}</Text>
          </Box>
          <Button
            key={`recover-${item.entry}`}
            hotkey={String(index + 1)}
            label={`Recover (${index + 1})`}
            onPress={() => props.onRecover(item.entry)}
          />
        </Box>
      ))}

      {entries.length > 0 &&
        (isClearing ? (
          <Box flexDirection="column">
            <Text color="error" weight="bold">
              Clear the trash? {entries.length} plan(s) will be deleted for good.
            </Text>
            <Box gap={2}>
              <Button key="confirm-clear" hotkey="y" label="Yes, clear trash (y)" onPress={props.onConfirmClear} />
              <Button key="cancel-clear" hotkey="n" label="Cancel (n)" onPress={props.onCancelClear} />
            </Box>
          </Box>
        ) : (
          <Button key="clear" hotkey="c" label="Clear trash (c)" onPress={props.onAskClear} />
        ))}
      {message && <Text dimColor>{message}</Text>}
    </Box>
  )
}
