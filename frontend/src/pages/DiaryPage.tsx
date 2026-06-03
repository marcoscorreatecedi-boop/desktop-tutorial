import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  Camera,
  Upload,
  Mic,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  FileImage,
  Volume2,
  Loader2,
} from 'lucide-react'
import { api } from '../lib/api'
import type { Upload as UploadType } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function DiaryPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [uploads, setUploads] = useState<UploadType[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [notes, setNotes] = useState('')
  const [analyzingId, setAnalyzingId] = useState<number | null>(null)
  const [selected, setSelected] = useState<UploadType | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    if (!projectId) return
    api.uploads.list(Number(projectId)).then(setUploads).finally(() => setLoading(false))
  }

  useEffect(load, [projectId])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !projectId) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const u = await api.uploads.upload(Number(projectId), file, notes)
        setUploads(prev => [u, ...prev])
      }
      setNotes('')
      if (fileRef.current) fileRef.current.value = ''
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyze = async (uploadId: number) => {
    setAnalyzingId(uploadId)
    try {
      const updated = await api.uploads.analyze(uploadId)
      setUploads(prev => prev.map(u => (u.id === uploadId ? updated : u)))
      if (selected?.id === uploadId) setSelected(updated)
    } finally {
      setAnalyzingId(null)
    }
  }

  const handleDelete = async (uploadId: number) => {
    if (!confirm('Remover este registro?')) return
    await api.uploads.delete(uploadId)
    setUploads(prev => prev.filter(u => u.id !== uploadId))
    if (selected?.id === uploadId) setSelected(null)
  }

  const photos = uploads.filter(u => u.file_type === 'photo')
  const audios = uploads.filter(u => u.file_type === 'audio')

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Camera className="w-6 h-6 text-primary-600" />
          Diário de Obra
        </h1>
        <p className="text-gray-500 mt-1">Envie fotos e áudios para análise automática com IA</p>
      </div>

      {/* Upload area */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Adicionar Registro</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Descreva o que está sendo registrado..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Enviando...' : 'Enviar Fotos/Áudios'}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Photo grid */}
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <FileImage className="w-4 h-4 text-primary-600" />
              Fotos ({photos.length})
            </h2>
            {loading ? (
              <div className="text-gray-400 text-sm">Carregando...</div>
            ) : photos.length === 0 ? (
              <div className="card text-center py-10 text-gray-400">
                <Camera className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma foto enviada ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map(u => (
                  <div
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      selected?.id === u.id ? 'border-primary-500' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={api.uploads.fileUrl(u.id)}
                      alt={u.original_name}
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs truncate">{u.original_name}</p>
                    </div>
                    {u.analyzed && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400 drop-shadow" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {format(new Date(u.created_at), 'dd/MM', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audio notes */}
          {audios.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Mic className="w-4 h-4 text-primary-600" />
                Notas de Áudio ({audios.length})
              </h2>
              <div className="space-y-2">
                {audios.map(u => (
                  <div
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      selected?.id === u.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="bg-primary-100 rounded-lg p-2">
                      <Volume2 className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{u.original_name}</p>
                      {u.notes && <p className="text-xs text-gray-500 truncate">{u.notes}</p>}
                    </div>
                    {u.analyzed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {selected ? (
            <>
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{selected.original_name}</h3>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {selected.file_type === 'photo' && (
                  <img
                    src={api.uploads.fileUrl(selected.id)}
                    alt={selected.original_name}
                    className="w-full rounded-lg mb-3 max-h-48 object-cover"
                  />
                )}

                {selected.notes && (
                  <p className="text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded-lg">
                    {selected.notes}
                  </p>
                )}

                <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                  <Clock className="w-3 h-3" />
                  {format(new Date(selected.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>

                {!selected.analyzed ? (
                  <button
                    onClick={() => handleAnalyze(selected.id)}
                    disabled={analyzingId === selected.id}
                    className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                  >
                    {analyzingId === selected.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analisando com IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analisar com IA
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Analisado pela IA
                  </div>
                )}
              </div>

              {/* Analysis result */}
              {selected.analysis && (
                <div className="card space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Etapa Identificada
                    </h4>
                    <p className="text-sm font-semibold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg">
                      {selected.analysis.stage_identified}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Progresso
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-primary-500"
                          style={{ width: `${selected.analysis.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-primary-600">
                        {selected.analysis.progress_percentage}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Descrição
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed">{selected.analysis.description}</p>
                  </div>

                  {selected.analysis.tasks_completed.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Tarefas Concluídas
                      </h4>
                      <ul className="space-y-1">
                        {selected.analysis.tasks_completed.map((t, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-green-500 mt-0.5">✓</span> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selected.analysis.issues_found.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        Problemas
                      </h4>
                      <ul className="space-y-1">
                        {selected.analysis.issues_found.map((t, i) => (
                          <li key={i} className="text-xs text-red-700 flex items-start gap-1.5 bg-red-50 p-1.5 rounded">
                            <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" /> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selected.analysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-blue-500" />
                        Recomendações
                      </h4>
                      <ul className="space-y-1">
                        {selected.analysis.recommendations.map((t, i) => (
                          <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                            <span className="text-blue-500">→</span> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-xs text-gray-400 border-t pt-2">
                    Confiança: {(selected.analysis.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center py-10 text-gray-400">
              <Camera className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Selecione uma foto ou áudio</p>
              <p className="text-xs mt-1">para ver detalhes e análise de IA</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
