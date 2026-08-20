import './styles.css';
import {api} from './services/api.js';
import {evaluarConIA} from './services/ai.js';
import {compararCumplimiento} from './services/compliance.js';

const $=id=>document.getElementById(id); let zona=null; let solicitudes=[]; let empresas=[]; let historial=[];
function setStatus(text,kind=''){const el=$('globalStatus');el.textContent=text;el.className='status-pill '+kind;}
function message(id,text,kind=''){const el=$(id);el.textContent=text;el.style.color=kind==='error'?'#a33333':kind==='ok'?'#1e6a4b':'';}
function normalizeStatusLabel(value=''){const raw=String(value ?? '').trim();if(!raw)return 'Pendiente';const normalized=raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]+/g,'');const aliases={pendiente:'Pendiente',recomendada:'Recomendada',aprobada:'Aprobada',rechazada:'Rechazada',revisar:'Revisar',enrevision:'Revisar',revision:'Revisar'};return aliases[normalized] ?? raw;}
function resolveSolicitudStatus(s){const decision=normalizeStatusLabel(s?.decisionHumana);const classification=normalizeStatusLabel(s?.clasificacionIA);if(decision && decision !== 'Pendiente') return decision;if(classification && classification !== 'Pendiente') return classification;return 'Pendiente';}
function badgeClass(value='Pendiente'){return String(normalizeStatusLabel(value)).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]+/g,'');}

async function loadBase(){setStatus('Cargando');try{[zona,solicitudes,empresas,historial]=await Promise.all([api.getZona(),api.getSolicitudes(),api.getEmpresas(),api.getHistorial()]);renderZona();renderDashboard();renderEmpresas();renderEmpresasList();}catch(error){console.error(error);setStatus('Error');message('solicitudMessage','No se pudieron cargar los datos. Inicia json-server.','error');}finally{if(zona)setStatus('Listo');}}
function renderZona(){ $('zonaNombre').textContent=zona.nombre; $('criteriosZona').innerHTML=`<p><strong>Inversión mínima:</strong> ₡${Number(zona.inversionMinima).toLocaleString()}</p><p><strong>Empleos mínimos:</strong> ${zona.empleosMinimos}</p><p><strong>Sectores:</strong> ${zona.sectoresPermitidos.join(', ')}</p>`;}
function metrics(list){const total=list.length, aprobadas=list.filter(x=>normalizeStatusLabel(x.decisionHumana)==='Aprobada').length, rechazadas=list.filter(x=>normalizeStatusLabel(x.decisionHumana)==='Rechazada').length, revisiones=list.filter(x=>normalizeStatusLabel(x.decisionHumana)==='Revisar').length, evaluadas=list.filter(x=>Number.isFinite(x.puntajeIA));const avg=evaluadas.length?Math.round(evaluadas.reduce((a,b)=>a+b.puntajeIA,0)/evaluadas.length):0;return[{n:total,t:'Solicitudes'},{n:aprobadas,t:'Aprobadas'},{n:rechazadas,t:'Rechazadas'},{n:revisiones,t:'En revisión'}];}
function renderDashboard(){const estado=$('filterEstado').value, sector=$('filterSector').value;let list=solicitudes.filter(s=>{const matchesSector=!sector||s.sector===sector;const matchesEstado=!estado||normalizeStatusLabel(resolveSolicitudStatus(s))===normalizeStatusLabel(estado);return matchesSector&&matchesEstado;});$('metricas').innerHTML=metrics(solicitudes).map(m=>`<div class="metric"><strong>${m.n}</strong><span>${m.t}</span></div>`).join('');$('solicitudesList').innerHTML=list.length?list.map(s=>{const status=resolveSolicitudStatus(s);return `<article class="card"><div class="card-head"><div><p class="eyebrow">${s.sector}</p><h3>${s.empresa}</h3></div><span class="badge ${badgeClass(status)}">${status}</span></div><p>Inversión: ₡${Number(s.inversionProyectada).toLocaleString()} · Empleos: ${s.empleosProyectados}</p><p>Decisión humana: <strong>${s.decisionHumana || 'Pendiente'}</strong></p><div class="card-actions"><button data-detail="${s.id}">Ver detalle</button>${status==='Pendiente'?`<button data-evaluate="${s.id}">Evaluar IA</button>`:''}</div></article>`;}).join(''):'<div class="empty">No hay solicitudes para estos filtros.</div>';} 
function renderEmpresas(){
  const sel=$('empresaInstalada');
  sel.innerHTML='<option value="">Seleccionar empresa</option>'+empresas.map(e=>`<option value="${e.id}">${e.empresa}</option>`).join('');
  renderCompromisos();
}
function renderEmpresasList(){
  const empresasMap=new Map(empresas.map(e=>[String(e.solicitudId ?? e.id), e]));
  const items=solicitudes.map(s=>{
    const empresaInstalada=empresasMap.get(String(s.id));
    return {
      id: s.id,
      empresa: s.empresa,
      sector: s.sector,
      inversion: Number(s.inversionProyectada || 0),
      empleos: Number(s.empleosProyectados || 0),
      estado: resolveSolicitudStatus(s),
      compromiso: empresaInstalada ? Number(empresaInstalada.inversionComprometida || 0) : null,
      empleosComprometidos: empresaInstalada ? Number(empresaInstalada.empleosComprometidos || 0) : null
    };
  });

  $('empresasList').innerHTML = items.length ? items.map(item => `
    <article class="card">
      <div class="card-head">
        <div>
          <p class="eyebrow">${item.sector}</p>
          <h3>${item.empresa}</h3>
        </div>
        <span class="badge ${badgeClass(item.estado)}">${item.estado}</span>
      </div>
      <p><strong>Inversión:</strong> ₡${item.inversion.toLocaleString()} · <strong>Empleos:</strong> ${item.empleos}</p>
      <p><strong>Compromiso:</strong> ${item.compromiso !== null ? `₡${item.compromiso.toLocaleString()} / ${item.empleosComprometidos} empleos` : 'Sin aprobación firme'}</p>
      <p><strong>Estado operativo:</strong> ${item.estado}</p>
    </article>
  `).join('') : '<div class="empty">No hay empresas registradas.</div>';
}
function renderCompromisos(){const e=empresas.find(x=>String(x.id)===$('empresaInstalada').value);$('compromisos').innerHTML=e?`<p><strong>Empleos comprometidos:</strong> ${e.empleosComprometidos}</p><p><strong>Inversión comprometida:</strong> ₡${Number(e.inversionComprometida).toLocaleString()}</p>`:'<p class="note">Selecciona una empresa para ver sus compromisos.</p>';}

