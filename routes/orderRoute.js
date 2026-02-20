// routes/orders.js
const express = require("express");
const router  = express.Router();
const Order   = require("../models/orderModel");
const auth    = require("../middleware/authMiddleware");

// GET /api/orders/my — historial de compras del usuario
router.get("/my", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = orders.map(o => ({
      _id:    o._id,
      date:   o.date || o.createdAt,
      total:  o.total,
      status: o.status,
      items:  o.items.map(i => ({
        name:     i.name,
        quantity: i.quantity,
        price:    i.price,
      })),
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener pedidos" });
  }
});

module.exports = router;