export function compararCumplimiento(empresa,reporte){
  const alertas=[];
  if(Number(reporte.empleosReales)<Number(empresa.empleosComprometidos)) alertas.push({tipo:'Empleos',comprometido:empresa.empleosComprometidos,reportado:reporte.empleosReales});
  if(Number(reporte.inversionEjecutada)<Number(empresa.inversionComprometida)) alertas.push({tipo:'Inversión',comprometido:empresa.inversionComprometida,reportado:reporte.inversionEjecutada});
  return{enRegla:alertas.length===0,alertas};
}