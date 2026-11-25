const { query } = require('../config/db');

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function rangoMes(offset) {
  const ahora = new Date();
  const inicio = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + offset, 1));
  const fin = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + offset + 1, 1));
  return { inicio, fin };
}

// GET /api/dashboard/eficiencia
exports.obtenerEficiencia = async (req, res) => {
  try {
    const resB = await query('SELECT tiempo_reparacion_min, fecha_inicio, fecha_fin FROM reparacion_bitacora');
    const resF = await query('SELECT id, fecha_reporte, estado FROM fallas');
    const resP = await query('SELECT id, estado FROM mantenimiento_preventivo');
    const resE = await query('SELECT COUNT(*) AS total FROM equipos');

    const bitacoras = resB.rows;
    const fallas = resF.rows;
    const preventivos = resP.rows;
    const equiposTotal = parseInt(resE.rows[0].total, 10) || 0;

    // 1. MTTR
    const totalReparaciones = bitacoras.length;
    const tiempoTotalMinutos = bitacoras.reduce((acc, b) => acc + (parseInt(b.tiempo_reparacion_min, 10) || 0), 0);
    const mttrMinutos = totalReparaciones > 0 ? (tiempoTotalMinutos / totalReparaciones) : 0;
    const mttrHoras = mttrMinutos / 60;

    // 2. MTBF (ventana de 30 días por equipo)
    const horasOperativasTotales = equiposTotal * 720;
    const tiempoReparacionHoras = tiempoTotalMinutos / 60;
    const tiempoOperativoReal = Math.max(horasOperativasTotales - tiempoReparacionHoras, 0);
    const mtbfHoras = fallas.length > 0 ? (tiempoOperativoReal / fallas.length) : 0;

    // 3. Disponibilidad operativa
    const disponibilidad = (mtbfHoras + mttrHoras) > 0
      ? ((mtbfHoras / (mtbfHoras + mttrHoras)) * 100)
      : 0;

    // 4. Distribución real de intervenciones registradas
    const totalCorrectivos = totalReparaciones;
    const totalPreventivos = preventivos.filter(p => p.estado === 'COMPLETADO').length;
    const totalOtros = 0;
    const sumaTotal = totalCorrectivos + totalPreventivos + totalOtros;

    const distribucion = {
      correctivo: sumaTotal > 0 ? Math.round((totalCorrectivos / sumaTotal) * 100) : 0,
      preventivo: sumaTotal > 0 ? Math.round((totalPreventivos / sumaTotal) * 100) : 0,
      ajustes: 0,
      otros: 0
    };

    // 5. Historial MTBF de los últimos 4 meses (datos reales)
    const historicoMtbf = [];
    for (let offset = -3; offset <= 0; offset++) {
      const { inicio, fin } = rangoMes(offset);
      const fallasMes = fallas.filter(f => {
        const fecha = new Date(f.fecha_reporte);
        return fecha >= inicio && fecha < fin;
      });
      const reparacionesMes = bitacoras.filter(b => {
        const fecha = new Date(b.fecha_fin);
        return fecha >= inicio && fecha < fin;
      });
      const minutosMes = reparacionesMes.reduce((acc, b) => acc + (parseInt(b.tiempo_reparacion_min, 10) || 0), 0);
      const operativoMes = Math.max((equiposTotal * 720) - (minutosMes / 60), 0);
      historicoMtbf.push({
        mes: MESES[inicio.getUTCMonth()],
        mtbf: fallasMes.length > 0 ? Math.round(operativoMes / fallasMes.length) : 0
      });
    }

    const { inicio: inicioMesActual, fin: finMesActual } = rangoMes(0);
    const fallasMesActual = fallas.filter(f => {
      const fecha = new Date(f.fecha_reporte);
      return fecha >= inicioMesActual && fecha < finMesActual;
    }).length;

    return res.status(200).json({
      mttr: {
        minutos: Math.round(mttrMinutos),
        horas: parseFloat(mttrHoras.toFixed(2)),
        total_reparaciones: totalReparaciones
      },
      mtbf: {
        horas: Math.round(mtbfHoras),
        total_fallas: fallas.length
      },
      disponibilidad_porcentaje: parseFloat(disponibilidad.toFixed(1)),
      fallas_mes: fallasMesActual,
      distribucion_intervenciones: distribucion,
      historico_mtbf: historicoMtbf
    });

  } catch (error) {
    console.error('[dashboardController.obtenerEficiencia Error]', error);
    return res.status(500).json({ error: 'Error al procesar las métricas de eficiencia.' });
  }
};
