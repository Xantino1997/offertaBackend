require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const http     = require('http');
const path     = require('path');
const connectDB = require('./config/db');

const authRoutes    = require('./routes/authRoute');
const userRoutes    = require('./routes/userRoute');
const busiRoutes    = require('./routes/businessRoute');
const productRoutes = require('./routes/productRoute');
const adminRoutes   = require('./routes/adminRoute');
const cartRoutes    = require('./routes/cartRoute');
const orderRoutes   = require('./routes/orderRoute');
const chatRoutes    = require('./routes/chatRoute');

const { startAbandonedCartJob } = require('./jobs/abandonedCartEmail');
const { initSocket }            = require('./socket');

startAbandonedCartJob();

const app = express();
connectDB();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hola! El servidor está vivo 👍');
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',     authRoutes);
app.use('/api/user',     userRoutes);
app.use('/api/business', busiRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/chat',     chatRoutes);

const httpServer = http.createServer(app);
const io         = initSocket(httpServer);
app.set('io', io);

// ✅ CAMBIO CLAVE: usar el puerto dinámico
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
