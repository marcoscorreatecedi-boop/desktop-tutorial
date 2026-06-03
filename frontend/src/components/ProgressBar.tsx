interface Props {
  value: number
  className?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'orange'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const colors = {
  blue: 'bg-primary-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
}

const sizes = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({ value, className = '', color = 'blue', showLabel = false, size = 'md' }: Props) {
  const pct = Math.max(0, Math.min(100, value))

  return (
    <div className={className}>
      <div className={`rounded-full bg-gray-200 overflow-hidden ${sizes[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 mt-1 block">{pct.toFixed(0)}%</span>
      )}
    </div>
  )
}
