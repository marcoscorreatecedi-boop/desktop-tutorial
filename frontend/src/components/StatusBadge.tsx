type Status = 'pending' | 'in_progress' | 'completed' | 'delayed'

const config: Record<Status, { label: string; cls: string }> = {
  pending: { label: 'Pendente', cls: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'Em Andamento', cls: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Concluído', cls: 'bg-green-100 text-green-700' },
  delayed: { label: 'Atrasado', cls: 'bg-red-100 text-red-700' },
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, cls } = config[status] ?? config.pending
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
