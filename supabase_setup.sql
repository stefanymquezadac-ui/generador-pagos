import * as XLSX from 'xlsx'

export const BANK_CODE = {
  'BANCO CUSCATLAN': 9,
  'BANCO ATLANTIDA': 29,
  'BANCO AMERICA CENTRAL': 25,
  'BANCO PROMERICA': 18,
  'BANCO AZUL': 35,
  'FEDECREDITO': 34,
  'BANCO HIPOTECARIO': 20,
  'DAVIVIENDA': 5,
  'BANCO AGRICOLA': 'AGRICOLA',
}

export function norm(s) {
  return (s || '').toString().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim()
}

export function ss(s) {
  return norm(s).replace(/\s/g, '')
}

export function parseMaestro(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
  const maestro = {}
  const maestroSS = {}
  data.forEach(row => {
    const nombre = norm(row['VENDEDOR'] || '')
    if (!nombre) return
    const banco = norm(row['BANCO'] || '')
    const cuenta = (row['CUENTA BANCARIA'] || '').toString().trim()
    const tipo = (row['T-CUENTA'] || '').toString().trim()
    const correo = (row['CORREO'] || '').toString().trim()
    const entry = { banco, cuenta, tipo, correo }
    if (!maestro[nombre] || cuenta) maestro[nombre] = entry
    const k = ss(nombre)
    if (!maestroSS[k] || cuenta) maestroSS[k] = entry
  })
  return { maestro, maestroSS }
}

export function parseComisiones(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = wb.SheetNames.find(n => n === 'Hoja2') || wb.SheetNames[1] || wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  const pagos = []
  raw.forEach((row, i) => {
    if (i === 0) return
    const nombre = (row[1] || '').toString().trim()
    const monto = parseFloat(row[2])
    if (!nombre || isNaN(monto) || monto <= 0) return
    if (norm(nombre).startsWith('TOTAL')) return
    pagos.push({ nombre, monto })
  })
  return pagos
}

export function buscarInfo(nombre, maestro, maestroSS) {
  const n = norm(nombre)
  if (maestro[n]) return maestro[n]
  const k = ss(nombre)
  if (maestroSS[k]) return maestroSS[k]
  const nL = n.replace(/\s*-\s*(CLARO|TIGO|DIGICEL|MOVISTAR).*/,'').trim()
  if (maestro[nL]) return maestro[nL]
  const kL = nL.replace(/\s/g, '')
  if (maestroSS[kL]) return maestroSS[kL]
  return null
}

export function procesarPagos(pagos, maestro, maestroSS, descripcion) {
  const rows365 = [], rowsAgr = [], rowsWarn = []
  pagos.forEach(p => {
    const info = buscarInfo(p.nombre, maestro, maestroSS)
    if (!info) {
      rowsWarn.push({ ...p, motivo: 'No encontrado en maestro' })
      return
    }
    if (!info.cuenta || info.cuenta === '' || info.cuenta === 'None' || info.cuenta === '0') {
      rowsWarn.push({ ...p, banco: info.banco, motivo: 'Sin número de cuenta' })
      return
    }
    const cod = BANK_CODE[info.banco]
    if (cod === undefined) {
      rowsWarn.push({ ...p, banco: info.banco, motivo: 'Banco no configurado: ' + info.banco })
      return
    }
    const tipoCta = info.tipo === 'Corriente' ? 'C' : 'A'
    const correo = info.correo || ''
    if (cod === 'AGRICOLA') {
      rowsAgr.push({ cuenta: info.cuenta, nombre: p.nombre, monto: p.monto, correo, descripcion })
    } else {
      rows365.push({ cuenta: info.cuenta, codBanco: cod, tipoCuenta: tipoCta, nombre: p.nombre, flag: 'N', monto: p.monto, correo, descripcion })
    }
  })
  return { rows365, rowsAgr, rowsWarn }
}

export function generarCSV365(rows, descripcion) {
  return rows.map(r =>
    [r.cuenta, r.codBanco, r.tipoCuenta, r.nombre, r.flag, r.monto.toFixed(2), r.correo, descripcion].join(',')
  ).join('\n')
}

export function generarCSVAgr(rows, descripcion) {
  return rows.map(r =>
    [r.cuenta, r.nombre, '', r.monto.toFixed(2), '', descripcion, r.correo].join(',')
  ).join('\n')
}

export function descargarCSV(contenido, nombre) {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function fechaHoy() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}
