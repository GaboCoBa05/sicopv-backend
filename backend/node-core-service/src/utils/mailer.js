/**
 * Módulo de Despacho de Correos y Webhooks de Verificación
 * SiCoPV / AFYP - TSR Saltillo
 * Soporta Webhooks HTTP (n8n, Make, Slack, Discord, API corporativa),
 * proveedores directos (Resend, SendGrid) y registro de auditoría.
 */

async function enviarCodigoVerificacion({ to, codigo, usuario }) {
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL || process.env.WEBHOOK_URL;
  const resendApiKey = process.env.RESEND_API_KEY;
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const remitente = process.env.EMAIL_FROM || 'notificaciones@tsrsaltillo.com';

  const asunto = 'Código de Verificación de Seguridad - SiCoPV / AFYP';
  const cuerpoTexto = `Estimado(a) ${usuario || 'colaborador'},\n\nTu código de verificación para restablecer tu contraseña en la plataforma SiCoPV (TSR Saltillo) es:\n\n${codigo}\n\nEste código es personal e intransferible y expira en 15 minutos.\nSi no solicitaste este cambio, favor de reportarlo de inmediato a Seguridad y TI de planta.`;

  console.log(`\n=============================================================`);
  console.log(`[SEGURIDAD / CORREO] DESPACHO DE CÓDIGO DE VERIFICACIÓN`);
  console.log(`Destinatario : ${to}`);
  console.log(`Usuario      : ${usuario || 'N/A'}`);
  console.log(`Código       : ${codigo}`);
  console.log(`Expiración   : 15 minutos`);
  console.log(`=============================================================\n`);

  let resultado = { enviado: false, metodo: 'consola' };

  // 1. Despacho por Webhook HTTP (Webhook corporativo, n8n, Make, etc.)
  if (webhookUrl) {
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'CODIGO_VERIFICACION',
          to,
          usuario,
          codigo,
          asunto,
          mensaje: cuerpoTexto,
          remitente,
          expiracion_minutos: 15,
          timestamp: new Date().toISOString()
        })
      });
      if (resp.ok) {
        console.log('[MAILER] Webhook ejecutado exitosamente hacia:', webhookUrl);
        resultado = { enviado: true, metodo: 'webhook' };
        return resultado;
      } else {
        console.warn('[MAILER] Webhook respondió con código:', resp.status);
      }
    } catch (err) {
      console.warn('[MAILER Error Webhook]', err.message);
    }
  }

  // 2. Despacho por Resend API si existe clave configurada
  if (resendApiKey) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: remitente.includes('@') ? remitente : 'onboarding@resend.dev',
          to: [to],
          subject: asunto,
          html: `
            <div style="font-family: Arial, sans-serif; background:#F5F6F4; padding:24px; color:#10484B;">
              <div style="max-width:520px; margin:0 auto; background:#FFFFFF; border-radius:10px; padding:28px; border:1px solid #D2DEDB;">
                <h2 style="color:#0B3B36; margin-top:0;">SiCoPV / AFYP &bull; TSR Saltillo</h2>
                <p>Estimado(a) <strong>${usuario || 'Colaborador'}</strong>,</p>
                <p>Se ha solicitado la verificación de tu identidad para actualizar tu contraseña en la plataforma de mantenimiento de planta.</p>
                <div style="text-align:center; margin:24px 0;">
                  <span style="display:inline-block; font-size:32px; font-weight:bold; letter-spacing:6px; color:#0B3B36; background:#D4EBE5; padding:12px 24px; border-radius:8px;">${codigo}</span>
                </div>
                <p style="font-size:13px; color:#5A8A87;">Este código tiene una vigencia de <strong>15 minutos</strong>. Si tú no solicitaste este cambio, ignora este correo.</p>
              </div>
            </div>
          `
        })
      });
      if (resp.ok) {
        console.log('[MAILER] Correo enviado vía Resend API a:', to);
        resultado = { enviado: true, metodo: 'resend' };
        return resultado;
      }
    } catch (err) {
      console.warn('[MAILER Error Resend]', err.message);
    }
  }

  // 3. Sin proveedor configurado: no se envió nada. Se informa con honestidad.
  return { enviado: false, metodo: 'no_configurado' };
}

module.exports = {
  enviarCodigoVerificacion
};
