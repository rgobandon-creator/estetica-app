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

function Layout({ user, perfil, onLogout }) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const location = useLocation();
  const esAdmin = perfil?.rol !== "empleada";

  useEffect(() => { setSidebarAbierto(false); }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} perfil={perfil} onLogout={onLogout} open={sidebarAbierto} onClose={() => setSidebarAbierto(false)} />

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
          <Route path="/" element={esAdmin ? <Dashboard /> : <Navigate to="/agenda" />} />
          <Route path="/agenda" element={<Agenda soloProfesional={esAdmin ? null : perfil?.profesional_nombre} />} />
          <Route path="/clientes" element={esAdmin ? <Clientes /> : <Navigate to="/agenda" />} />
          <Route path="/cobros" element={esAdmin ? <Cobros /> : <Navigate to="/agenda" />} />
          <Route path="/servicios" element={esAdmin ? <Servicios /> : <Navigate to="/agenda" />} />
          <Route path="/reservas-admin" element={esAdmin ? <ReservasAdmin /> : <Navigate to="/agenda" />} />
          <Route path="/configuracion" element={esAdmin ? <Configuracion /> : <Navigate to="/agenda" />} />
          <Route path="/profesionales" element={esAdmin ? <Profesionales /> : <Navigate to="/agenda" />} />
          <Route path="*" element={<Navigate to={esAdmin ? "/" : "/agenda"} />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)

  async function cargarPerfil(userId) {
    if (!userId) { setPerfil(null); return; }
    const { data } = await supabase.from("perfiles").select("*").eq("id", userId).maybeSingle();
    // Si no existe fila en "perfiles" para este usuario, se asume admin (compatibilidad con cuentas antiguas)
    setPerfil(data || { rol: "admin" });
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      await cargarPerfil(session?.user?.id)
      setCargando(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      cargarPerfil(session?.user?.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setPerfil(null)
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
          user ? <Layout user={user} perfil={perfil} onLogout={handleLogout}/> : <Login onLogin={setUser}/>
        }/>
      </Routes>
    </BrowserRouter>
  )
}