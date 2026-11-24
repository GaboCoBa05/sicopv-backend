/**
 * SiCoPV - Control de acceso en el frontend.
 * La ocultación de menús es solo UX; la seguridad real está en el middleware
 * verificarToken / autorizar del backend.
 */
(function () {
  'use strict';

  var MENU = {
    'reportar-falla': ['ADMIN', 'JEFE_MANTTO', 'TECNICO', 'OPERADOR'],
    'ingreso-maquinaria': ['ADMIN'],
    'bitacora': ['ADMIN', 'JEFE_MANTTO', 'TECNICO'],
    'registrar-tecnico': ['ADMIN'],
    'preventivo': ['ADMIN', 'JEFE_MANTTO', 'TECNICO'],
    'dashboard': ['ADMIN', 'JEFE_MANTTO'],
    'reportes': ['ADMIN', 'JEFE_MANTTO', 'TECNICO'],
    'administracion': ['ADMIN'],
    'usuarios': ['ADMIN']
  };

  function rol() {
    var u = {};
    try { u = JSON.parse(localStorage.getItem('usuario') || '{}'); } catch (e) { u = {}; }
    return String(localStorage.getItem('rol') || u.rol || '').toUpperCase();
  }

  function tiene(clave) {
    return (MENU[clave] || []).indexOf(rol()) !== -1;
  }

  function inicioPorRol() {
    switch (rol()) {
      case 'ADMIN':
      case 'JEFE_MANTTO':
      case 'SUPERVISOR':
      case 'CALIDAD':
        return '../Dashboard/dashboard.html';
      case 'TECNICO':
        return '../BitacoraDigital/bitacora_digital.html';
      default:
        return '../FallaEquipo/fallas.html';
    }
  }

  function usuarioActual() {
    var raw = localStorage.getItem('usuario') || sessionStorage.getItem('sicopv_usuario') || '{}';
    var u;
    try { u = JSON.parse(raw); } catch (e) { u = {}; }
    return (u && typeof u === 'object') ? u : {};
  }

  function esc(texto) {
    return String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function nombreUsuario() {
    var u = usuarioActual();
    return esc(u.nombre || u.nombre_usuario || u.usuario || u.correo || 'USUARIO').toUpperCase();
  }

  function etiquetaRol() {
    var r = rol() || 'USUARIO';
    var nombres = {
      ADMIN: 'ADMINISTRADOR',
      JEFE_MANTTO: 'JEFE DE MANTENIMIENTO',
      TECNICO: 'TÉCNICO',
      OPERADOR: 'OPERADOR',
      SUPERVISOR: 'SUPERVISOR',
      CALIDAD: 'CALIDAD'
    };
    return esc(nombres[r] || r);
  }

  function inyectarEstilos() {
    if (document.getElementById('sicopv-user-style')) return;
    var style = document.createElement('style');
    style.id = 'sicopv-user-style';
    style.textContent =
      '.sicopv-user{display:flex;align-items:center;gap:8px;margin-left:auto;color:#fff;font-size:12px;white-space:nowrap;}' +
      '.sicopv-user-name{font-weight:700;letter-spacing:.3px;}' +
      '.sicopv-user-rol{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.4);' +
      'padding:3px 10px;border-radius:14px;font-size:11px;font-weight:700;letter-spacing:.5px;}' +
      '.sicopv-logout{background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.4);' +
      'border-radius:6px;padding:4px 9px;font-size:11px;cursor:pointer;}' +
      '.sicopv-logout:hover{background:rgba(255,255,255,.35);}';
    (document.head || document.documentElement).appendChild(style);
  }

  function htmlUsuario() {
    return '<span class="sicopv-user-name">' + nombreUsuario() + '</span>' +
           '<span class="sicopv-user-rol">' + etiquetaRol() + '</span>' +
           '<button type="button" class="sicopv-logout" onclick="cerrarSesion()">Cerrar sesión</button>';
  }

  /** Muestra SIEMPRE quién está conectado, con el mismo estilo del dashboard. */
  function renderizarUsuario() {
    // El dashboard ya tiene su propio encabezado con perfil y cierre de sesión.
    if (document.getElementById('nombreUsuario')) return;
    // El menú compartido ya dibuja el usuario en su propio encabezado.
    if (document.getElementById('sicopv-shell-header')) return;

    inyectarEstilos();
    var html = htmlUsuario();

    var existente = document.getElementById('sicopv-usuario');
    if (existente) { existente.innerHTML = html; return; }

    var destino = document.getElementById('userHeader') ||
      document.querySelector('header .usuario, header .usuario-superior');
    if (destino) {
      destino.id = 'sicopv-usuario';
      destino.className = (destino.className ? destino.className + ' ' : '') + 'sicopv-user';
      destino.innerHTML = html;
      return;
    }

    var header = document.querySelector('header, .encabezado, .barra');
    if (header) {
      var bloque = document.createElement('div');
      bloque.id = 'sicopv-usuario';
      bloque.className = 'sicopv-user';
      bloque.innerHTML = html;
      header.appendChild(bloque);
      return;
    }

    var barra = document.createElement('div');
    barra.id = 'sicopv-usuario';
    barra.className = 'sicopv-user';
    barra.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#0B3B36;padding:8px 16px;';
    barra.innerHTML = html;
    document.body.insertBefore(barra, document.body.firstChild);
  }

  function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    sessionStorage.removeItem('sicopv_usuario');
    sessionStorage.removeItem('sicopv_rol');
    window.location.href = '../Login/login.html';
  }

  window.cerrarSesion = cerrarSesion;

  /**
   * proteger(['ADMIN','JEFE_MANTTO']) redirige si no hay sesión o el rol no aplica,
   * elimina elementos con data-permiso no permitido y muestra el usuario activo.
   */
  function proteger(rolesPermitidos) {
    if (!localStorage.getItem('token')) {
      window.location.href = '../Login/login.html';
      return;
    }

    if (rolesPermitidos && rolesPermitidos.indexOf(rol()) === -1) {
      window.location.href = inicioPorRol();
      return;
    }

    function aplicar() {
      document.querySelectorAll('[data-permiso]').forEach(function (el) {
        if (!tiene(el.getAttribute('data-permiso'))) el.remove();
      });
      renderizarUsuario();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', aplicar);
    } else {
      aplicar();
    }
  }

  /** fetch con el JWT adjunto; si el backend responde 401/403 vuelve al login. */
  function apiFetch(url, options) {
    options = options || {};
    var headers = { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') };
    if (options.body) headers['Content-Type'] = 'application/json';
    if (options.headers) {
      Object.keys(options.headers).forEach(function (k) { headers[k] = options.headers[k]; });
    }

    return fetch(url, Object.assign({}, options, { headers: headers })).then(function (res) {
      if (res.status === 401 || res.status === 403) {
        window.location.href = '../Login/login.html';
        throw new Error('Sesión sin permisos');
      }
      return res;
    });
  }

  window.SICOPV = {
    rol: rol,
    tiene: tiene,
    proteger: proteger,
    apiFetch: apiFetch,
    inicioPorRol: inicioPorRol,
    renderizarUsuario: renderizarUsuario,
    nombreUsuario: nombreUsuario,
    etiquetaRol: etiquetaRol,
    cerrarSesion: cerrarSesion
  };
})();
