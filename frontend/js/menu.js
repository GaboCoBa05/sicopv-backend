/**
 * SiCoPV - Menú único compartido.
 * Replica exactamente el encabezado y la barra lateral del Dashboard en todos
 * los módulos, ocultando el menú propio de cada página. Las opciones se filtran
 * con la misma matriz de roles de permisos.js.
 *
 * No se aplica en dashboard.html: ese archivo es la referencia visual y ya
 * incluye el menú original (con su modal "Mi Perfil").
 */
(function () {
  'use strict';

  if (!window.SICOPV) return;
  if (document.getElementById('sicopv-shell-header')) return;

  var ITEMS = [
    { clave: 'reportar-falla', texto: 'Reportar Falla', href: '../FallaEquipo/fallas.html', icono: 'doc', archivos: ['fallas.html', 'seleccion.html'] },
    { clave: 'ingreso-maquinaria', texto: 'Ingreso Maquinaria', href: '../IngresoMaquinaria/ingreso_maquinaria.html', icono: 'gear', archivos: ['ingreso_maquinaria.html', 'codigo_qr.html'] },
    { clave: 'bitacora', texto: 'Bitácora Digital', href: '../BitacoraDigital/bitacora_digital.html', icono: 'mon', archivos: ['bitacora_digital.html', 'bitacora.html'] },
    { clave: 'registrar-tecnico', texto: 'Registrar Técnico', href: '../RegistrarTecnico/registrar_tecnico.html', icono: 'llave', archivos: ['registrar_tecnico.html', 'informacion_capturada.html', 'error_registro.html'] },
    { clave: 'preventivo', texto: 'Mantenimiento Preventivo', href: '../MantenimientoPreventivo/mantenimiento_preventivo.html', icono: 'cal', archivos: ['mantenimiento_preventivo.html', 'preventivo.html'] },
    { clave: 'dashboard', texto: 'Dashboard', href: '../Dashboard/dashboard.html', icono: 'grid', archivos: ['dashboard.html'] },
    { clave: 'reportes', texto: 'Reportes', href: '../Reportes/reporte_pdf.html', icono: 'graf', archivos: ['reporte_pdf.html', 'reportes.html'] },
    { clave: 'administracion', texto: 'Administración', href: '../Administracion/administracion.html', icono: 'usr', archivos: ['administracion.html'] }
  ];

  var SIMBOLOS =
    '<symbol id="sm-doc" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h5"/></symbol>' +
    '<symbol id="sm-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M10 2h4l.7 2.4 2 .9 2.2-1.1 2.8 2.8-1.1 2.2.9 2L24 12l-2.5.8-.9 2 1.1 2.2-2.8 2.8-2.2-1.1-2 .9L14 22h-4l-.7-2.4-2-.9-2.2 1.1-2.8-2.8 1.1-2.2-.9-2L0 12l2.5-.8.9-2-1.1-2.2 2.8-2.8 2.2 1.1 2-.9z"/></symbol>' +
    '<symbol id="sm-mon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M12 18v3M8 21h8"/></symbol>' +
    '<symbol id="sm-llave" viewBox="0 0 24 24"><path d="M21 6a6 6 0 0 1-8 7L5 21l-3-3 8-8a6 6 0 0 1 7-8l-4 4 5 5z"/></symbol>' +
    '<symbol id="sm-cal" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 10h18"/></symbol>' +
    '<symbol id="sm-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/></symbol>' +
    '<symbol id="sm-graf" viewBox="0 0 24 24"><path d="M4 20v-6h4v6M10 20V9h4v11M16 20V4h4v16"/></symbol>' +
    '<symbol id="sm-usr" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3z"/></symbol>';

  function inyectarEstilos() {
    if (document.getElementById('sicopv-shell-style')) return;
    var s = document.createElement('style');
    s.id = 'sicopv-shell-style';
    s.textContent =
      /* Reset y estructura */
      'body.sicopv-menu-activo{padding:62px 0 0 228px;background:#f5f6f4;font-family:Arial,sans-serif;color:#10484b;}' +
      'body.sicopv-menu-activo .contenedor{min-height:calc(100vh - 62px);}' +

      /* Ocultar el menú original de cada página */
      'body.sicopv-menu-activo > .barra,' +
      'body.sicopv-menu-activo > header:not(#sicopv-shell-header),' +
      'body.sicopv-menu-activo > .cuerpo > .sidebar,' +
      'body.sicopv-menu-activo .contenedor > .encabezado,' +
      'body.sicopv-menu-activo .contenedor > header,' +
      'body.sicopv-menu-activo .contenedor > .sidebar,' +
      'body.sicopv-menu-activo .cuerpo > .sidebar{display:none !important;}' +

      /* Encabezado (idéntico al dashboard) */
      '#sicopv-shell-header{position:fixed;top:0;left:0;right:0;height:62px;background:#0b4548;color:#fff;' +
      'display:flex;align-items:center;justify-content:space-between;padding:0 25px;gap:12px;z-index:100;' +
      'font-family:Arial,sans-serif;}' +
      '#sicopv-shell-titulo{display:flex;align-items:center;gap:15px;font-size:22px;font-weight:bold;letter-spacing:2px;}' +
      '#sicopv-shell-usuario{display:flex;align-items:center;gap:14px;}' +
      '.sm-user{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:bold;white-space:nowrap;color:#fff;}' +
      '.sm-user-rol{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.4);padding:3px 10px;' +
      'border-radius:14px;font-size:11px;font-weight:700;letter-spacing:.5px;}' +
      '.sm-logout{background:#a8ddcb;color:#0b4548;border:none;border-radius:6px;padding:7px 12px;' +
      'font-size:12px;font-weight:bold;cursor:pointer;transition:background .2s;white-space:nowrap;}' +
      '.sm-logout:hover{background:#8dceb8;}' +

      /* Barra lateral (idéntica al dashboard) */
      '#sicopv-shell-sidebar{position:fixed;top:62px;left:0;bottom:0;width:228px;background:#0b4548;' +
      'padding:18px 8px;z-index:99;overflow-y:auto;font-family:Arial,sans-serif;}' +
      '#sicopv-menu{display:flex;flex-direction:column;gap:9px;}' +
      '#sicopv-menu a{display:flex;align-items:center;gap:13px;min-height:49px;padding:12px;color:#fff;' +
      'text-decoration:none;font-size:14px;border-radius:6px;}' +
      '#sicopv-menu a:hover,#sicopv-menu a.sm-activo{background:#258c82;}' +
      '.sm-icono{width:24px;height:24px;flex-shrink:0;stroke:currentColor;fill:none;stroke-width:2;' +
      'stroke-linecap:round;stroke-linejoin:round;}' +

      /* Pantallas pequeñas */
      '@media(max-width:650px){' +
      'body.sicopv-menu-activo{padding-left:64px;}' +
      '#sicopv-shell-sidebar{width:64px;padding:18px 6px;}' +
      '#sicopv-menu a{justify-content:center;padding:12px 6px;}' +
      '#sicopv-menu a span{display:none;}' +
      '#sicopv-shell-titulo{font-size:14px;letter-spacing:1px;}' +
      '}';
    (document.head || document.documentElement).appendChild(s);
  }

  function inyectarSimbolos() {
    if (document.getElementById('sicopv-shell-svg')) return;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'sicopv-shell-svg';
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.style.display = 'none';
    svg.innerHTML = SIMBOLOS;
    document.body.insertBefore(svg, document.body.firstChild);
  }

  function archivoActual() {
    return location.pathname.split('/').pop().split('?')[0].split('#')[0].toLowerCase();
  }

  function construir() {
    var archivo = archivoActual();
    var activo = null;
    var enlaces = '';

    ITEMS.forEach(function (item) {
      // El filtro se aplica aquí también para no depender del orden de carga
      // respecto a SICOPV.proteger().
      if (!SICOPV.tiene(item.clave)) return;
      var esActivo = item.archivos.indexOf(archivo) !== -1;
      if (esActivo) activo = item;
      enlaces +=
        '<a href="' + item.href + '" data-permiso="' + item.clave + '"' +
        (esActivo ? ' class="sm-activo"' : '') + '>' +
        '<svg class="sm-icono"><use href="#sm-' + item.icono + '"></use></svg>' +
        '<span>' + item.texto + '</span></a>';
    });

    var titulo = activo ? activo.texto.toUpperCase() : (document.title || 'SiCoPV').toUpperCase();

    var header = document.createElement('header');
    header.id = 'sicopv-shell-header';
    header.innerHTML =
      '<div id="sicopv-shell-titulo">' +
        '<svg class="sm-icono"><use href="#sm-grid"></use></svg>' +
        '<span>' + titulo + '</span>' +
      '</div>' +
      '<div id="sicopv-shell-usuario">' +
        '<div class="sm-user">' +
          '<svg class="sm-icono"><use href="#sm-usr"></use></svg>' +
          '<span>' + SICOPV.nombreUsuario() + '</span>' +
          '<span class="sm-user-rol">' + SICOPV.etiquetaRol() + '</span>' +
        '</div>' +
        '<button type="button" class="sm-logout" onclick="cerrarSesion()">Cerrar Sesión</button>' +
      '</div>';

    var aside = document.createElement('aside');
    aside.id = 'sicopv-shell-sidebar';
    aside.innerHTML = '<nav id="sicopv-menu">' + enlaces + '</nav>';

    document.body.classList.add('sicopv-menu-activo');
    document.body.insertBefore(header, document.body.firstChild);
    document.body.insertBefore(aside, header.nextSibling);
  }

  function init() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    inyectarEstilos();
    inyectarSimbolos();
    construir();
  }

  init();
})();
