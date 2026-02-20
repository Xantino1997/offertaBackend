const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendMail');


// ================== REGISTER ==================
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: 'Email ya registrado' });

    const hashed = await bcrypt.hash(password, 10);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutos

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      verificationCode: code,
      verificationCodeExpires: expires
    });

    await sendEmail(
      email,
      'Código de verificación Offerton',
      `Tu código es: ${code}`
    );

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado. Verifica tu email.',
      token,
      user
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error servidor' });
  }
};


// ================== VERIFY ==================
exports.verifyUser = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "Usuario no encontrado" });

    if (user.isVerified)
      return res.status(400).json({ message: "Usuario ya verificado" });

    if (
      user.verificationCode !== code ||
      user.verificationCodeExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Código inválido o expirado" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;

    await user.save();

    res.json({ message: "Cuenta verificada correctamente" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error servidor" });
  }
};



// ================== RESEND CODE ==================
exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "Usuario no encontrado" });

    if (user.isVerified)
      return res.status(400).json({ message: "Usuario ya verificado" });

    // Generar nuevo código
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpires = Date.now() + 10 * 60 * 1000; // 10 minutos

    user.verificationCode = newCode;
    user.verificationCodeExpires = newExpires;

    await user.save();

    await sendEmail(
      email,
      "Nuevo código de verificación Offerton",
      `Tu nuevo código es: ${newCode}`
    );

    res.json({ message: "Nuevo código enviado correctamente" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error servidor" });
  }
};
