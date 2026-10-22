import type { Segment } from '../../../domain/plan-shape'
import type { Ui } from '../ui'
import { palette } from '../palette'

type SegmentedBarProps = { ui: Ui; segments: Segment[][]; width: number }

const cellOf: Record<Segment, { glyph: string; color: string }> = {
  merged: { glyph: '█', color: palette.purple },
  done: { glyph: '█', color: palette.green },
  progress: { glyph: '▒', color: palette.amber },
  pending: { glyph: '░', color: palette.faint },
}

const cellsPerGroup = (sizes: number[], room: number): number[] => {
  const total = sizes.reduce((sum, size) => sum + size, 0)

  if (total <= room) return sizes

  const spare = Math.max(room - sizes.length, 0)
  const shares = sizes.map(size => (size / total) * spare)
  const cells = shares.map(share => 1 + Math.floor(share))
  const byRemainder = shares
    .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
    .sort((a, b) => b.remainder - a.remainder)
  let left = spare - cells.reduce((sum, count) => sum + count - 1, 0)

  for (const { index } of byRemainder) {
    if (left <= 0) break
    cells[index] = (cells[index] ?? 1) + 1
    left -= 1
  }

  return cells
}

export const scaleSegments = (segments: Segment[][], width: number): Segment[][] => {
  const groups = segments.filter(group => group.length > 0)
  const room = width - Math.max(groups.length - 1, 0)
  const cells = cellsPerGroup(
    groups.map(group => group.length),
    room,
  )

  return groups.map((group, g) => {
    const count = cells[g] ?? group.length

    if (count === group.length) return group

    const scaled = Array.from(
      { length: count },
      (_, i): Segment => group[Math.floor(((i + 0.5) * group.length) / count)] ?? 'pending',
    )
    const first = group.indexOf('progress')

    if (first >= 0 && !scaled.includes('progress'))
      scaled[Math.min(Math.floor((first * count) / group.length), count - 1)] = 'progress'

    return scaled
  })
}

export function SegmentedBar({ ui: { Text }, segments, width }: SegmentedBarProps) {
  return (
    <Text>
      {scaleSegments(segments, width).map((group, g) => (
        <Text key={`group-${g}`}>
          {g > 0 && <Text color={palette.faint}>│</Text>}
          {group.map((segment, i) => (
            <Text key={`cell-${i}`} color={cellOf[segment].color}>
              {cellOf[segment].glyph}
            </Text>
          ))}
        </Text>
      ))}
    </Text>
  )
}
