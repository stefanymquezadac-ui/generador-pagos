import { useState, useRef } from 'react'
import { parseMaestro, parseComisiones, procesarPagos, generarCSV365, generarCSVAgr, descargarCSV, fechaHoy } from '../lib/pagos'
import { supabase } from '../lib/supabase'

const PASO = { MAESTRO: 1, COMISIONES: 2, RESULTADO: 3 }

export default function Generador() {
  const [paso, setPaso] = useState(PASO.MAESTRO)
  const [maestroData, setMaestroData] = useState(null)
  const [maestroNombre, setMaestroNombre] = useState('')
  const [rows365, setRows365] = useState([])
  const [rowsAgr, setRowsAgr] = useState([])
  const [rowsWarn, setRowsWarn] = useState([])
  const [descripcion, setDescripcion] = useState('Pago de comision ventas')
  const [tabActiva, setTabActiva] = useState('365')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const ref1 = useRef(), ref2 = useRef()

  function handleMaestro(e) {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => {
      const data = parseMaestro(ev.target.result)
      setMaestroData(data)
      setMaestroNombre(f.name)
      setPaso(PASO.COMISIONES)
    }
    r.readAsArrayBuffer(f)
  }

  function handleComisiones(e) {
    const f = e.target.files[0]; if (!f) return
    if (!maestroData) return
    const r = new FileReader()
    r.onload = ev => {
      const pagos = parseComisiones(ev.target.result)
      const { rows365, rowsAgr, rowsWarn } = procesarPagos(pagos, maestroData.maestro, maestroData.maestroSS, descripcion)
      setRows365(rows365)
      setRowsAgr(rowsAgr)
      setRowsWarn(rowsWarn)
      setGuardado(false)
      setPaso(PASO.RESULTADO)
    }
    r.readAsArrayBuffer(f)
  }

  async function guardarHistorial() {
    setGuardando(true)
    const tot365 = rows365.reduce((s, r) => s + r.monto, 0)
    const totAgr = rowsAgr.reduce((s, r) => s + r.monto, 0)
    await supabase.from('historial_pagos').insert([{
      descripcion,
      registros_365: rows365.length,
      total_365: tot365,
      registros_agr: rowsAgr.length,
      total_agr: totAgr,
      alertas: rowsWarn.length
    }])
    setGuardando(false)
    setGuardado(true)
  }

  function reiniciar() {
    setPaso(PASO.MAESTRO)
    setMaestroData(null)
    setMaestroNombre('')
    setRows365([]); setRowsAgr([]); setRowsWarn([])
    setGuardado(false)
    setTabActiva('365')
    if (ref1.current) ref1.current.value = ''
    if (ref2.current) ref2.current.value = ''
  }

  const tot365 = rows365.reduce((s, r) => s + r.monto, 0)
  const totAgr = rowsAgr.reduce((s, r) => s + r.monto, 0)

  return (
    <div>
      {/* Steps */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { n: 1, label: 'Maestro de vendedores' },
          { n: 2, label: 'Comisiones semanales' },
          { n: 3, label: 'Revisar y descargar' }
        ].map(s => (
          <div key={s.n} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
            borderRadius: 20, fontSize: 13, border: '1.5px solid',
            borderColor: paso === s.n ? '#2563eb' : paso > s.n ? '#16a34a' : '#e2e8f0',
            background: paso === s.n ? '#eff6ff' : paso > s.n ? '#f0fdf4' : '#f8fafc',
            color: paso === s.n ? '#2563eb' : paso > s.n ? '#16a34a' : '#94a3b8',
            fontWeight: paso === s.n ? 600 : 400
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 11, fontWeight: 700,
              background: paso === s.n ? '#2563eb' : paso > s.n ? '#16a34a' : '#cbd5e1',
              color: '#fff', flexShrink: 0
            }}>{paso > s.n ? '✓' : s.n}</span>
            {s.label}
          </div>
        ))}
      </div>

      {/* Paso 1: Maestro */}
      <UploadZone
        visible={paso === PASO.MAESTRO}
        icon="📋"
        titulo="Maestro de vendedores"
        subtitulo="LISTA_DE_VENDEDORES_CUENTA_BANCARIA.xlsx"
        onChange={handleMaestro}
        inputRef={ref1}
      />

      {/* Paso 2: Comisiones */}
      {paso >= PASO.COMISIONES && (
        <div style={{ marginTop: 12 }}>
          {paso === PASO.COMISIONES && (
            <div style={{
              background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12,
              padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#16a34a',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              ✅ <strong>{maestroNombre}</strong> cargado correctamente
            </div>
          )}
          <UploadZone
            visible={paso === PASO.COMISIONES}
            icon="📊"
            titulo="Comisiones semanales"
            subtitulo="salesmen_commission_YYYY_MM_DD.xlsx · Hoja2, columnas A-B-C"
            onChange={handleComisiones}
            inputRef={ref2}
          />
        </div>
      )}

      {/* Paso 3: Resultados */}
      {paso === PASO.RESULTADO && (
        <div style={{ marginTop: 8 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Total a pagar', val: `$${(tot365 + totAgr).toFixed(2)}`, color: '#0f172a' },
              { label: 'Procesados', val: rows365.length + rowsAgr.length, color: '#16a34a' },
              { label: 'Agrícola 365', val: `${rows365.length} · $${tot365.toFixed(2)}`, color: '#2563eb' },
              { label: 'Agrícola directo', val: `${rowsAgr.length} · $${totAgr.toFixed(2)}`, color: '#0891b2' },
            ].map(c => (
              <div key={c.label} style={{
                background: '#f8fafc', borderRadius: 10, padding: '12px 14px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: c.color }}>{c.val}</div>
              </div>
            ))}
          </div>

          {/* Descripción */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>Descripción del pago:</label>
            <input
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              style={{
                flex: 1, minWidth: 240, maxWidth: 420, padding: '8px 12px',
                borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13,
                outline: 'none', color: '#0f172a'
              }}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #f1f5f9', marginBottom: 16 }}>
            {[
              { id: '365', label: `Agrícola 365 (${rows365.length})` },
              { id: 'agr', label: `Agrícola directo (${rowsAgr.length})` },
              { id: 'warn', label: `Alertas (${rowsWarn.length})`, warn: rowsWarn.length > 0 },
            ].map(t => (
              <button key={t.id} onClick={() => setTabActiva(t.id)} style={{
                padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: tabActiva === t.id ? 600 : 400,
                color: tabActiva === t.id ? '#2563eb' : t.warn ? '#dc2626' : '#64748b',
                borderBottom: tabActiva === t.id ? '2px solid #2563eb' : '2px solid transparent',
                marginBottom: -2
              }}>{t.label}</button>
            ))}
          </div>

          {/* Tabla 365 */}
          {tabActiva === '365' && <TablaResultados rows={rows365} tipo="365" />}
          {tabActiva === 'agr' && <TablaResultados rows={rowsAgr} tipo="agr" />}
          {tabActiva === 'warn' && <TablaAlertas rows={rowsWarn} />}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <BtnPrimary onClick={() => descargarCSV(generarCSV365(rows365, descripcion), `agricola365_pago_${fechaHoy()}.csv`)} disabled={!rows365.length}>
              ⬇️ Descargar Agrícola 365
            </BtnPrimary>
            <BtnPrimary onClick={() => descargarCSV(generarCSVAgr(rowsAgr, descripcion), `agricola_pago_${fechaHoy()}.csv`)} disabled={!rowsAgr.length}>
              ⬇️ Descargar Agrícola directo
            </BtnPrimary>
            <BtnSecondary onClick={guardarHistorial} disabled={guardando || guardado}>
              {guardado ? '✅ Guardado en historial' : guardando ? 'Guardando...' : '💾 Guardar en historial'}
            </BtnSecondary>
            <BtnSecondary onClick={reiniciar}>🔄 Nuevo proceso</BtnSecondary>
          </div>
        </div>
      )}
    </div>
  )
}

function UploadZone({ visible, icon, titulo, subtitulo, onChange, inputRef }) {
  const [drag, setDrag] = useState(false)
  if (!visible) return null
  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => {
        e.preventDefault(); setDrag(false)
        const f = e.dataTransfer.files[0]; if (!f) return
        const dt = new DataTransfer(); dt.items.add(f)
        inputRef.current.files = dt.files
        onChange({ target: { files: dt.files } })
      }}
      style={{
        border: `2px dashed ${drag ? '#2563eb' : '#cbd5e1'}`,
        borderRadius: 12, padding: '2rem', textAlign: 'center',
        cursor: 'pointer', background: drag ? '#eff6ff' : '#f8fafc',
        transition: 'all .2s'
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: '0 0 4px' }}>{titulo}</p>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{subtitulo}</p>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={onChange} style={{ display: 'none' }} />
    </div>
  )
}

function TablaResultados({ rows, tipo }) {
  const total = rows.reduce((s, r) => s + r.monto, 0)
  if (!rows.length) return <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Sin registros</div>
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={th}>#</th>
            <th style={th}>Cuenta</th>
            {tipo === '365' && <><th style={th}>Banco</th><th style={th}>Tipo</th></>}
            <th style={th}>Nombre</th>
            <th style={{ ...th, textAlign: 'right' }}>Monto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={td}>{i + 1}</td>
              <td style={{ ...td, fontFamily: 'monospace', color: '#64748b' }}>{r.cuenta}</td>
              {tipo === '365' && (
                <>
                  <td style={td}><Pill color="#2563eb">{r.codBanco}</Pill></td>
                  <td style={td}><Pill color={r.tipoCuenta === 'A' ? '#16a34a' : '#0891b2'}>{r.tipoCuenta === 'A' ? 'Ahorro' : 'Cte'}</Pill></td>
                </>
              )}
              <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.nombre}>{r.nombre}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>${r.monto.toFixed(2)}</td>
            </tr>
          ))}
          <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
            <td colSpan={tipo === '365' ? 5 : 3} style={{ ...td, textAlign: 'right', color: '#64748b' }}>Total</td>
            <td style={{ ...td, textAlign: 'right' }}>${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function TablaAlertas({ rows }) {
  if (!rows.length) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#16a34a' }}>
      ✅ Sin alertas — todos los vendedores fueron encontrados
    </div>
  )
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#fef2f2' }}>
            <th style={th}>Nombre</th>
            <th style={{ ...th, textAlign: 'right' }}>Monto</th>
            <th style={th}>Motivo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={td}>{r.nombre}</td>
              <td style={{ ...td, textAlign: 'right' }}>${(r.monto || 0).toFixed(2)}</td>
              <td style={td}><Pill color="#dc2626">{r.motivo}</Pill></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const th = { padding: '9px 10px', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }
const td = { padding: '7px 10px', color: '#374151' }

function Pill({ color, children }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
      background: color + '18', color
    }}>{children}</span>
  )
}

function BtnPrimary({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '9px 18px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      background: disabled ? '#cbd5e1' : 'linear-gradient(135deg, #1e3a5f, #2563eb)',
      color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
    }}>{children}</button>
  )
}

function BtnSecondary({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '9px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0',
      background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6
    }}>{children}</button>
  )
}
