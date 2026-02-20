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
    console.error('❌ SMTP no conecta:', error.message);
  } else {
    console.log('✅ SMTP listo para enviar emails');
  }
});

const sendEmail = async (to, subject, text, html) => {
  await transporter.sendMail({
    from: `"Offerton" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html: html || text,
  });
};

module.exports = sendEmail;
