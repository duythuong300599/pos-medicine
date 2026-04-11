import { cn } from '@/lib/utils'
import type { StatsDateFilter } from '@/lib/dashboard-utils'

interface StatsFilterBarProps {
  value: StatsDateFilter
  onChange: (filter: StatsDateFilter) => void
}

const filters: { label: string; value: StatsDateFilter }[] = [
  { label: 'Hôm nay', value: 'today' },
  { label: '7 ngày', value: '7days' },
  { label: '30 ngày', value: '30days' },
  { label: 'Tháng này', value: 'month' },
]

export function StatsFilterBar({ value, onChange }: StatsFilterBarProps) {
  return (
    <div className="flex gap-1.5 border-b px-6 py-3">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            value === f.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
