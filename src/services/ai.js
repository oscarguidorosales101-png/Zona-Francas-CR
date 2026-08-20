export function esperar(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
export async function evaluarConIA(solicitud,zona){
  await esperar(650+Math.floor(Math.random()*500));
  let puntaje=0; const razones=[];
  if(zona.sectoresPermitidos.includes(String(solicitud.sector).toLowerCase())){puntaje+=35;razones.push('sector permitido');}else{razones.push('sector fuera de la lista académica permitida');}
  if(Number(solicitud.inversionProyectada)>=Number(zona.inversionMinima)){puntaje+=35;razones.push('inversión proyectada cumple el mínimo');}else{const ratio=Math.max(0,Number(solicitud.inversionProyectada)/Number(zona.inversionMinima));puntaje+=Math.round(35*ratio);razones.push('inversión proyectada por debajo del mínimo');}
  if(Number(solicitud.empleosProyectados)>=Number(zona.empleosMinimos)){puntaje+=30;razones.push('empleos proyectados cumplen el mínimo');}else{const ratio=Math.max(0,Number(solicitud.empleosProyectados)/Number(zona.empleosMinimos));puntaje+=Math.round(30*ratio);razones.push('empleos proyectados por debajo del mínimo');}
  puntaje=Math.max(0,Math.min(100,puntaje));
  const clasificacion=puntaje>=75?'Recomendada':puntaje>=50?'Revisar':'Rechazada';
  return{puntaje,clasificacion,justificacion:`Evaluación simulada: ${razones.join('; ')}. La decisión final corresponde al analista humano.`};
}