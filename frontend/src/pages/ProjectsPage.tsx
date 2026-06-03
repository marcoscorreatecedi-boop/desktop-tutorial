import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, MapPin, Calendar, Trash2, ChevronRight, HardHat } from 'lucide-react'
import { api } from '../lib/api'
import type { Project } from '../types'
import { ProgressBar } from '../components/ProgressBar'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', start_date: '' })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.projects.list().then(setProjects).finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const p = await api.projects.create(form)
      setProjects(prev => [...prev, p])
      setShowForm(false)
      setForm({ name: '', address: '', start_date: '' })
      navigate(`/project/${p.id}/dashboard`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Remover este projeto?')) return
    await api.projects.delete(id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 shadow-lg">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">CivilNobre</h1>
          <p className="text-gray-400 mt-2">Diário de Obra Inteligente com IA</p>
        </div>

        {/* Projects list */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Meus Projetos</h2>
              <p className="text-sm text-gray-500">{projects.length} obra(s) cadastrada(s)</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nova Obra
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">Carregando...</div>
          ) : projects.length === 0 && !showForm ? (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma obra cadastrada</p>
              <p className="text-gray-400 text-sm mt-1">Crie sua primeira obra para começar</p>
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm">
                Criar primeira obra
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}/dashboard`)}
                  className="p-5 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4 group"
                >
                  <div className="bg-primary-100 rounded-xl p-3 flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                    </div>
                    {p.address && (
                      <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{p.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <ProgressBar value={p.overall_progress} className="flex-1" size="sm" />
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {p.overall_progress.toFixed(0)}%
                      </span>
                    </div>
                    {p.start_date && (
                      <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                        <Calendar className="w-3 h-3" />
                        Início: {new Date(p.start_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create form */}
          {showForm && (
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Nova Obra</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Obra *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Residência João Silva"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <input
                    type="text"
                    placeholder="Rua, número, bairro, cidade"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">
                    {saving ? 'Criando...' : 'Criar Obra'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary flex-1 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
