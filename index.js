<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Generador de Pagos — Banco Agrícola</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;min-height:100vh}
  .header{background:linear-gradient(135deg,#0f172a,#1e3a5f);padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:60px;position:sticky;top:0;z-index:100}
  .header-left{display:flex;align-items:center;gap:12px}
  .header-icon{font-size:22px}
  .header-title{color:#fff;font-weight:700;font-size:15px}
  .header-sub{color:#93c5fd;font-size:11px}
  .header-right{display:flex;align-items:center;gap:8px}
  .nav-tabs{display:flex;background:rgba(255,255,255,.1);border-radius:8px;padding:3px;gap:3px}
  .nav-tab{padding:6px 14px;border-radius:6px;border:none;cursor:pointer;font-size:12px;background:transparent;color:#93c5fd;font-weight:400}
  .nav-tab.active{background:#fff;color:#1e3a5f;font-weight:600}
  .avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#0891b2);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700}
  .btn-signout{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#cbd5e1;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer}
  .main{max-width:1100px;margin:0 auto;padding:24px 20px}
  .card{background:#fff;border-radius:14px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.04)}
  .card-title{font-size:18px;font-weight:700;color:#0f172a;margin-bottom:4px}
  .card-sub{font-size:13px;color:#64748b;margin-bottom:24px}
  .login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a,#1e3a5f)}
  .login-card{background:#fff;border-radius:16px;padding:2.5rem 2rem;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
  .login-icon-wrap{width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#1e3a5f,#2563eb);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:24px}
  .login-title{font-size:20px;font-weight:700;color:#0f172a;text-align:center;margin-bottom:4px}
  .login-sub{font-size:13px;color:#64748b;text-align:center;margin-bottom:1.5rem}
  .form-label{font-size:13px;font-weight:500;color:#374151;display:block;margin-bottom:6px}
  .form-input{width:100%;padding:10px 12px;border-radius:8px;border:1.5px solid #e2e8f0;font-size:14px;outline:none;transition:border .2s}
  .form-input:focus{border-color:#2563eb}
  .form-group{margin-bottom:16px}
  .btn-login{width:100%;padding:11px;border-radius:8px;border:none;background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;font-size:14px;font-weight:600;cursor:pointer}
  .btn-login:disabled{background:#93c5fd;cursor:not-allowed}
  .alert-err{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 12px;font-size:13px;color:#dc2626;margin-bottom:16px}
  .steps{display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap}
  .step{display:flex;align-items:center;gap:8px;padding:7px 14px;border-radius:20px;font-size:13px;border:1.5px solid #e2e8f0;color:#94a3b8;background:#f8fafc}
  .step.active{border-color:#2563eb;background:#eff6ff;color:#2563eb;font-weight:600}
  .step.done{border-color:#16a34a;background:#f0fdf4;color:#16a34a}
  .step-num{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:#cbd5e1;color:#fff;flex-shrink:0}
  .step.active .step-num{background:#2563eb}
  .step.done .step-num{background:#16a34a}
  .upload-zone{border:2px dashed #cbd5e1;border-radius:12px;padding:2rem;text-align:center;cursor:pointer;background:#f8fafc;transition:all .2s;margin-bottom:12px}
  .upload-zone:hover,.upload-zone.drag{border-color:#2563eb;background:#eff6ff}
  .upload-zone.loaded{border-style:solid;border-color:#16a34a;background:#f0fdf4}
  .upload-icon{font-size:32px;margin-bottom:8px}
  .upload-title{font-size:14px;font-weight:500;color:#374151;margin-bottom:4px}
  .upload-sub{font-size:12px;color:#94a3b8}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
  .stat-card{background:#f8fafc;border-radius:10px;padding:12px 14px;border:1px solid #e2e8f0}
  .stat-label{font-size:11px;color:#94a3b8;margin-bottom:4px}
  .stat-val{font-size:18px;font-weight:700;color:#0f172a}
  .stat-sub{font-size:12px;color:#64748b;margin-top:2px}
  .desc-row{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap}
  .desc-label{font-size:13px;color:#64748b;white-space:nowrap}
  .desc-input{flex:1;min-width:240px;max-width:420px;padding:8px 12px;border-radius:8px;border:1.5px solid #e2e8f0;font-size:13px;outline:none}
  .desc-input:focus{border-color:#2563eb}
  .tabs{display:flex;gap:4px;border-bottom:2px solid #f1f5f9;margin-bottom:16px}
  .tab-btn{padding:8px 16px;border:none;background:none;cursor:pointer;font-size:13px;color:#64748b;border-bottom:2px solid transparent;margin-bottom:-2px}
  .tab-btn.active{color:#2563eb;font-weight:600;border-bottom-color:#2563eb}
  .tab-btn.warn{color:#dc2626}
  .tbl-wrap{overflow-x:auto;border:1px solid #e2e8f0;border-radius:10px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  thead th{padding:9px 10px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;background:#f8fafc;white-space:nowrap}
  tbody tr:hover{background:#f8fafc}
  tbody td{padding:7px 10px;color:#374151;border-bottom:1px solid #f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sum-row td{font-weight:700;background:#f8fafc!important;border-top:1px solid #e2e8f0}
  .mono{font-family:monospace;font-size:11px;color:#64748b}
  .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}
  .actions{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;align-items:center}
  .btn-primary{padding:9px 18px;border-radius:8px;border:none;cursor:pointer;background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;font-size:13px;font-weight:600}
  .btn-primary:disabled{background:#cbd5e1;cursor:not-allowed}
  .btn-secondary{padding:9px 16px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#374151;font-size:13px;font-weight:500;cursor:pointer}
  .btn-secondary:disabled{opacity:.5;cursor:not-allowed}
  .empty{text-align:center;padding:2.5rem;color:#94a3b8;font-size:13px}
  .hist-table thead th{background:#f8fafc}
  @media(max-width:600px){
    .stats-grid{grid-template-columns:repeat(2,1fr)}
    .header-right .nav-tabs{display:none}
  }
</style>
</head>
<body>
<div id="app"></div>
<script>
const SUPABASE_URL = 'https://imjmwnmjtluokjshxgub.supabase.co'
const SUPABASE_KEY = 'sb_publishable_V9o7KR_g68_smTXuLQS5Sw_qVoagqw0'
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

const BANK_CODE = {
  'BANCO CUSCATLAN':9,'BANCO ATLANTIDA':29,'BANCO AMERICA CENTRAL':25,
  'BANCO PROMERICA':18,'BANCO AZUL':35,'FEDECREDITO':34,
  'BANCO HIPOTECARIO':20,'DAVIVIENDA':5,'BANCO AGRICOLA':'AGRICOLA'
}

function norm(s){
  return (s||'').toString().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,' ').trim()
}
function ss(s){return norm(s).replace(/\s/g,'')}
function limpiarNombre(s){return (s||'').replace(/\s*\([^)]*\)/g,'').replace(/\s+/g,' ').trim()}

function parseMaestro(buf){
  const wb=XLSX.read(buf,{type:'array'})
  const ws=wb.Sheets[wb.SheetNames[0]]
  const data=XLSX.utils.sheet_to_json(ws,{defval:''})
  const m={},mss={}
  data.forEach(r=>{
    const n=norm(r['VENDEDOR']||''); if(!n)return
    const cuenta=(r['CUENTA BANCARIA']||'').toString().trim()
    const e={banco:norm(r['BANCO']||''),cuenta,tipo:(r['T-CUENTA']||'').toString().trim(),correo:(r['CORREO']||'').toString().trim()}
    if(!m[n]||cuenta)m[n]=e
    const k=ss(n); if(!mss[k]||cuenta)mss[k]=e
  })
  return{m,mss}
}

function parseComisiones(buf){
  const wb=XLSX.read(buf,{type:'array'})
  const sn=wb.SheetNames.find(n=>n==='Hoja2')||wb.SheetNames[1]||wb.SheetNames[0]
  const raw=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:''})
  const p=[]
  raw.forEach((r,i)=>{
    if(i===0)return
    const nombre=(r[1]||'').toString().trim()
    const monto=parseFloat(r[2])
    if(!nombre||isNaN(monto)||monto<=0)return
    if(norm(nombre).startsWith('TOTAL'))return
    p.push({nombre,monto})
  })
  return p
}

function buscar(nombre,m,mss){
  const n=norm(nombre); if(m[n])return m[n]
  const k=ss(nombre); if(mss[k])return mss[k]
  const nL=n.replace(/\s*-\s*(CLARO|TIGO|DIGICEL|MOVISTAR).*/,'').trim()
  if(m[nL])return m[nL]
  const kL=nL.replace(/\s/g,''); if(mss[kL])return mss[kL]
  return null
}

function procesar(pagos,m,mss){
  const r365=[],rAgr=[],warn=[]
  pagos.forEach(p=>{
    const info=buscar(p.nombre,m,mss)
    if(!info){warn.push({...p,motivo:'No encontrado en maestro'});return}
    if(!info.cuenta||info.cuenta===''||info.cuenta==='None'||info.cuenta==='0'){warn.push({...p,motivo:'Sin número de cuenta'});return}
    const cod=BANK_CODE[info.banco]
    if(cod===undefined){warn.push({...p,motivo:'Banco no configurado: '+info.banco});return}
    const tc=info.tipo==='Corriente'?'C':'A', co=info.correo||''
    const nombreLimpio=limpiarNombre(p.nombre)
    if(cod==='AGRICOLA')rAgr.push({cuenta:info.cuenta,nombre:nombreLimpio,monto:p.monto,correo:co})
    else r365.push({cuenta:info.cuenta,codBanco:cod,tipoCuenta:tc,nombre:nombreLimpio,flag:'N',monto:p.monto,correo:co})
  })
  return{r365,rAgr,warn}
}

function csv365(rows,desc){return rows.map(r=>[r.cuenta,r.codBanco,r.tipoCuenta,r.nombre,r.flag,r.monto.toFixed(2),r.correo,desc].join(',')).join('\n')}
function csvAgr(rows,desc){return rows.map(r=>[r.cuenta,r.nombre,'',r.monto.toFixed(2),'',desc,r.correo].join(',')).join('\n')}
function dlCSV(content,filename){
  const blob=new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8;'})
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}
function hoy(){return new Date().toISOString().slice(0,10).replace(/-/g,'')}
function badge(txt,color){return`<span class="badge" style="background:${color}20;color:${color}">${txt}</span>`}

let session=null, vista='generador', paso=1
let maestroData=null, maestroNombre='', rows365=[], rowsAgr=[], rowsWarn=[]
let tabActiva='365', guardado=false

async function init(){
  const{data:{session:s}}=await sb.auth.getSession()
  session=s
  sb.auth.onAuthStateChange((_,s2)=>{session=s2;render()})
  render()
}

async function login(email,password){
  const{error}=await sb.auth.signInWithPassword({email,password})
  if(error){document.getElementById('login-err').style.display='block';return}
}
async function signout(){await sb.auth.signOut();session=null;render()}

function render(){
  const app=document.getElementById('app')
  if(!session){app.innerHTML=renderLogin();bindLogin();return}
  app.innerHTML=renderApp();bindApp()
}

function renderLogin(){return`
<div class="login-wrap">
  <div class="login-card">
    <div class="login-icon-wrap">🏦</div>
    <div class="login-title">Generador de Pagos</div>
    <div class="login-sub">Generador de archivos de pago</div>
    <div class="alert-err" id="login-err" style="display:none">Correo o contraseña incorrectos</div>
    <div class="form-group">
      <label class="form-label">Correo electrónico</label>
      <input class="form-input" type="email" id="login-email" placeholder="tu@correo.com">
    </div>
    <div class="form-group">
      <label class="form-label">Contraseña</label>
      <input class="form-input" type="password" id="login-pass" placeholder="••••••••">
    </div>
    <button class="btn-login" id="login-btn">Ingresar</button>
  </div>
</div>`}

function bindLogin(){
  document.getElementById('login-btn').onclick=async()=>{
    const btn=document.getElementById('login-btn')
    btn.disabled=true; btn.textContent='Ingresando...'
    await login(document.getElementById('login-email').value,document.getElementById('login-pass').value)
    btn.disabled=false; btn.textContent='Ingresar'
  }
  document.getElementById('login-pass').onkeydown=e=>{if(e.key==='Enter')document.getElementById('login-btn').click()}
}

function renderApp(){
  const user=session.user
  const initial=(user.email||'U')[0].toUpperCase()
  return`
<div class="header">
  <div class="header-left">
    <span class="header-icon">🏦</span>
    <div>
      <div class="header-title">Generador de Pagos</div>
      <div class="header-sub">Banco Agrícola · Generador de pagos</div>
    </div>
  </div>
  <div class="header-right">
    <div class="nav-tabs">
      <button class="nav-tab ${vista==='generador'?'active':''}" onclick="setVista('generador')">⚡ Generar pagos</button>
      <button class="nav-tab ${vista==='historial'?'active':''}" onclick="setVista('historial')">📋 Historial</button>
    </div>
    <div class="avatar">${initial}</div>
    <button class="btn-signout" onclick="signout()">Salir</button>
  </div>
</div>
<div class="main">
  <div class="card">
    <div class="card-title">${vista==='generador'?'⚡ Generar archivos de pago':'📋 Historial de pagos'}</div>
    <div class="card-sub">${vista==='generador'?'Carga el maestro y el Excel semanal para generar los CSV listos para el banco.':'Registro de todos los pagos procesados.'}</div>
    <div id="vista-content">${vista==='generador'?renderGenerador():renderHistorialPlaceholder()}</div>
  </div>
</div>`
}

function setVista(v){vista=v;render();if(v==='historial')loadHistorial()}

function renderGenerador(){return`
  <div class="steps">
    <div class="step ${paso===1?'active':paso>1?'done':''}"><span class="step-num">${paso>1?'✓':'1'}</span>Maestro de vendedores</div>
    <div class="step ${paso===2?'active':paso>2?'done':''}"><span class="step-num">${paso>2?'✓':'2'}</span>Comisiones semanales</div>
    <div class="step ${paso===3?'active':''}"><span class="step-num">3</span>Revisar y descargar</div>
  </div>
  <div id="upload1">
    <div class="upload-zone ${maestroNombre?'loaded':''}" id="uz1" onclick="document.getElementById('f1').click()">
      <div class="upload-icon">${maestroNombre?'✅':'📋'}</div>
      <div class="upload-title">${maestroNombre||'Maestro de vendedores'}</div>
      <div class="upload-sub">${maestroNombre?'Cargado correctamente':'LISTA_DE_VENDEDORES_CUENTA_BANCARIA.xlsx'}</div>
      <input type="file" id="f1" accept=".xlsx,.xls" style="display:none" onchange="handleMaestro(this)">
    </div>
  </div>
  ${paso>=2?`
  <div id="upload2">
    <div class="upload-zone" id="uz2" onclick="document.getElementById('f2').click()">
      <div class="upload-icon">📊</div>
      <div class="upload-title">Comisiones semanales</div>
      <div class="upload-sub">salesmen_commission_YYYY_MM_DD.xlsx · Hoja2, columnas A-B-C</div>
      <input type="file" id="f2" accept=".xlsx,.xls" style="display:none" onchange="handleComisiones(this)">
    </div>
  </div>`:''}
  ${paso===3?renderResultados():''}
`}

function renderResultados(){
  const tot365=rows365.reduce((s,r)=>s+r.monto,0)
  const totAgr=rowsAgr.reduce((s,r)=>s+r.monto,0)
  return`
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">Total a pagar</div><div class="stat-val">$${(tot365+totAgr).toFixed(2)}</div></div>
    <div class="stat-card"><div class="stat-label">Procesados</div><div class="stat-val" style="color:#16a34a">${rows365.length+rowsAgr.length}</div></div>
    <div class="stat-card"><div class="stat-label">Agrícola 365</div><div class="stat-val">${rows365.length}</div><div class="stat-sub">$${tot365.toFixed(2)}</div></div>
    <div class="stat-card"><div class="stat-label">Agrícola directo</div><div class="stat-val">${rowsAgr.length}</div><div class="stat-sub">$${totAgr.toFixed(2)}</div></div>
  </div>
  <div class="desc-row" style="gap:12px;align-items:flex-end;flex-wrap:wrap">
    <div>
      <div class="desc-label" style="margin-bottom:5px">Fecha inicio</div>
      <input class="desc-input" type="date" id="fecha-ini" style="width:155px" onchange="actualizarDesc()">
    </div>
    <div>
      <div class="desc-label" style="margin-bottom:5px">Fecha fin</div>
      <input class="desc-input" type="date" id="fecha-fin" style="width:155px" onchange="actualizarDesc()">
    </div>
    <div style="flex:1;min-width:260px">
      <div class="desc-label" style="margin-bottom:5px">Concepto generado</div>
      <input class="desc-input" id="desc-inp" type="text" value="Pago de comisión ventas" style="background:#f8fafc" readonly>
    </div>
  </div>
  <div class="tabs">
    <button class="tab-btn ${tabActiva==='365'?'active':''}" onclick="setTab('365')">Agrícola 365 (${rows365.length})</button>
    <button class="tab-btn ${tabActiva==='agr'?'active':''}" onclick="setTab('agr')">Agrícola directo (${rowsAgr.length})</button>
    <button class="tab-btn ${tabActiva==='warn'?'active':''}${rowsWarn.length>0?' warn':''}" onclick="setTab('warn')">Alertas (${rowsWarn.length})</button>
  </div>
  <div id="tab-content">${renderTabContent()}</div>
  <div class="actions">
    <button class="btn-primary" ${!rows365.length?'disabled':''} onclick="dl365()">⬇️ Descargar Agrícola 365</button>
    <button class="btn-primary" ${!rowsAgr.length?'disabled':''} onclick="dlAgr()">⬇️ Descargar Agrícola directo</button>
    <button class="btn-secondary" id="btn-guardar" onclick="guardar()">${guardado?'✅ Guardado en historial':'💾 Guardar en historial'}</button>
    <button class="btn-secondary" onclick="reiniciar()">🔄 Nuevo proceso</button>
  </div>`
}
function renderTabContent(){
  if(tabActiva==='365'){
    if(!rows365.length)return'<div class="empty">Sin registros para Agrícola 365</div>'
    const tot=rows365.reduce((s,r)=>s+r.monto,0)
    return`<div class="tbl-wrap"><table>
      <thead><tr><th style="width:30px">#</th><th>Cuenta</th><th>Banco</th><th>Tipo</th><th>Nombre</th><th style="text-align:right">Monto</th></tr></thead>
      <tbody>${rows365.map((r,i)=>`<tr><td style="color:#94a3b8">${i+1}</td><td class="mono">${r.cuenta}</td><td>${badge(r.codBanco,'#2563eb')}</td><td>${badge(r.tipoCuenta==='A'?'Ahorro':'Cte',r.tipoCuenta==='A'?'#16a34a':'#0891b2')}</td><td title="${r.nombre}">${r.nombre}</td><td style="text-align:right;font-weight:600">$${r.monto.toFixed(2)}</td></tr>`).join('')}
      <tr class="sum-row"><td colspan="5" style="text-align:right;padding:8px;color:#64748b">Total</td><td style="text-align:right;padding:8px">$${tot.toFixed(2)}</td></tr></tbody>
    </table></div>`
  }
  if(tabActiva==='agr'){
    if(!rowsAgr.length)return'<div class="empty">Sin registros para Agrícola directo</div>'
    const tot=rowsAgr.reduce((s,r)=>s+r.monto,0)
    return`<div class="tbl-wrap"><table>
      <thead><tr><th style="width:30px">#</th><th>Cuenta</th><th>Nombre</th><th style="text-align:right">Monto</th></tr></thead>
      <tbody>${rowsAgr.map((r,i)=>`<tr><td style="color:#94a3b8">${i+1}</td><td class="mono">${r.cuenta}</td><td title="${r.nombre}">${r.nombre}</td><td style="text-align:right;font-weight:600">$${r.monto.toFixed(2)}</td></tr>`).join('')}
      <tr class="sum-row"><td colspan="3" style="text-align:right;padding:8px;color:#64748b">Total</td><td style="text-align:right;padding:8px">$${tot.toFixed(2)}</td></tr></tbody>
    </table></div>`
  }
  if(tabActiva==='warn'){
    if(!rowsWarn.length)return'<div class="empty" style="color:#16a34a">✅ Sin alertas — todos los vendedores encontrados</div>'
    return`<div class="tbl-wrap"><table>
      <thead><tr><th>Nombre</th><th style="text-align:right">Monto</th><th>Motivo</th></tr></thead>
      <tbody>${rowsWarn.map(r=>`<tr><td>${r.nombre}</td><td style="text-align:right">$${(r.monto||0).toFixed(2)}</td><td>${badge(r.motivo,'#dc2626')}</td></tr>`).join('')}</tbody>
    </table></div>`
  }
}

function setTab(t){tabActiva=t;const tc=document.getElementById('tab-content');if(tc)tc.innerHTML=renderTabContent();document.querySelectorAll('.tab-btn').forEach((b,i)=>{b.classList.toggle('active',['365','agr','warn'][i]===t)})}

function handleMaestro(input){
  const f=input.files[0];if(!f)return
  const r=new FileReader()
  r.onload=e=>{maestroData=parseMaestro(e.target.result);maestroNombre=f.name;paso=2;renderVista()}
  r.readAsArrayBuffer(f)
}

function handleComisiones(input){
  const f=input.files[0];if(!f)return
  const r=new FileReader()
  r.onload=e=>{
    const pagos=parseComisiones(e.target.result)
    const res=procesar(pagos,maestroData.m,maestroData.mss)
    rows365=res.r365;rowsAgr=res.rAgr;rowsWarn=res.warn
    guardado=false;paso=3;renderVista()
  }
  r.readAsArrayBuffer(f)
}

function renderVista(){const vc=document.getElementById('vista-content');if(vc)vc.innerHTML=renderGenerador();bindApp()}
function bindApp(){
  const f1=document.getElementById('f1');if(f1)bindDrag('uz1',f1,handleMaestro)
  const f2=document.getElementById('f2');if(f2)bindDrag('uz2',f2,handleComisiones)
}
function bindDrag(zoneId,input,handler){
  const z=document.getElementById(zoneId);if(!z)return
  z.addEventListener('dragover',e=>{e.preventDefault();z.classList.add('drag')})
  z.addEventListener('dragleave',()=>z.classList.remove('drag'))
  z.addEventListener('drop',e=>{e.preventDefault();z.classList.remove('drag');const f=e.dataTransfer.files[0];if(!f)return;const dt=new DataTransfer();dt.items.add(f);input.files=dt.files;handler(input)})
}

function fmtFecha(dateStr){
  if(!dateStr)return''
  const[y,m,d]=dateStr.split('-')
  return y+'-'+m+'-'+d
}
function actualizarDesc(){
  const ini=document.getElementById('fecha-ini')
  const fin=document.getElementById('fecha-fin')
  const desc=document.getElementById('desc-inp')
  if(!ini||!fin||!desc)return
  if(ini.value&&fin.value){
    desc.value='Pago de comisión ventas del '+fmtFecha(ini.value)+' al '+fmtFecha(fin.value)
  } else if(ini.value){
    desc.value='Pago de comisión ventas del '+fmtFecha(ini.value)
  } else {
    desc.value='Pago de comisión ventas'
  }
}
function getDesc(){const d=document.getElementById('desc-inp');return d?d.value:'Pago de comisión ventas'}
function dl365(){dlCSV(csv365(rows365,getDesc()),`agricola365_pago_${hoy()}.csv`)}
function dlAgr(){dlCSV(csvAgr(rowsAgr,getDesc()),`agricola_pago_${hoy()}.csv`)}

async function guardar(){
  const btn=document.getElementById('btn-guardar')
  if(btn)btn.textContent='Guardando...'
  const tot365=rows365.reduce((s,r)=>s+r.monto,0)
  const totAgr=rowsAgr.reduce((s,r)=>s+r.monto,0)
  const detalle={
    r365:rows365.map(r=>({nombre:r.nombre,cuenta:r.cuenta,banco:r.codBanco,tipo:r.tipoCuenta,monto:r.monto})),
    rAgr:rowsAgr.map(r=>({nombre:r.nombre,cuenta:r.cuenta,monto:r.monto})),
    warn:rowsWarn.map(r=>({nombre:r.nombre,monto:r.monto,motivo:r.motivo}))
  }
  await sb.from('historial_pagos').insert([{
    descripcion:getDesc(),
    registros_365:rows365.length,total_365:tot365,
    registros_agr:rowsAgr.length,total_agr:totAgr,
    alertas:rowsWarn.length,
    detalle:JSON.stringify(detalle)
  }])
  guardado=true
  if(btn){btn.textContent='✅ Guardado en historial';btn.disabled=true}
}

function reiniciar(){maestroData=null;maestroNombre='';rows365=[];rowsAgr=[];rowsWarn=[];paso=1;guardado=false;tabActiva='365';renderVista()}
function renderHistorialPlaceholder(){return'<div class="empty">⏳ Cargando historial...</div>'}

let historialData=[]

async function loadHistorial(){
  const{data}=await sb.from('historial_pagos').select('*').order('created_at',{ascending:false}).limit(30)
  const vc=document.getElementById('vista-content')
  if(!vc)return
  historialData=data||[]
  renderHistorial()
}

function renderHistorial(){
  const vc=document.getElementById('vista-content')
  if(!vc)return
  if(!historialData.length){vc.innerHTML='<div class="empty">📂 Aún no hay pagos procesados</div>';return}
  vc.innerHTML=`
  <div class="tbl-wrap"><table class="hist-table">
    <thead><tr><th>Fecha</th><th>Descripción</th><th>Agrícola 365</th><th>Agrícola directo</th><th>Total</th><th>Alertas</th><th style="text-align:center">Acciones</th></tr></thead>
    <tbody>${historialData.map((r,i)=>`
      <tr>
        <td style="white-space:nowrap">${new Date(r.created_at).toLocaleDateString('es-SV',{day:'2-digit',month:'short',year:'numeric'})}</td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.descripcion}">${r.descripcion}</td>
        <td>${badge(r.registros_365+' reg · $'+Number(r.total_365).toFixed(2),'#2563eb')}</td>
        <td>${badge(r.registros_agr+' reg · $'+Number(r.total_agr).toFixed(2),'#0891b2')}</td>
        <td style="font-weight:700">$${(Number(r.total_365)+Number(r.total_agr)).toFixed(2)}</td>
        <td>${r.alertas>0?badge(r.alertas+' alertas','#dc2626'):badge('Sin alertas','#16a34a')}</td>
        <td style="text-align:center;white-space:nowrap">
          <button onclick="verDetalle(${i})" style="padding:4px 10px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;font-size:11px;cursor:pointer;margin-right:4px">👁 Ver</button>
          <button onclick="eliminarRegistro('${r.id}')" style="padding:4px 10px;border-radius:6px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;font-size:11px;cursor:pointer">🗑 Borrar</button>
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>
  <div id="detalle-modal" style="display:none;margin-top:20px"></div>`
}

function verDetalle(i){
  const r=historialData[i]
  const modal=document.getElementById('detalle-modal')
  if(!modal)return
  let det={r365:[],rAgr:[],warn:[]}
  try{det=JSON.parse(r.detalle||'{}')}catch(e){}
  let html=`<div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;background:#f8fafc">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div>
        <div style="font-weight:700;font-size:15px;color:#0f172a">Detalle del pago</div>
        <div style="font-size:12px;color:#64748b">${r.descripcion}</div>
      </div>
      <button onclick="document.getElementById('detalle-modal').style.display='none'" style="padding:5px 12px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px">✕ Cerrar</button>
    </div>`
  if(det.r365&&det.r365.length){
    html+=`<div style="margin-bottom:16px">
      <div style="font-weight:600;font-size:13px;color:#2563eb;margin-bottom:8px">Agrícola 365 (${det.r365.length} registros)</div>
      <div class="tbl-wrap"><table><thead><tr><th>#</th><th>Nombre</th><th>Cuenta</th><th>Banco</th><th>Tipo</th><th style="text-align:right">Monto</th></tr></thead>
      <tbody>${det.r365.map((v,j)=>`<tr><td style="color:#94a3b8">${j+1}</td><td>${v.nombre}</td><td class="mono">${v.cuenta}</td><td>${badge(v.banco,'#2563eb')}</td><td>${badge(v.tipo==='A'?'Ahorro':'Cte',v.tipo==='A'?'#16a34a':'#0891b2')}</td><td style="text-align:right;font-weight:600">$${Number(v.monto).toFixed(2)}</td></tr>`).join('')}
      <tr class="sum-row"><td colspan="5" style="text-align:right;padding:8px;color:#64748b">Total</td><td style="text-align:right;padding:8px">$${det.r365.reduce((s,v)=>s+Number(v.monto),0).toFixed(2)}</td></tr>
      </tbody></table></div></div>`
  }
  if(det.rAgr&&det.rAgr.length){
    html+=`<div style="margin-bottom:16px">
      <div style="font-weight:600;font-size:13px;color:#0891b2;margin-bottom:8px">Agrícola directo (${det.rAgr.length} registros)</div>
      <div class="tbl-wrap"><table><thead><tr><th>#</th><th>Nombre</th><th>Cuenta</th><th style="text-align:right">Monto</th></tr></thead>
      <tbody>${det.rAgr.map((v,j)=>`<tr><td style="color:#94a3b8">${j+1}</td><td>${v.nombre}</td><td class="mono">${v.cuenta}</td><td style="text-align:right;font-weight:600">$${Number(v.monto).toFixed(2)}</td></tr>`).join('')}
      <tr class="sum-row"><td colspan="3" style="text-align:right;padding:8px;color:#64748b">Total</td><td style="text-align:right;padding:8px">$${det.rAgr.reduce((s,v)=>s+Number(v.monto),0).toFixed(2)}</td></tr>
      </tbody></table></div></div>`
  }
  if(det.warn&&det.warn.length){
    html+=`<div>
      <div style="font-weight:600;font-size:13px;color:#dc2626;margin-bottom:8px">Alertas (${det.warn.length})</div>
      <div class="tbl-wrap"><table><thead><tr><th>Nombre</th><th style="text-align:right">Monto</th><th>Motivo</th></tr></thead>
      <tbody>${det.warn.map(v=>`<tr><td>${v.nombre}</td><td style="text-align:right">$${Number(v.monto||0).toFixed(2)}</td><td>${badge(v.motivo,'#dc2626')}</td></tr>`).join('')}
      </tbody></table></div></div>`
  }
  if(!det.r365?.length&&!det.rAgr?.length){
    html+=`<div style="text-align:center;padding:2rem;color:#94a3b8;font-size:13px">Este registro fue guardado antes de que se habilitara el detalle por vendedor.</div>`
  }
  html+=`</div>`
  modal.innerHTML=html
  modal.style.display='block'
  modal.scrollIntoView({behavior:'smooth',block:'start'})
}

async function eliminarRegistro(id){
  if(!confirm('¿Seguro que deseas eliminar este registro del historial?'))return
  await sb.from('historial_pagos').delete().eq('id',id)
  historialData=historialData.filter(r=>r.id!==id)
  renderHistorial()
}

init()
</script>
</body>
</html>
