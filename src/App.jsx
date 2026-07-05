import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Menu, Sparkles } from 'lucide-react'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Clientes from './pages/Clientes'
import Cobros from './pages/Cobros'
import { Servicios } from './pages/Servicios'
import ReservaPublica from './pages/ReservaPublica'
import ReservasAdmin from './pages/ReservasAdmin'
import Configuracion from './pages/Configuracion'
import Profesionales from './pages/Profesionales'

function Layout({ user, onLogout }) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const location = useLocation();

  useEffect(() => { setSidebarAbierto(false); }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={onLogout} open={sidebarAbierto} onClose={() => setSidebarAbierto(false)} />

      {/* Barra superior visible solo en móvil */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 h-14 flex items-center px-4 gap-3">
        <button onClick={() => setSidebarAbierto(true)} className="p-1.5 -ml-1.5 text-gray-600">
          <Menu size={22}/>
        </button>
        <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} className="text-white"/>
        </div>
        <span className="font-semibold text-gray-900 text-sm truncate">Panel de gestión</span>
      </div>

      <main className="flex-1 overflow-auto min-w-0 pt-14 lg:pt-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/cobros" element={<Cobros />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/reservas-admin" element={<ReservasAdmin />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/profesionales" element={<Profesionales />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setCargando(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (cargando) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reservar" element={<ReservaPublica />} />
        <Route path="/*" element={
          user ? <Layout user={user} onLogout={handleLogout}/> : <Login onLogin={setUser}/>
        }/>
      </Routes>
    </BrowserRouter>
  )
}