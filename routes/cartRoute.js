// routes/cart.js
// Carrito persistido en MongoDB. Incluye: agregar, actualizar, eliminar, checkout.

const express = require("express");
const router  = express.Router();
const Cart    = require("../models/cartModel");
const Product = require("../models/productoModel");
const auth    = require("../middleware/authMiddleware"); // verifica JWT

// ─── GET /api/cart ─────────────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product", "name price originalPrice discount image stock business")
      .populate("items.product.business", "name city logo");

    if (!cart) return res.json({ items: [] });

    // Formatear items para el frontend
    const items = cart.items.map(i => ({
      _id:          i._id,
      productId:    i.product._id,
      name:         i.product.name,
      price:        i.product.price,
      originalPrice: i.product.originalPrice,
      discount:     i.product.discount,
      image:        i.product.image,
      businessId:   i.product.business?._id,
      businessName: i.product.business?.name,
      stock:        i.product.stock || 99,
      quantity:     i.quantity,
    }));

    res.json({ items, updatedAt: cart.updatedAt });
  } catch (err) {
    res.status(500).json({ message: "Error al obtener el carrito" });
  }
});

// ─── POST /api/cart/add ───────────────────────────────────────────────────
router.post("/add", auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });

    const existing = cart.items.find(i => i.product.toString() === productId);
    if (existing) {
      existing.quantity = Math.min(product.stock || 99, existing.quantity + quantity);
    } else {
      cart.items.push({ product: productId, quantity });
    }

    cart.updatedAt = new Date();
    await cart.save();

    // Poblar y devolver
    await cart.populate("items.product", "name price originalPrice discount image stock business");
    const items = cart.items.map(i => ({
      _id:          i._id,
      productId:    i.product._id,
      name:         i.product.name,
      price:        i.product.price,
      originalPrice: i.product.originalPrice,
      discount:     i.product.discount,
      image:        i.product.image,
      stock:        i.product.stock || 99,
      quantity:     i.quantity,
    }));

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: "Error al agregar al carrito" });
  }
});

// ─── PUT /api/cart/update ─────────────────────────────────────────────────
router.put("/update", auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (quantity < 1) return res.status(400).json({ message: "Cantidad inválida" });

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Carrito no encontrado" });

    const item = cart.items.find(i => i.product.toString() === productId);
    if (!item) return res.status(404).json({ message: "Producto no está en el carrito" });

    const product = await Product.findById(productId);
    item.quantity = Math.min(product?.stock || 99, quantity);
    cart.updatedAt = new Date();
    await cart.save();

    await cart.populate("items.product", "name price originalPrice discount image stock business");
    const items = cart.items.map(i => ({
      _id:          i._id,
      productId:    i.product._id,
      name:         i.product.name,
      price:        i.product.price,
      originalPrice: i.product.originalPrice,
      discount:     i.product.discount,
      image:        i.product.image,
      stock:        i.product.stock || 99,
      quantity:     i.quantity,
    }));

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar el carrito" });
  }
});

// ─── DELETE /api/cart/remove/:productId ──────────────────────────────────
router.delete("/remove/:productId", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Carrito no encontrado" });

    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    cart.updatedAt = new Date();
    await cart.save();

    await cart.populate("items.product", "name price originalPrice discount image stock");
    const items = cart.items.map(i => ({
      _id:          i._id,
      productId:    i.product._id,
      name:         i.product.name,
      price:        i.product.price,
      originalPrice: i.product.originalPrice,
      discount:     i.product.discount,
      image:        i.product.image,
      stock:        i.product.stock || 99,
      quantity:     i.quantity,
    }));

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar del carrito" });
  }
});

// ─── DELETE /api/cart/clear ───────────────────────────────────────────────
router.delete("/clear", auth, async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], updatedAt: new Date() }
    );
    res.json({ items: [] });
  } catch (err) {
    res.status(500).json({ message: "Error al vaciar el carrito" });
  }
});

// ─── POST /api/cart/checkout ──────────────────────────────────────────────
router.post("/checkout", auth, async (req, res) => {
  try {
    const Order = require("../models/orderModel");
    const User  = require("../models/userModel");

    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product", "name price discount business");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "El carrito está vacío" });
    }

    const items = cart.items.map(i => ({
      product: i.product._id,
      name:    i.product.name,
      price:   i.product.discount
        ? i.product.price * (1 - i.product.discount / 100)
        : i.product.price,
      quantity: i.quantity,
    }));

    const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

    const order = new Order({
      user:   req.user.id,
      items,
      total,
      status: "pending",
      date:   new Date(),
    });

    await order.save();

    // Limpiar carrito
    cart.items     = [];
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ success: true, orderId: order._id, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al procesar el pedido" });
  }
});

module.exports = router;