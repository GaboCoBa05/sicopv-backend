/**
 * Smoke test de la API SiCoPV (Node Core).
 *
 * Requiere la API en ejecución y la base de datos con el seed aplicado.
 * Uso:
 *   npm run test:api
 *   BASE=http://localhost:3000 npm run test:api
 */

const BASE = process.env.BASE || 'http://localhost:3000';

const CUENTAS = {
  ADMIN: ['admin_tsr', 'AdminTSR2026!'],
  JEFE_MANTTO: ['cmendoza', 'admin123'],
  TECNICO: ['rgonzalez', 'admin123'],
  OPERADOR: ['esanchez', 'admin123'],
  SUPERVISOR: ['supervisor tsr', 'admin123'],
  CALIDAD: ['calidad_tsr', 'admin123'],
};

const ROLES = Object.keys(CUENTAS);
let fallos = 0;

function check(ok, mensaje) {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + mensaje);
  if (!ok) fallos++;
}

async function login(usuario, password) {
  const res = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: usuario, password })
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, token: data.token, rol: data.user && data.user.rol, error: data.error };
}

async function pedir(path, token, options = {}) {
  const headers = Object.assign({}, options.headers || {});
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(BASE + path, Object.assign({}, options, { headers }));
  const tipo = res.headers.get('content-type') || '';
  const cuerpo = tipo.includes('json') ? await res.json().catch(() => ({})) : Buffer.from(await res.arrayBuffer());
  return { status: res.status, cuerpo, tipo };
}

(async () => {
  const tokens = {};

  for (const rol of ROLES) {
    const [usuario, password] = CUENTAS[rol];
    const r = await login(usuario, password);
    check(r.status === 200 && r.token && r.rol === rol, `login ${rol} (${usuario}) -> ${r.status} ${r.error || ''}`);
    tokens[rol] = r.token;
  }

  const malo = await login('supervisor_tsr', 'clave-incorrecta');
  check(malo.status === 401, `login con contraseña incorrecta -> ${malo.status}`);

  const bitacorasAdmin = await pedir('/api/bitacora', tokens.ADMIN);
  const folioMuestra = Array.isArray(bitacorasAdmin.cuerpo) && bitacorasAdmin.cuerpo.length > 0
    ? bitacorasAdmin.cuerpo[0].folio
    : null;

  const matriz = {
    '/api/equipos': ROLES,
    '/api/fallas': ROLES,
    '/api/bitacora': ['ADMIN', 'JEFE_MANTTO', 'TECNICO', 'SUPERVISOR', 'CALIDAD'],
    '/api/tecnicos': ['ADMIN', 'JEFE_MANTTO', 'SUPERVISOR'],
    '/api/preventivos': ['ADMIN', 'JEFE_MANTTO', 'TECNICO', 'SUPERVISOR'],
    '/api/dashboard/eficiencia': ['ADMIN', 'JEFE_MANTTO', 'SUPERVISOR', 'CALIDAD'],
    '/api/usuarios': ['ADMIN'],
  };

  if (folioMuestra) {
    matriz['/api/reportes/pdf/' + encodeURIComponent(folioMuestra)] =
      ['ADMIN', 'JEFE_MANTTO', 'TECNICO', 'SUPERVISOR', 'CALIDAD'];
  }

  for (const [path, permitidos] of Object.entries(matriz)) {
    for (const rol of ROLES) {
      const r = await pedir(path, tokens[rol]);
      const esperado = permitidos.includes(rol) ? 200 : 403;
      check(r.status === esperado, `GET ${path} [${rol}] -> ${r.status} (esperado ${esperado})`);

      if (path.startsWith('/api/reportes/pdf/') && r.status === 200) {
        const firma = r.cuerpo.slice(0, 4).toString();
        check(firma === '%PDF', `PDF válido para ${rol} (firma ${firma})`);
      }
    }
  }

  const resetAutenticado = await pedir('/api/auth/reset-password', tokens.SUPERVISOR, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'supervisor@tsrsaltillo.com', nueva_contrasena: 'corta' })
  });
  check(resetAutenticado.status === 400 && /8 caracteres/.test(resetAutenticado.cuerpo.error || ''),
    `reset-password autenticado valida longitud -> ${resetAutenticado.status}`);

  const resetPublico = await pedir('/api/auth/reset-password', null, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'supervisor@tsrsaltillo.com', nueva_contrasena: 'ClaveSegura1!' })
  });
  check(resetPublico.status === 400 && /código/i.test(resetPublico.cuerpo.error || ''),
    `reset-password público exige código -> ${resetPublico.status}`);

  // Flujo completo: falla -> bitácora -> PDF -> borrado
  const equipos = await pedir('/api/equipos', tokens.ADMIN);
  const equipo = equipos.cuerpo.find(e => e.estado === 'OPERATIVO') || equipos.cuerpo[0];

  const creacion = await pedir('/api/fallas', tokens.OPERADOR, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      equipo_id: equipo.id,
      tipo_falla: 'Mecánica',
      descripcion: 'Prueba automatizada de endpoints',
      prioridad: 'BAJA'
    })
  });
  check(creacion.status === 201 && creacion.cuerpo.folio, `POST /api/fallas -> ${creacion.status} ${creacion.cuerpo.folio || ''}`);

  if (creacion.cuerpo.falla) {
    const bitacora = await pedir('/api/bitacora', tokens.TECNICO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        falla_id: creacion.cuerpo.falla.id,
        tiempo_reparacion_min: 12,
        causa_raiz: 'Prueba automatizada',
        refacciones_empleadas: 'Ninguna'
      })
    });
    check(bitacora.status === 201, `POST /api/bitacora -> ${bitacora.status} ${bitacora.cuerpo.error || ''}`);

    const pdf = await pedir('/api/reportes/pdf/' + encodeURIComponent(creacion.cuerpo.folio), tokens.SUPERVISOR);
    check(pdf.status === 200 && pdf.cuerpo.slice(0, 4).toString() === '%PDF', `PDF del folio nuevo -> ${pdf.status}`);

    const borrado = await pedir('/api/fallas/' + creacion.cuerpo.falla.id, tokens.ADMIN, { method: 'DELETE' });
    check(borrado.status === 200, `DELETE falla de prueba -> ${borrado.status}`);
  }

  console.log('\n' + (fallos === 0 ? 'TODO OK' : fallos + ' FALLO(S)'));
  process.exit(fallos === 0 ? 0 : 1);
})().catch(err => {
  console.error('Error ejecutando el smoke test:', err);
  process.exit(1);
});
