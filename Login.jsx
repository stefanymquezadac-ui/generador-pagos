import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Historial() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarHistorial()
  }, [])

  async function cargarHistorial() {
    setLoading(true)
    const { data } = await supabase
      .from('historial_pagos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setRegistros(data || [])
    setLoading(false)
  }

  const badge = (txt, color) => (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: color + '20', color: color
    }}>{txt}</span>
  )

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
      Cargando historial...
    </div>
  )

  if (!registros.length) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>📂</div>
      <p style={{ fontSize: 14 }}>Aún no hay pagos procesados</p>
    </div>
  )

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Fecha', 'Descripción', 'Agrícola 365', 'Agrícola directo', 'Total', 'Alertas'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {registros.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#374151' }}>
                  {new Date(r.created_at).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '10px 12px', color: '#374151', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.descripcion}>
                  {r.descripcion}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {badge(`${r.registros_365} reg · $${Number(r.total_365).toFixed(2)}`, '#2563eb')}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {badge(`${r.registros_agr} reg · $${Number(r.total_agr).toFixed(2)}`, '#0891b2')}
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                  ${(Number(r.total_365) + Number(r.total_agr)).toFixed(2)}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {r.alertas > 0
                    ? badge(`${r.alertas} alertas`, '#dc2626')
                    : badge('Sin alertas', '#16a34a')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
