import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { GitBranch, ArrowRight, AlertCircle, Clock, CheckCircle2, Circle } from 'lucide-react'
import { api } from '../lib/api'
import type { Stage } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { ProgressBar } from '../components/ProgressBar'

export function CriticalPathPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [allStages, setAllStages] = useState<Stage[]>([])
  const [criticalStages, setCriticalStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    Promise.all([
      api.stages.list(Number(projectId)),
      api.stages.criticalPath(Number(projectId)),
    ]).then(([all, critical]) => {
      setAllStages(all)
      setCriticalStages(critical)
    }).finally(() => setLoading(false))
  }, [projectId])

  const totalDuration = criticalStages.length > 0
    ? Math.max(...criticalStages.map(s => s.early_finish))
    : 0

  const completedCritical = criticalStages.filter(s => s.status === 'completed').length
  const cpProgress = criticalStages.length > 0
    ? criticalStages.reduce((a, s) => a + s.progress, 0) / criticalStages.length
    : 0

  const nonCritical = allStages.filter(s => !s.is_critical)

  if (loading) {
    return <div className="p-8 text-gray-400">Calculando caminho crítico...</div>
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-red-500" />
          Caminho Crítico (CPM)
        </h1>
        <p className="text-gray-500 mt-1">
          Sequência de atividades que define a duração mínima da obra
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">{totalDuration}</div>
          <div className="text-sm text-gray-600 font-medium">Dias de Duração</div>
          <div className="text-xs text-gray-400">duração mínima da obra</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900">{criticalStages.length}</div>
          <div className="text-sm text-gray-600 font-medium">Atividades Críticas</div>
          <div className="text-xs text-gray-400">folga zero</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{completedCritical}</div>
          <div className="text-sm text-gray-600 font-medium">Concluídas</div>
          <div className="text-xs text-gray-400">no caminho crítico</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{cpProgress.toFixed(0)}%</div>
          <div className="text-sm text-gray-600 font-medium">Progresso CP</div>
          <div className="text-xs text-gray-400">do caminho crítico</div>
        </div>
      </div>

      {/* Critical path visual */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-2">
          Diagrama do Caminho Crítico
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          Atividades com folga = 0 dias. Qualquer atraso aqui impacta diretamente o prazo final.
        </p>

        {criticalStages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <GitBranch className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Caminho crítico não calculado ainda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-start gap-0 min-w-max">
              {criticalStages.map((stage, i) => (
                <div key={stage.id} className="flex items-center">
                  {/* Node */}
                  <div className={`flex-shrink-0 w-36 ${i % 2 === 0 ? 'mt-0' : 'mt-0'}`}>
                    <div className={`rounded-xl border-2 p-3 ${
                      stage.status === 'completed'
                        ? 'border-green-500 bg-green-50'
                        : stage.status === 'in_progress'
                        ? 'border-blue-500 bg-blue-50'
                        : stage.status === 'delayed'
                        ? 'border-red-500 bg-red-50'
                        : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {stage.status === 'completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        ) : stage.status === 'in_progress' ? (
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-red-400" />
                        )}
                        <span className="text-xs font-bold text-red-700">Dia {stage.early_start}</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-800 leading-tight mb-2">
                        {stage.name}
                      </p>
                      <div className="text-xs text-gray-500 mb-1.5">{stage.duration_days} dias</div>
                      <ProgressBar value={stage.progress} size="sm" color={
                        stage.status === 'completed' ? 'green' :
                        stage.status === 'delayed' ? 'red' : 'blue'
                      } />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">{stage.progress.toFixed(0)}%</span>
                        <StatusBadge status={stage.status} />
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  {i < criticalStages.length - 1 && (
                    <div className="flex items-center px-1 flex-shrink-0">
                      <ArrowRight className="w-5 h-5 text-red-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CPM table */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">
          Análise CPM — Todas as Atividades
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left pb-2 font-medium">Atividade</th>
                <th className="text-center pb-2 font-medium">Dur.</th>
                <th className="text-center pb-2 font-medium">ES</th>
                <th className="text-center pb-2 font-medium">EF</th>
                <th className="text-center pb-2 font-medium">LS</th>
                <th className="text-center pb-2 font-medium">LF</th>
                <th className="text-center pb-2 font-medium">Folga</th>
                <th className="text-center pb-2 font-medium">Crítica?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allStages.map(s => (
                <tr key={s.id} className={s.is_critical ? 'bg-red-50' : ''}>
                  <td className="py-2.5 pr-4">
                    <span className={`font-medium ${s.is_critical ? 'text-red-700' : 'text-gray-800'}`}>
                      {s.name}
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-gray-600">{s.duration_days}d</td>
                  <td className="py-2.5 text-center text-gray-600">{s.early_start}</td>
                  <td className="py-2.5 text-center text-gray-600">{s.early_finish}</td>
                  <td className="py-2.5 text-center text-gray-600">{s.late_start}</td>
                  <td className="py-2.5 text-center text-gray-600">{s.late_finish}</td>
                  <td className="py-2.5 text-center">
                    <span className={`font-bold text-xs ${s.float_time === 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {s.float_time}d
                    </span>
                  </td>
                  <td className="py-2.5 text-center">
                    {s.is_critical ? (
                      <AlertCircle className="w-4 h-4 text-red-500 mx-auto" />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-gray-400">
          ES = Early Start · EF = Early Finish · LS = Late Start · LF = Late Finish
        </div>
      </div>

      {/* Non-critical with float */}
      {nonCritical.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-1">
            Atividades com Folga (Não-Críticas)
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Podem ser atrasadas até o valor de folga sem impactar o prazo da obra
          </p>
          <div className="space-y-2">
            {nonCritical
              .sort((a, b) => b.float_time - a.float_time)
              .map(s => (
                <div key={s.id} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                  <span className="flex-1 text-sm text-gray-700">{s.name}</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm font-medium text-green-700">
                      {s.float_time} dias de folga
                    </span>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
