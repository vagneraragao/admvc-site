// lib/mail.ts
import { Resend } from 'resend';

export async function enviarEmailNotificacaoEquipa(dados: { nome: string, telefone: string, pedido: string }) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  // 1. Lógica para identificar a origem e ajustar Subject e Cores
  const isContactoSite = dados.pedido.includes('[CONTACTO SITE]');

  const config = {
    subject: isContactoSite
      ? `✉️ Mensagem do Site: ${dados.nome}`
      : `🌱 Novo Visitante: ${dados.nome}`,
    headerColor: isContactoSite
      ? '#1a202c' // Cor mais escura para Contactos Gerais
      : '#3F6B4F', // Verde Figueira para Novos Visitantes
    title: isContactoSite
      ? 'Contacto Geral'
      : 'Novo Acolhimento'
  };

  const telefoneLimpo = dados.telefone.replace(/\D/g, '');
  const linkWhatsapp = `https://wa.me/${telefoneLimpo}`;
  const linkDashboard = `https://igrejaadmvc.org/departamentos/acolhimento`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Sistema ADMVC <acolhimento@igrejaadmvc.org>',
      to: 'admvcff@gmail.com',
      subject: config.subject, // 👈 Subject Dinâmico
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
          
          <div style="background-color: ${config.headerColor}; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px; font-style: italic; font-weight: 900;">
              ${config.title}
            </h1>
          </div>

          <div style="padding: 30px; color: #1a202c;">
            <p style="font-size: 16px; line-height: 1.6;">
              Olá equipa! Alguém acabou de contactar a nossa casa através da página de <strong>${isContactoSite ? 'Contacto' : 'Boas-vindas'}</strong>.
            </p>

            <div style="background-color: #f8fafc; border-radius: 16px; padding: 20px; margin: 24px 0; border: 1px solid #edf2f7;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <span style="font-size: 10px; font-weight: 800; color: ${config.headerColor}; text-transform: uppercase; letter-spacing: 1px;">Nome</span><br />
                    <strong style="font-size: 18px;">${dados.nome}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px;">
                    <span style="font-size: 10px; font-weight: 800; color: ${config.headerColor}; text-transform: uppercase; letter-spacing: 1px;">Contacto</span><br />
                    <span style="font-size: 14px;">${dados.telefone}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span style="font-size: 10px; font-weight: 800; color: ${config.headerColor}; text-transform: uppercase; letter-spacing: 1px;">Mensagem / Pedido</span><br />
                    <p style="font-size: 14px; color: #4a5568; font-style: italic; margin-top: 5px; line-height: 1.5; white-space: pre-line;">
                      "${dados.pedido}"
                    </p>
                  </td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${linkWhatsapp}" target="_blank" style="display: block; background-color: #25D366; color: #ffffff; padding: 15px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; text-align: center;">
                Falar no WhatsApp agora
              </a>
              
              <a href="${linkDashboard}" target="_blank" style="display: block; background-color: #1a202c; color: #ffffff; padding: 15px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                Ver na Dashboard do Acolhimento
              </a>
            </div>
          </div>

          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b;">
            <p style="margin: 0;">Este é um aviso automático do Sistema ADMVC.</p>
            <p style="margin: 5px 0 0 0; font-weight: bold;">"Sê muito bem-vindo, fica para sempre!"</p>
          </div>
        </div>
      `
    });

    console.log(`✅ Notificação [${config.title}] enviada!`);
    return { ok: true };
  } catch (err) {
    console.error("💥 Erro no e-mail interno:", err);
    return { ok: false };
  }
}