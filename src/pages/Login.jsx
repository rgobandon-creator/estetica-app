import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function Login({ onLogin }) {
  const [modo, setModo] = useState('login') // login | registro | recuperar
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setCargando(true)
    setError('')
    setMensaje('')

    if (modo === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Email o contraseña incorrectos')
      else onLogin(data.user)

    } else if (modo === 'registro') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else { setMensaje('Revisa tu email para confirmar la cuenta, luego inicia sesión.'); setModo('login') }

    } else if (modo === 'recuperar') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      })
      if (error) setError('Error al enviar el email: ' + error.message)
      else setMensaje('✅ Te enviamos un link a ' + email + ' para restablecer tu contraseña. Revisa también el spam.')
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center mb-3">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">GlowSuite</h1>
          <p className="text-sm text-gray-400 mt-0.5">Sistema de gestión estética</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-5">
            {modo === 'login' ? 'Iniciar sesión' : modo === 'registro' ? 'Crear cuenta' : 'Recuperar contraseña'}
          </h2>

          {error && <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}
          {mensaje && <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">{mensaje}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="tu@email.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>
            </div>

            {modo !== 'recuperar' && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Contraseña</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={verPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                  <button type="button" onClick={() => setVerPassword(!verPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {verPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Olvidaste contraseña */}
            {modo === 'login' && (
              <div className="text-right">
                <button type="button" onClick={() => { setModo('recuperar'); setError(''); setMensaje(''); }}
                  className="text-xs text-rose-500 hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button type="submit" disabled={cargando}
              className="w-full py-2.5 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50">
              {cargando ? 'Cargando...' : modo === 'login' ? 'Entrar' : modo === 'registro' ? 'Crear cuenta' : 'Enviar link de recuperación'}
            </button>
          </form>

          <div className="mt-4 text-center space-y-2">
            {modo === 'recuperar' ? (
              <button onClick={() => { setModo('login'); setError(''); setMensaje(''); }}
                className="text-sm text-rose-500 hover:underline">
                ← Volver al inicio de sesión
              </button>
            ) : (
              <button onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError(''); setMensaje(''); }}
                className="text-sm text-rose-500 hover:underline">
                {modo === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}