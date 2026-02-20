const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const User     = require('../models/userModel');
const sendEmail = require('../utils/sendMail');

// ── HTML templates ────────────────────────────────────────────────────────
function verificationEmailHTML(code, name) {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Verificá tu cuenta</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;letter-spacing:-0.5px;">
                Off<span style="color:#fed7aa;">erton</span>
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                Tu marketplace de confianza
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;">
                ¡Hola, ${name}! 👋
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Gracias por registrarte en Offerton. Para activar tu cuenta, ingresá el siguiente código de verificación:
              </p>

              <!-- Code box -->
              <div style="background:#fff7ed;border:2px dashed #f97316;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">
                  Código de verificación
                </p>
                <span style="font-size:42px;font-weight:900;color:#f97316;letter-spacing:10px;font-family:'Courier New',monospace;">
                  ${code}
                </span>
                <p style="margin:12px 0 0;color:#9ca3af;font-size:12px;">
                  ⏱️ Válido por <strong>10 minutos</strong>
                </p>
              </div>

              <p style="margin:0 0 8px;color:#6b7280;font-size:14px;line-height:1.6;">
                Si no creaste esta cuenta, podés ignorar este email con total seguridad.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                © ${new Date().getFullYear()} Offerton. Todos los derechos reservados.<br/>
                Este es un email automático, por favor no respondas.
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;
}

function resendEmailHTML(code, name) {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Nuevo código de verificación</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;letter-spacing:-0.5px;">
                Off<span style="color:#fed7aa;">erton</span>
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                Tu marketplace de confianza
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;">
                Nuevo código solicitado 🔄
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Hola <strong>${name}</strong>, aquí está tu nuevo código de verificación para Offerton:
              </p>

              <!-- Code box -->
              <div style="background:#fff7ed;border:2px dashed #f97316;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">
                  Tu nuevo código
                </p>
                <span style="font-size:42px;font-weight:900;color:#f97316;letter-spacing:10px;font-family:'Courier New',monospace;">
                  ${code}
                </span>
                <p style="margin:12px 0 0;color:#9ca3af;font-size:12px;">
                  ⏱️ Válido por <strong>10 minutos</strong>
                </p>
              </div>

              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
                Si no solicitaste este código, ignorá este mensaje.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                © ${new Date().getFullYear()} Offerton. Todos los derechos reservados.<br/>
                Este es un email automático, por favor no respondas.
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;
}

// ── REGISTER ──────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ── Validación básica de campos ───────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });
    }

    console.log(`📝 Intento de registro — email: ${email} | nombre: ${name} | rol: ${role}`);

    // ── Verificar si el email ya existe ───────────────────────────────────
    const exists = await User.findOne({ email });
    if (exists) {
      console.warn(`⚠️  Email ya registrado: ${email}`);
      return res.status(400).json({ message: 'Email ya registrado' });
    }

    // ── Hash de contraseña ────────────────────────────────────────────────
    const hashed  = await bcrypt.hash(password, 10);
    const code    = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;

    console.log(`🔑 Código de verificación generado: ${code} | Expira: ${new Date(expires).toISOString()}`);

    // ── Crear usuario ─────────────────────────────────────────────────────
    const user = await User.create({
      name, email, password: hashed, role,
      verificationCode: code,
      verificationCodeExpires: expires,
    });

    console.log(`✅ Usuario creado en DB — ID: ${user._id} | email: ${email}`);

    // ── Generar JWT ───────────────────────────────────────────────────────
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // ── Enviar email de verificación (background) ─────────────────────────
    console.log(`📤 Iniciando envío de email a: ${email}`);

    sendEmail(
      email,
      '🔐 Código de verificación — Offerton',
      `Tu código de verificación es: ${code}. Válido por 10 minutos.`,
      verificationEmailHTML(code, name)
    )
      .then(() => {
        console.log(`✅ Email de verificación enviado correctamente a: ${email}`);
      })
      .catch(err => {
        console.error(`❌ FALLO al enviar email de verificación`);
        console.error(`   Destinatario : ${email}`);
        console.error(`   Error código : ${err.code        || 'N/A'}`);
        console.error(`   Error mensaje: ${err.message     || 'N/A'}`);
        console.error(`   SMTP response: ${err.response    || 'N/A'}`);
        console.error(`   SMTP command : ${err.command     || 'N/A'}`);
        console.error(`   Stack        :`, err.stack);
      });

    // ── Respuesta al cliente ──────────────────────────────────────────────
    res.status(201).json({
      message: 'Usuario registrado. Verificá tu email.',
      token,
      user: {
        _id:        user._id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        isVerified: user.isVerified,
      },
    });

    console.log(`🎉 Registro completado exitosamente para: ${email}`);

  } catch (err) {
    console.error('❌ Error inesperado en register:');
    console.error('   Mensaje:', err.message);
    console.error('   Stack:',   err.stack);
    res.status(500).json({ message: 'Error servidor' });
  }
};
// ── VERIFY ────────────────────────────────────────────────────────────────
exports.verifyUser = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user)          return res.status(400).json({ message: 'Usuario no encontrado' });
    if (user.isVerified) return res.status(400).json({ message: 'Usuario ya verificado' });

    if (user.verificationCode !== code || user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    user.isVerified              = true;
    user.verificationCode        = null;
    user.verificationCodeExpires = null;
    await user.save();

    res.json({ message: 'Cuenta verificada correctamente' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error servidor' });
  }
};

// ── RESEND CODE ───────────────────────────────────────────────────────────
exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)           return res.status(400).json({ message: 'Usuario no encontrado' });
    if (user.isVerified)  return res.status(400).json({ message: 'Usuario ya verificado' });

    const newCode    = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpires = Date.now() + 10 * 60 * 1000;

    user.verificationCode        = newCode;
    user.verificationCodeExpires = newExpires;
    await user.save();

    sendEmail(
      email,
      '🔄 Nuevo código de verificación — Offerton',
      `Tu nuevo código es: ${newCode}. Válido por 10 minutos.`,
      resendEmailHTML(newCode, user.name)
    ).catch(err => console.error('Error reenviando código:', err));

    res.json({ message: 'Nuevo código enviado correctamente' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error servidor' });
  }
};

