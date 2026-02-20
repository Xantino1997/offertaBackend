// socket/index.js  ─── Configuración de Socket.io ─────────────────────────────
const { Server }  = require('socket.io');
const jwt         = require('jsonwebtoken');

/**
 * initSocket(httpServer)
 * Llama esto desde tu server.js / app.js después de crear el servidor HTTP.
 * Devuelve la instancia `io` para pasarla a Express con app.set('io', io).
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
      methods:     ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Middleware de autenticación ─────────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded._id || decoded.userId;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  // ── Conexión ────────────────────────────────────────────────────────────
  io.on('connection', socket => {
    const uid = socket.userId;

    // Cada usuario entra a su sala privada "user_<id>"
    // Las rutas del backend emiten a estas salas al enviar mensajes
    socket.join(`user_${uid}`);
    console.log(`[WS] Usuario conectado: ${uid}`);

    // Evento que el cliente emite cuando abre una conv y lee los mensajes
    socket.on('read_messages', ({ conversationId }) => {
      // El backend REST ya actualiza la BD; aquí solo emitimos el ACK
      // a los otros participantes (ya lo hace la ruta POST /read,
      // pero lo dejamos por si el cliente lo dispara directamente)
      socket.broadcast.emit('messages_read', { conversationId });
    });

    // Typing indicator (opcional, gratis con WS)
    socket.on('typing', ({ conversationId }) => {
      socket.broadcast.to(`conv_${conversationId}`).emit('typing', { userId: uid, conversationId });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.broadcast.to(`conv_${conversationId}`).emit('stop_typing', { userId: uid, conversationId });
    });

    // El cliente puede suscribirse a una sala de conv para futuros features
    socket.on('join_conv', ({ conversationId }) => {
      socket.join(`conv_${conversationId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WS] Usuario desconectado: ${uid}`);
    });
  });

  return io;
}

module.exports = { initSocket };