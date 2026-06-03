import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  BarChart3,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitBranch,
  TrendingUp,
  Layers,
} from 'lucide-react'
import { api } from '../lib/api'
import type { DashboardStats } from '../types'
import { ProgressBar } from '../components/ProgressBar'
import { StatusBadge } from '../components/StatusBadge'

export function DashboardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    api.stages.dashboard(Number(projectId)).then(setData).finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Carregando dashboard...</div>
      </div>
    )
  }

  if (!data) return null

  const { project, stats, recent_issues, critical_stages } = data

  const statCards = [
    {
      label: 'Progresso Geral',
      value: `${project.overall_progress.toFixed(0)}%`,
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50',
      sub: `${stats.completed_stages}/${stats.total_stages} etapas concluídas`,
    },
    {
      label: 'Fotos Analisadas',
      value: `${stats.analyzed_uploads}/${stats.total_uploads}`,
      icon: Camera,
      color: 'text-green-600 bg-green-50',
      sub: 'registros no diário',
    },
    {
      label: 'Problemas Detectados',
      value: stats.total_issues,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
      sub: 'pela análise de IA',
    },
    {
      label: 'Etapas em Andamento',
      value: stats.in_progress_stages,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-50',
      sub: `${stats.delayed_stages} em atraso`,
    },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary-600" />
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">{project.name}</p>
        {project.address && <p className="text-gray-400 text-sm">{project.address}</p>}
      </div>

      {/* Overall progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900">Progresso Geral da Obra</h2>
            <p className="text-sm text-gray-500">
              Início: {project.start_date ? new Date(project.start_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
            </p>
          </div>
          <span className="text-3xl font-bold text-primary-600">
            {project.overall_progress.toFixed(0)}%
          </span>
        </div>
        <ProgressBar
          value={project.overall_progress}
          size="lg"
          color={project.overall_progress >= 100 ? 'green' : project.overall_progress > 50 ? 'blue' : 'yellow'}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card">
            <div className={`inline-flex p-2.5 rounded-xl ${color} mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical path stages */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <GitBranch className="w-4 h-4 text-red-500" />
            Caminho Crítico ({stats.critical_path_length} etapas)
          </h3>
          {critical_stages.length === 0 ? (
            <p className="text-gray-400 text-sm">Sem etapas críticas identificadas</p>
          ) : (
            <div className="space-y-3">
              {critical_stages.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">{s.name}</span>
                      <StatusBadge status={s.status} />
                    </div>
                    <ProgressBar value={s.progress} size="sm" className="mt-1.5" color="orange" />
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">{s.progress.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent issues */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Problemas Recentes (IA)
          </h3>
          {recent_issues.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Nenhum problema detectado</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {recent_issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  {issue}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Stage overview */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-primary-600" />
          Resumo das Etapas
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {stats.completed_stages} concluídas · {stats.in_progress_stages} em andamento · {stats.delayed_stages} em atraso
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <div className="text-xl font-bold text-green-700">{stats.completed_stages}</div>
            <div className="text-xs text-green-600">Concluídas</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <div className="text-xl font-bold text-blue-700">{stats.in_progress_stages}</div>
            <div className="text-xs text-blue-600">Em Andamento</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-xl">
            <div className="text-xl font-bold text-red-700">{stats.delayed_stages}</div>
            <div className="text-xs text-red-600">Em Atraso</div>
          </div>
        </div>
      </div>
    </div>
  )
}