async function evaluarSolicitud(id){setStatus('Cargando');try{const s=solicitudes.find(x=>x.id===Number(id)||String(x.id)===String(id));const r=await evaluarConIA(s,zona);const updated=await api.updateSolicitud(s.id,{puntajeIA:r.puntaje,justificacionIA:r.justificacion,clasificacionIA:r.clasificacion,estado:'Evaluada'});solicitudes=solicitudes.map(x=>x.id===updated.id?updated:x);renderDashboard();setStatus('Listo');return updated;}catch(error){console.error(error);setStatus('Error');throw error;}finally{setTimeout(()=>setStatus('Listo'),500);}}
async function evaluarPendientes(){const pendientes=solicitudes.filter(s=>s.clasificacionIA==='Pendiente');if(!pendientes.length)return;setStatus('Cargando');try{await Promise.all(pendientes.map(s=>evaluarSolicitud(s.id)));}catch(error){console.error(error);alert('Una o más evaluaciones no pudieron completarse. Revisa la consola.');}finally{setStatus('Listo');}}

$('solicitudForm').addEventListener('submit',async e=>{e.preventDefault();setStatus('Cargando');message('solicitudMessage','Enviando...');try{const data={empresa:$('empresa').value.trim(),sector:$('sector').value,inversionProyectada:Number($('inversion').value),empleosProyectados:Number($('empleos').value),documentos:$('documentos').value.trim(),estado:'Pendiente IA',puntajeIA:null,justificacionIA:'',clasificacionIA:'Pendiente',decisionHumana:'Pendiente',zonaFrancaId:zona.id,fecha:new Date().toISOString()};const created=await api.createSolicitud(data);solicitudes.push(created);e.target.reset();renderDashboard();renderEmpresasList();message('solicitudMessage','Solicitud registrada correctamente.','ok');}catch(error){console.error(error);message('solicitudMessage','No fue posible guardar la solicitud.','error');}finally{setStatus('Listo');}});
$('evaluarPendientes').addEventListener('click',evaluarPendientes);$('filterEstado').addEventListener('change',renderDashboard);$('filterSector').addEventListener('change',renderDashboard);
$('solicitudesList').addEventListener('click',async e=>{const detail=e.target.dataset.detail,ev=e.target.dataset.evaluate;if(ev){try{await evaluarSolicitud(ev);}catch{alert('No se pudo evaluar la solicitud.');}}if(detail)openDetail(detail);});
function openDetail(id){const s=solicitudes.find(x=>String(x.id)===String(id));const h=historial.filter(x=>String(x.solicitudId)===String(s.id));$('detalleBody').innerHTML=`<section class="dialog-section"><p class="eyebrow">${s.sector}</p><h3>${s.empresa}</h3><p>Inversión proyectada: ₡${Number(s.inversionProyectada).toLocaleString()} · Empleos proyectados: ${s.empleosProyectados}</p></section><section class="dialog-section"><h3>Evaluación IA</h3><p><strong>Puntaje:</strong> ${s.puntajeIA??'Pendiente'}</p><p><strong>Clasificación:</strong> ${s.clasificacionIA}</p><p>${s.justificacionIA||'Aún no evaluada.'}</p></section><section class="dialog-section"><h3>Decisión humana</h3><p>Actual: <strong>${s.decisionHumana}</strong></p><div class="decision-grid"><button data-decision="Aprobada" data-id="${s.id}">Aprobar</button><button data-decision="En revisión" data-id="${s.id}">En revisión</button><button data-decision="Rechazada" data-id="${s.id}">Rechazar</button></div></section><section class="dialog-section"><h3>Historial</h3>${h.length?h.map(x=>`<p>${new Date(x.fecha).toLocaleString()} · ${x.accion}: ${x.detalle}</p>`).join(''):'<p>Sin movimientos.</p>'}</section>`;$('detalleDialog').showModal();}
function confirmarCambioDecision(decision){const mensajes={Aprobada:['¿Desea aprobar esta solicitud?','Confirme la aprobación final de esta solicitud.'], 'En revisión':['¿Desea dejar esta solicitud en revisión?','Confirme que esta solicitud pasará a revisión final.'], Rechazada:['¿Desea rechazar esta solicitud?','Confirme el rechazo final de esta solicitud.']};const [primera, segunda]=mensajes[decision]||['¿Confirma esta acción?','Confirme la acción final.'];return window.confirm(primera) && window.confirm(segunda);}
$('detalleBody').addEventListener('click',async e=>{if(!e.target.dataset.decision)return;const id=Number(e.target.dataset.id), decision=e.target.dataset.decision;if(!confirmarCambioDecision(decision))return;setStatus('Cargando');try{const s=solicitudes.find(x=>x.id===id);const updated=await api.updateSolicitud(id,{decisionHumana:decision});solicitudes=solicitudes.map(x=>x.id===id?updated:x);const event=await api.createHistorial({solicitudId:id,empresa:s.empresa,accion:'Decisión humana',detalle:decision,responsable:'Analista',fecha:new Date().toISOString()});historial.push(event);if(decision==='Aprobada'&&!empresas.some(x=>x.solicitudId===id)){const emp=await api.createEmpresa({solicitudId:id,empresa:s.empresa,sector:s.sector,inversionComprometida:s.inversionProyectada,empleosComprometidos:s.empleosProyectados,zonaFrancaId:s.zonaFrancaId,fechaInstalacion:new Date().toISOString()});empresas.push(emp);renderEmpresas();}renderDashboard();renderEmpresasList();openDetail(id);}catch(error){console.error(error);alert('No se pudo registrar la decisión.');}finally{setStatus('Listo');}});
$('cerrarDialog').addEventListener('click',()=> $('detalleDialog').close());
$('empresaInstalada').addEventListener('change',renderCompromisos);
$('cumplimientoForm').addEventListener('submit',async e=>{e.preventDefault();const empresa=empresas.find(x=>String(x.id)===$('empresaInstalada').value);if(!empresa)return;setStatus('Cargando');try{const reporte={empresaId:empresa.id,empresa:empresa.empresa,empleosReales:Number($('empleosReales').value),inversionEjecutada:Number($('inversionEjecutada').value),exportaciones:Number($('exportaciones').value),fecha:new Date().toISOString()};const resultado=compararCumplimiento(empresa,reporte);const saved=await api.createReporte({...reporte,estado:resultado.enRegla?'En regla':'Con alerta'});if(resultado.alertas.length){await Promise.all(resultado.alertas.map(a=>api.createAlerta({empresaId:empresa.id,empresa:empresa.empresa,tipo:a.tipo,comprometido:a.comprometido,reportado:a.reportado,estado:'Abierta',fecha:new Date().toISOString(),reporteId:saved.id})));}await api.createHistorial({solicitudId:empresa.solicitudId,empresa:empresa.empresa,accion:'Reporte de cumplimiento',detalle:resultado.enRegla?'En regla':'Generó alerta',responsable:'Sistema',fecha:new Date().toISOString()});message('cumplimientoMessage',resultado.enRegla?'Reporte procesado: empresa en regla.':'Reporte procesado: se generó una alerta.','ok');e.target.reset();renderCompromisos();}catch(error){console.error(error);message('cumplimientoMessage','No se pudo procesar el reporte.','error');}finally{setStatus('Listo');}});
async function renderAlertas(){setStatus('Cargando');try{const alerts=await api.getAlertas();$('alertasList').innerHTML=alerts.length?alerts.map(a=>`<article class="card alert"><div class="card-head"><h3>${a.empresa}</h3><span class="badge rechazada">${a.estado}</span></div><p><strong>${a.tipo}</strong>: comprometido ${a.comprometido} · reportado ${a.reportado}</p><p>${new Date(a.fecha).toLocaleString()}</p></article>`).join(''):'<div class="empty">No hay alertas registradas.</div>';}catch(error){console.error(error);$('alertasList').innerHTML='<div class="empty">No fue posible cargar las alertas.</div>';}finally{setStatus('Listo');}}
$('refrescarAlertas').addEventListener('click',renderAlertas);
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('is-active'));btn.classList.add('is-active');document.querySelectorAll('.view').forEach(x=>x.classList.remove('is-active'));$(`view-${btn.dataset.view}`).classList.add('is-active');if(btn.dataset.view==='alertas')renderAlertas();if(btn.dataset.view==='empresas')renderEmpresasList();}));
loadBase();