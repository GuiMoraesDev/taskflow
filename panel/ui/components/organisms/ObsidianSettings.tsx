import type { SettingsDraft, SettingsView } from '../../../../types'
import { basename } from '../../../domain/plan-dir'
import type { Ui } from '../ui'

type ObsidianSettingsProps = {
  ui: Ui
  view: SettingsView
  onBack: () => void
  onChange: (change: Partial<SettingsDraft>) => void
  onSave: () => void
}

const SETUP_STEPS = [
  'Open the vault once in Obsidian so it appears in its vault list, then pick it here or set an absolute path.',
  '.claude/workflow.env is local and gitignored.',
  'Add the vault to permissions.additionalDirectories to avoid prompts.',
]

const OTHER_VAULT = ''

export function ObsidianSettings({ ui, view, onBack, onChange, onSave }: ObsidianSettingsProps) {
  const { Box, Text, Button } = ui
  if (!('Input' in ui)) return <Text dimColor>Settings need a surface that takes input.</Text>
  const { Input, Select } = ui
  const { current, draft, saveError } = view
  const vault = current.vaultPath ? basename(current.vaultPath) : current.vault

  return (
    <Box flexDirection="column" gap={1}>
      <Box justifyContent="space-between">
        <Button key="back" hotkey="b" label="← Plans (b)" onPress={onBack} />
        <Button key="save" hotkey="s" label="Save (s)" onPress={onSave} />
      </Box>

      <Box flexDirection="column">
        <Text weight="bold">Plan source</Text>
        <Text>
          <Text dimColor>Source </Text>
          {current.source === 'obsidian' ? 'Obsidian' : 'Repo'}
        </Text>
        {current.source === 'obsidian' && (
          <Box flexDirection="column">
            <Text wrap="truncate-end">
              <Text dimColor>Vault </Text>
              {vault || 'not set'}
            </Text>
            <Text wrap="truncate-end">
              <Text dimColor>Inner path </Text>
              {current.path || 'vault root'}
            </Text>
          </Box>
        )}
        {current.error && <Text color="error">{current.error}</Text>}
      </Box>

      {(current.source !== 'obsidian' || current.error !== null) && (
        <Box flexDirection="column">
          <Text weight="bold">Set up Obsidian</Text>
          {SETUP_STEPS.map((step, index) => (
            <Text key={`step-${index}`} dimColor>
              {index + 1}. {step}
            </Text>
          ))}
        </Box>
      )}

      <Box flexDirection="column">
        <Select
          key="source"
          label="Source"
          value={draft.source}
          options={[
            { value: 'repo', label: 'Repo' },
            { value: 'obsidian', label: 'Obsidian' },
          ]}
          onSelect={value => onChange({ source: value === 'obsidian' ? 'obsidian' : 'repo' })}
        />
        {draft.source === 'obsidian' && (
          <Box flexDirection="column">
            <Select
              key="vault"
              label="Vault"
              value={draft.vaultPath === '' ? draft.vault : OTHER_VAULT}
              options={[
                ...current.vaults.map(item => ({ value: item.name, label: item.name })),
                { value: OTHER_VAULT, label: 'Absolute path' },
              ]}
              onSelect={value => onChange({ vault: value, vaultPath: '' })}
            />
            <Input
              key="vault-path"
              label="Vault path"
              placeholder="/absolute/path/to/vault"
              value={draft.vaultPath}
              onInput={value => onChange({ vaultPath: value })}
              onSubmit={onSave}
            />
            <Input
              key="inner-path"
              label="Inner path"
              placeholder={`taskflow/${current.repoName}`}
              value={draft.path}
              onInput={value => onChange({ path: value })}
              onSubmit={onSave}
            />
          </Box>
        )}
        {saveError && <Text color="error">{saveError}</Text>}
      </Box>
    </Box>
  )
}
