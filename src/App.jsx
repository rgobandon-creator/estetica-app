import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function Layout({ user, onLogout }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/cobros" element={<Cobros />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/reservas-admin" element={<ReservasAdmin />} />
          <Route path="/configuracion" element={<Configuracion />} />
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