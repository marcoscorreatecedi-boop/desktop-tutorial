import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { ProjectsPage } from './pages/ProjectsPage'
import { DashboardPage } from './pages/DashboardPage'
import { DiaryPage } from './pages/DiaryPage'
import { SchedulePage } from './pages/SchedulePage'
import { CriticalPathPage } from './pages/CriticalPathPage'
import { useState, useEffect } from 'react'
import { api } from './lib/api'
import type { Project } from './types'

function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    if (projectId) {
      api.projects.get(Number(projectId)).then(setProject).catch(() => null)
    }
  }, [projectId])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar projectName={project?.name} />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="diary" element={<DiaryPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="critical-path" element={<CriticalPathPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/project/:projectId/*" element={<ProjectLayout />} />
        {/* Legacy routes without project prefix — redirect to home */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
