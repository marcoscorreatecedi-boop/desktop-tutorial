import { NavLink, useParams } from 'react-router-dom'
import {
  LayoutDashboard,
  Camera,
  CalendarDays,
  GitBranch,
  Building2,
  ChevronRight,
} from 'lucide-react'

interface Props {
  projectName?: string
}

export function Sidebar({ projectName }: Props) {
  const { projectId } = useParams<{ projectId: string }>()
  const base = `/project/${projectId}`

  const links = [
    { to: `${base}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
    { to: `${base}/diary`, icon: Camera, label: 'Diário de Obra' },
    { to: `${base}/schedule`, icon: CalendarDays, label: 'Cronograma Físico' },
    { to: `${base}/critical-path`, icon: GitBranch, label: 'Caminho Crítico' },
  ]

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-primary-500 rounded-lg p-1.5">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">CivilNobre</span>
        </div>
        {projectName && (
          <p className="text-gray-400 text-xs truncate mt-1 pl-0.5">{projectName}</p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white text-xs transition-colors"
        >
          <Building2 className="w-3 h-3" />
          Trocar projeto
        </NavLink>
      </div>
    </aside>
  )
}
