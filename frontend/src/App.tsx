import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Overview from './pages/Overview'
import Departments from './pages/Departments'
import Budget from './pages/Budget'
import Dependencies from './pages/Dependencies'
import People from './pages/People'
import AnomalyBanner from './components/AnomalyBanner'

const nav = [
  { to: '/', label: 'Overview' },
  { to: '/departments', label: 'Departments' },
  { to: '/budget', label: 'Budget' },
  { to: '/dependencies', label: 'Dependencies' },
  { to: '/people', label: 'People' },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 bg-gray-900 text-white flex flex-col">
          <div className="px-5 py-5 border-b border-gray-700">
            <div className="text-xs text-yellow-400 font-semibold uppercase tracking-wider mb-1">Surya Gram</div>
            <div className="text-sm text-gray-300 leading-tight">12-Village Solar Microgrid</div>
          </div>
          <nav className="flex-1 py-4">
            {nav.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `block px-5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-yellow-500 text-gray-900 font-semibold'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="px-5 py-3 border-t border-gray-700 text-xs text-gray-500">
            As of 15 Sep 2026
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <AnomalyBanner />
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/departments/:id" element={<Departments />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/dependencies" element={<Dependencies />} />
              <Route path="/people" element={<People />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
