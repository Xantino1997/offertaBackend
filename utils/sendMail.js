const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
});

// Test de conexión al arrancar el servidor
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP no conecta');
    console.error('   Código:', error.code);
    console.error('   Mensaje:', error.message);
    console.error('   Respuesta SMTP:', error.response || 'sin respuesta');
    console.error('   EMAIL_USER definido:', !!process.env.EMAIL_USER);
    console.error('   EMAIL_PASS definido:', !!process.env.EMAIL_PASS);
  } else {
    console.log('✅ SMTP listo — usuario:', process.env.EMAIL_USER);
  }
});

const sendEmail = async (to, subject, text, html) => {
  console.log(`📤 Intentando enviar email a: ${to} | Asunto: ${subject}`);

  try {
    const info = await transporter.sendMail({
      from: `"Offerton" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log('✅ Email enviado correctamente');
    console.log('   Message ID:', info.messageId);
    console.log('   Respuesta SMTP:', info.response);
    return info;

  } catch (err) {
    console.error('❌ Falló el envío del email');
    console.error('   Para:', to);
    console.error('   Código de error:', err.code);
    console.error('   Mensaje:', err.message);
    console.error('   Respuesta SMTP:', err.response || 'sin respuesta');
    console.error('   Command:', err.command || 'N/A');
    throw err; // re-lanzamos para que el .catch() del caller también lo vea
  }
};

module.exports = sendEmail;
