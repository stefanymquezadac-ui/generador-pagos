import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import Generador from './components/Generador'
import Historial from './components/Historial'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('generador')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ color: '#fff', fontSize: 16 }}>Cargando...</div>
    </div>
  )

  if (!session) return <Login />

  const user = session.user

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🏦</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Generador de Pagos</div>
            <div style={{ color: '#93c5fd', fontSize: 11 }}>Banco Agrícola · Maverick Store</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 3 }}>
            {[
              { id: 'generador', label: '⚡ Generar pagos' },
              { id: 'historial', label: '📋 Historial' }
            ].map(v => (
              <button key={v.id} onClick={() => setVista(v.id)} style={{
                padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: vista === v.id ? '#fff' : 'transparent',
                color: vista === v.id ? '#1e3a5f' : '#93c5fd',
                fontSize: 12, fontWeight: vista === v.id ? 600 : 400
              }}>{v.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 700
            }}>
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <button onClick={() => supabase.auth.signOut()} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#cbd5e1', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer'
            }}>Salir</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{
          background: '#fff', borderRadius: 14, padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
              {vista === 'generador' ? '⚡ Generar archivos de pago' : '📋 Historial de pagos'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              {vista === 'generador'
                ? 'Carga el maestro y el Excel semanal para generar los CSV listos para el banco.'
                : 'Registro de todos los pagos procesados.'}
            </p>
          </div>
          {vista === 'generador' ? <Generador /> : <Historial />}
        </div>
      </div>
    </div>
  )
}
