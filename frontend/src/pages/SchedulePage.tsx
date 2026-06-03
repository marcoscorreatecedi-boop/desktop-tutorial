import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, Info } from 'lucide-react'
import { api } from '../lib/api'
import type { Stage } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { ProgressBar } from '../components/ProgressBar'

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500',
  in_progress: 'bg-blue-500',
  delayed: 'bg-red-500',
  pending: 'bg-gray-300',
}

const PROGRESS_COLORS: Record<string, 'green' | 'blue' | 'red' | 'yellow'> = {
  completed: 'green',
  in_progress: 'blue',
  delayed: 'red',
  pending: 'yellow',
}

export function SchedulePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Stage | null>(null)

  useEffect(() => {
    if (!projectId) return
    api.stages.list(Number(projectId)).then(setStages).finally(() => setLoading(false))
  }, [projectId])

  const totalDays = stages.length > 0 ? Math.max(...stages.map(s => s.early_finish)) : 0
  const projectProgress = stages.length > 0
    ? stages.reduce((a, s) => a + s.progress, 0) / stages.length
    : 0

  const handleProgressUpdate = async (stage: Stage, value: number) => {
    const updated = await api.stages.update(stage.id, { progress: value })
    setStages(prev => prev.map(s => (s.id === stage.id ? updated : s)))
    if (selected?.id === stage.id) setSelected(updated)
  }

  if (loading) {
    return <div className="p-8 text-gray-400">Carregando cronograma...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary-600" />
          Cronograma Físico
        </h1>
        <p className="text-gray-500 mt-1">
          Duração total: <strong>{totalDays} dias</strong> · Progresso geral:{' '}
          <strong>{projectProgress.toFixed(0)}%</strong>
        </p>
      </div>

      {/* Gantt Chart */}
      <div className="card overflow-x-auto">
        <h2 className="font-semibold text-gray-900 mb-4">Gráfico de Gantt</h2>
        <div className="min-w-[700px]">
          {/* Header - day markers */}
          <div className="flex mb-2 pl-52">
            {Array.from({ length: Math.ceil(totalDays / 10) + 1 }, (_, i) => i * 10).map(d => (
              <div
                key={d}
                className="text-xs text-gray-400 flex-shrink-0"
                style={{ width: `${(10 / (totalDays || 1)) * 100}%` }}
              >
                {d > 0 && `${d}d`}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {stages.map(stage => {
              const leftPct = (stage.early_start / (totalDays || 1)) * 100
              const widthPct = (stage.duration_days / (totalDays || 1)) * 100

              return (
                <div
                  key={stage.id}
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setSelected(selected?.id === stage.id ? null : stage)}
                >
                  {/* Name */}
                  <div className="w-48 flex-shrink-0 text-right">
                    <span className={`text-xs font-medium truncate block ${stage.is_critical ? 'text-red-700' : 'text-gray-700'}`}>
                      {stage.is_critical && '★ '}{stage.name}
                    </span>
                  </div>

                  {/* Bar track */}
                  <div className="flex-1 relative h-7 bg-gray-100 rounded-lg overflow-hidden">
                    {/* Planned bar */}
                    <div
                      className={`absolute top-1 h-5 rounded-md opacity-90 ${
                        stage.is_critical ? 'bg-red-500' : STATUS_COLORS[stage.status]
                      }`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    >
                      {/* Fill based on progress */}
                      <div
                        className="h-full rounded-md bg-white/25"
                        style={{ width: `${100 - stage.progress}%`, float: 'right' }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                        {stage.progress > 0 && `${stage.progress.toFixed(0)}%`}
                      </span>
                    </div>
                  </div>

                  {/* Days */}
                  <div className="w-10 text-right flex-shrink-0">
                    <span className="text-xs text-gray-400">{stage.duration_days}d</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm bg-red-500" />
              Caminho crítico (★)
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              Em andamento
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              Concluído
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm bg-gray-300" />
              Pendente
            </div>
          </div>
        </div>
      </div>

      {/* Stage table */}
      <div className="card overflow-x-auto">
        <h2 className="font-semibold text-gray-900 mb-4">Tabela de Etapas</h2>
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left pb-2 font-medium">Etapa</th>
              <th className="text-center pb-2 font-medium">Duração</th>
              <th className="text-center pb-2 font-medium">Início Plano</th>
              <th className="text-center pb-2 font-medium">Fim Plano</th>
              <th className="text-center pb-2 font-medium">Folga</th>
              <th className="text-center pb-2 font-medium">Status</th>
              <th className="text-left pb-2 font-medium">Progresso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stages.map(s => (
              <tr
                key={s.id}
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                  selected?.id === s.id ? 'bg-primary-50' : ''
                }`}
                onClick={() => setSelected(selected?.id === s.id ? null : s)}
              >
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    {s.is_critical && (
                      <span className="text-red-500 text-xs font-bold">★</span>
                    )}
                    <span className={`font-medium ${s.is_critical ? 'text-red-700' : 'text-gray-800'}`}>
                      {s.name}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-center text-gray-600">{s.duration_days}d</td>
                <td className="py-2.5 text-center text-gray-500 text-xs">
                  {s.planned_start ? new Date(s.planned_start + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className="py-2.5 text-center text-gray-500 text-xs">
                  {s.planned_end ? new Date(s.planned_end + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className="py-2.5 text-center">
                  <span className={`text-xs font-medium ${s.float_time === 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {s.float_time}d
                  </span>
                </td>
                <td className="py-2.5 text-center">
                  <StatusBadge status={s.status} />
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <ProgressBar
                      value={s.progress}
                      color={PROGRESS_COLORS[s.status] ?? 'blue'}
                      className="flex-1"
                      size="sm"
                    />
                    <span className="text-xs text-gray-500 w-8">{s.progress.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="card border-primary-200 bg-primary-50">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-primary-600" />
            <h3 className="font-semibold text-primary-900">{selected.name}</h3>
            {selected.is_critical && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                Caminho Crítico
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
            <div>
              <div className="text-xs text-gray-500">Início Cedo (ES)</div>
              <div className="font-medium">Dia {selected.early_start}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Fim Cedo (EF)</div>
              <div className="font-medium">Dia {selected.early_finish}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Início Tarde (LS)</div>
              <div className="font-medium">Dia {selected.late_start}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Folga Total</div>
              <div className={`font-medium ${selected.float_time === 0 ? 'text-red-600' : ''}`}>
                {selected.float_time} dias
              </div>
            </div>
          </div>

          {/* Manual progress update */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700">
              Atualizar Progresso Manualmente
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={selected.progress}
                onChange={e => handleProgressUpdate(selected, Number(e.target.value))}
                className="flex-1 accent-primary-600"
              />
              <span className="text-sm font-bold text-primary-600 w-10">
                {selected.progress.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
