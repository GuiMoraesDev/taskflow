import { Dialog } from '../atoms/Dialog'
import type { Ui } from '../ui'

export type MenuItem = { key: string; icon: string; label: string; hotkey: string; onPress: () => void }

type ActionMenuProps = { ui: Ui; items: MenuItem[]; top: number; right: number }

// A button reads `[ <icon> <label> ]`, its icon two cells wide.
const buttonWidth = (item: MenuItem) => item.label.length + 7

// A dropdown drawn over the content at `top`/`right` of its parent, one button per item.
export function ActionMenu({ ui, items, top, right }: ActionMenuProps) {
  const { Button } = ui

  return (
    <Dialog
      ui={ui}
      top={top}
      right={right}
      borderColor="#B38CFF"
      rows={items.map(item => ({
        key: item.key,
        width: buttonWidth(item),
        content: <Button hotkey={item.hotkey} label={`${item.icon} ${item.label}`} onPress={item.onPress} />,
      }))}
    />
  )
}
