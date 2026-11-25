/**
 * SiCoPV - Control de acceso y matriz de roles en el frontend.
 * Garantiza cumplimiento de la política de roles y navegación segura.
 */
(function () {
  'use strict';

  var MENU = {
    'reportar-falla': ['ADMIN', 'JEFE_MANTTO', 'TECNICO', 'OPERADOR', 'SUPERVISOR'],
    'ingreso-maquinaria': ['ADMIN', 'JEFE_MANTTO', 'SUPERVISOR'],
    'bitacora': ['ADMIN', 'JEFE_MANTTO', 'TECNICO'],
    'registrar-tecnico': ['ADMIN', 'JEFE_MANTTO', 'SUPERVISOR'],
    'preventivo': ['ADMIN', 'JEFE_MANTTO', 'TECNICO', 'SUPERVISOR'],
    'dashboard': ['ADMIN', 'JEFE_MANTTO', 'SUPERVISOR', 'CALIDAD'],
    'reportes': ['ADMIN', 'JEFE_MANTTO', 'TECNICO', 'SUPERVISOR', 'CALIDAD'],
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
      case 'OPERADOR':
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
      '.sicopv-btn-pass{background:transparent;color:#A8DDCB;border:1px solid rgba(168,221,203,.6);' +
      'border-radius:6px;padding:4px 9px;font-size:11px;font-weight:600;cursor:pointer;margin-right:4px;}' +
      '.sicopv-btn-pass:hover{background:rgba(168,221,203,.2);}' +
      '.sicopv-logout{background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.4);' +
      'border-radius:6px;padding:4px 9px;font-size:11px;cursor:pointer;}' +
      '.sicopv-logout:hover{background:rgba(255,255,255,.35);}' +
      '.sicopv-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;' +
      'justify-content:center;z-index:99999;font-family:\'Segoe UI\',Arial,sans-serif;}' +
      '.sicopv-modal-box{background:#0B3B36;color:#fff;padding:26px 28px;border-radius:12px;width:380px;max-width:92%;' +
      'box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid rgba(168,221,203,0.3);}' +
      '.sicopv-modal-box h3{margin-top:0;margin-bottom:12px;font-size:18px;color:#A8DDCB;}' +
      '.sicopv-modal-box p{font-size:12.5px;color:#D1ECE5;margin-bottom:14px;line-height:1.4;}' +
      '.sicopv-modal-box input{width:100%;box-sizing:border-box;padding:10px 12px;margin-bottom:12px;' +
      'border:1px solid #D2DEDB;border-radius:6px;font-size:13px;}' +
      '.sicopv-modal-btns{display:flex;gap:10px;justify-content:flex-end;margin-top:10px;}' +
      '.sicopv-modal-btns button{padding:8px 16px;border-radius:6px;font-size:13px;font-weight:bold;cursor:pointer;border:none;}' +
      '.sicopv-btn-cancelar{background:rgba(255,255,255,0.2);color:#fff;}' +
      '.sicopv-btn-guardar{background:#A8DDCB;color:#0B3B36;}';
    (document.head || document.documentElement).appendChild(style);
  }

  function htmlUsuario() {
    return '<span class="sicopv-user-name">' + nombreUsuario() + '</span>' +
      '<span class="sicopv-user-rol">' + etiquetaRol() + '</span>' +
      '<button type="button" class="sicopv-btn-pass" onclick="SICOPV.modalCambiarPassword()">Cambiar Clave</button>' +
      '<button type="button" class="sicopv-logout" onclick="cerrarSesion()">Cerrar sesión</button>';
  }

  /** Modal flotante para que el usuario actualice su contraseña predeterminada */
  function modalCambiarPassword() {
    inyectarEstilos();
    var idModal = 'sicopv-modal-pass';
    var existente = document.getElementById(idModal);
    if (existente) existente.remove();

    var u = usuarioActual();
    var email = u.correo || '';

    var overlay = document.createElement('div');
    overlay.id = idModal;
    overlay.className = 'sicopv-modal-overlay';
    overlay.innerHTML =
      '<div class="sicopv-modal-box">' +
      '<h3>🔑 Cambiar Contraseña</h3>' +
      '<p>Actualiza tu contraseña predeterminada o temporal por una clave personal segura para tu cuenta <strong>' + esc(u.nombre_usuario || email) + '</strong>.</p>' +
      '<input type="password" id="sicopv-new-pass" placeholder="Nueva contraseña (mínimo 8 caracteres)" />' +
      '<input type="password" id="sicopv-conf-pass" placeholder="Confirmar nueva contraseña" />' +
      '<div id="sicopv-pass-msg" style="font-size:12px;color:#FFCCD0;margin-bottom:8px;display:none;"></div>' +
      '<div class="sicopv-modal-btns">' +
      '<button type="button" class="sicopv-btn-cancelar" onclick="document.getElementById(\'' + idModal + '\').remove()">Cancelar</button>' +
      '<button type="button" class="sicopv-btn-guardar" id="sicopv-btn-save-pass">Guardar</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById('sicopv-btn-save-pass').addEventListener('click', function () {
      var p1 = document.getElementById('sicopv-new-pass').value;
      var p2 = document.getElementById('sicopv-conf-pass').value;
      var msg = document.getElementById('sicopv-pass-msg');

      if (!p1 || p1.length < 8) {
        msg.textContent = 'La contraseña debe tener al menos 8 caracteres.';
        msg.style.display = 'block';
        return;
      }
      if (p1 !== p2) {
        msg.textContent = 'Las contraseñas no coinciden.';
        msg.style.display = 'block';
        return;
      }

      fetch('http://localhost:3000/api/auth/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        },
        body: JSON.stringify({ correo: email, nueva_contrasena: p1 })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.error) throw new Error(data.error);
          alert('¡Contraseña actualizada exitosamente! Utiliza tu nueva clave en tu próximo ingreso.');
          overlay.remove();
        })
        .catch(function (err) {
          msg.textContent = err.message || 'Error al actualizar contraseña.';
          msg.style.display = 'block';
        });
    });
  }

  /** Muestra SIEMPRE quién está conectado, con el mismo estilo del dashboard. */
  function renderizarUsuario() {
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

  /** fetch con el JWT adjunto; si el backend responde 401 (sesión inválida/expirada) vuelve al login.
   *  Un 403 (rol sin permiso) NO cierra la sesión: se devuelve la respuesta para que la página lo informe. */
  function apiFetch(url, options) {
    options = options || {};
    var headers = { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') };
    if (options.body) headers['Content-Type'] = 'application/json';
    if (options.headers) {
      Object.keys(options.headers).forEach(function (k) { headers[k] = options.headers[k]; });
    }

    return fetch(url, Object.assign({}, options, { headers: headers })).then(function (res) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('rol');
        sessionStorage.removeItem('sicopv_usuario');
        sessionStorage.removeItem('sicopv_rol');
        window.location.href = '../Login/login.html';
        throw new Error('Sesión expirada');
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
    cerrarSesion: cerrarSesion,
    modalCambiarPassword: modalCambiarPassword
  };
})();
