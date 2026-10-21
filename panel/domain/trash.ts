import type { TrashEntry } from '../../types'
import { isSafeProjectName } from './parse'

export const TRASH_DIR = '.trash'

const ENTRY = /^(.+)--(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/

const pad = (value: number) => String(value).padStart(2, '0')

// Local time, so the folder name matches the clock the user saw when deleting.
export function trashEntryName(name: string, at: Date) {
  const date = `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}`
  const time = `${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}`

  return `${name}--${date}-${time}`
}

export function parseTrashEntry(entry: string): TrashEntry | null {
  const match = entry.match(ENTRY)
  if (!match) return null
  const part = (index: number) => Number(match[index])
  const deletedAt = new Date(part(2), part(3) - 1, part(4), part(5), part(6), part(7)).getTime()

  return { entry, name: match[1] ?? '', deletedAt }
}

const trimSlashes = (path: string) => path.replace(/\/+$/, '')

// Compared on real paths by the caller, so a symlink cannot smuggle a target out of the base.
export function isDirectChild(base: string, target: string) {
  const prefix = `${trimSlashes(base)}/`
  if (!target.startsWith(prefix)) return false

  return isSafeProjectName(trimSlashes(target).slice(prefix.length))
}

export function recoverDecision(entry: string, existingPlans: string[]): { name: string } | { error: string } {
  const parsed = parseTrashEntry(entry)
  if (parsed === null || !isSafeProjectName(parsed.name) || !isSafeProjectName(entry)) {
    return { error: `Refused to recover "${entry}".` }
  }
  if (existingPlans.includes(parsed.name)) {
    return { error: `A plan named "${parsed.name}" already exists - rename or delete it first.` }
  }

  return { name: parsed.name }
}

export function clearTargets(base: string, entries: string[]) {
  return entries.filter(isSafeProjectName).map(entry => `${trimSlashes(base)}/${TRASH_DIR}/${entry}`)
}

export function isPlanFolder(name: string) {
  return name !== TRASH_DIR
}
