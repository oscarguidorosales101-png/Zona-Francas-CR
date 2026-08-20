const BASE='http://localhost:3001';
async function request(path, options={}){
  const response=await fetch(`${BASE}${path}`,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  if(!response.ok) throw new Error('No fue posible completar la operación. Verifica que el servidor esté disponible.');
  return response.status===204?null:response.json();
}
export const api={
  getZona:()=>request('/zonasFrancas/1'),
  getSolicitudes:()=>request('/solicitudes'),
  getSolicitud:(id)=>request(`/solicitudes/${id}`),
  createSolicitud:(data)=>request('/solicitudes',{method:'POST',body:JSON.stringify(data)}),
  updateSolicitud:(id,data)=>request(`/solicitudes/${id}`,{method:'PATCH',body:JSON.stringify(data)}),
  getEmpresas:()=>request('/empresas'),
  createEmpresa:(data)=>request('/empresas',{method:'POST',body:JSON.stringify(data)}),
  getReportes:()=>request('/reportesCumplimiento'),
  createReporte:(data)=>request('/reportesCumplimiento',{method:'POST',body:JSON.stringify(data)}),
  getAlertas:()=>request('/alertas'),
  createAlerta:(data)=>request('/alertas',{method:'POST',body:JSON.stringify(data)}),
  getHistorial:()=>request('/historial'),
  createHistorial:(data)=>request('/historial',{method:'POST',body:JSON.stringify(data)})
};