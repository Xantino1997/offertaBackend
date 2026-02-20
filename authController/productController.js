// authController/productController.js
const Product   = require("../models/productoModel");
const Business  = require("../models/businessModel");
const Featured  = require("../models/featuredModel");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const MAX_PRODUCTS = 20;

async function getBusinessId(userId) {
  const business = await Business.findOne({ owner: userId });
  return business ? business._id : null;
}

/* ── PRIVADOS (auth requerido) ───────────────────── */

exports.getMyProducts = async (req, res) => {
  try {
    const businessId = await getBusinessId(req.user.id);
    if (!businessId) return res.json([]);
    const products = await Product.find({ businessId });
    if (products.length === 0) {
      return res.json([{ _id: "mock1", name: "Producto Demo", description: "Este es un producto de ejemplo", price: 99.99, discount: 0, category: "electronica", stock: 10, image: "https://via.placeholder.com/200" }]);
    }
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo productos" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const businessId = await getBusinessId(req.user.id);
    if (!businessId) return res.status(400).json({ message: "Primero creá tu negocio antes de agregar productos" });

    const count = await Product.countDocuments({ businessId });
    if (count >= MAX_PRODUCTS) return res.status(400).json({ message: "Máximo 20 productos permitidos" });

    let imageUrl = null, publicId = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: "products" });
      imageUrl = result.secure_url;
      publicId = result.public_id;
      fs.unlinkSync(req.file.path);
    }

    const discount = Math.min(100, Math.max(0, Number(req.body.discount) || 0));
    const newProduct = await Product.create({
      name: req.body.name, description: req.body.description,
      price: req.body.price, discount, category: req.body.category,
      stock: req.body.stock, businessId, image: imageUrl, imagePublicId: publicId,
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: "Error creando producto" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    if (req.file) {
      if (product.imagePublicId) await cloudinary.uploader.destroy(product.imagePublicId);
      const result = await cloudinary.uploader.upload(req.file.path, { folder: "products" });
      product.image = result.secure_url;
      product.imagePublicId = result.public_id;
      fs.unlinkSync(req.file.path);
    }

    product.name        = req.body.name        ?? product.name;
    product.description = req.body.description ?? product.description;
    product.price       = req.body.price       ?? product.price;
    product.category    = req.body.category    ?? product.category;
    product.stock       = req.body.stock       ?? product.stock;
    product.discount    = Math.min(100, Math.max(0, Number(req.body.discount ?? product.discount)));

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error actualizando producto" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    if (product.imagePublicId) await cloudinary.uploader.destroy(product.imagePublicId);
    await product.deleteOne();
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando producto" });
  }
};

/* ── PÚBLICOS (sin auth) ─────────────────────────── */

exports.getPublicProducts = async (req, res) => {
  try {
    const { businessId, category, search, limit = 20, page = 1 } = req.query;
    const query = {};

    // ── Filtro por tienda (nuevo) ─────────────────
    if (businessId) query.businessId = businessId;

    if (category) query.category = { $regex: category, $options: "i" };
    if (search)   query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate({ path: "businessId", select: "name city logo verified blocked" })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    const visible = products.filter(p => !p.businessId?.blocked).map(p => ({
      ...p.toObject(),
      business: p.businessId, // alias para el frontend
    }));

    res.json({ products: visible, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRandomProducts = async (req, res) => {
  try {
    const { limit = 40 } = req.query;
    const products = await Product.aggregate([
      { $sample: { size: Number(limit) } },
      { $lookup: { from: "businesses", localField: "businessId", foreignField: "_id", as: "business" } },
      { $unwind: { path: "$business", preserveNullAndEmptyArrays: true } },
      { $match: { "business.blocked": { $ne: true } } },
    ]);
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFeaturedBusinesses = async (req, res) => {
  try {
    const now = new Date();
    const featured = await Featured.find({ active: true, endDate: { $gte: now } })
      .populate({
        path: "business",
        select: "name city logo verified blocked rating totalProducts description",
      })
      .sort({ endDate: 1 });

    const visible = featured.filter(f => f.business && !f.business.blocked);
    res.json(visible);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicStats = async (req, res) => {
  try {
    const [totalProducts, totalBusinesses] = await Promise.all([
      Product.countDocuments(),
      Business.countDocuments({ blocked: { $ne: true } }),
    ]);
    res.json({ totalProducts, totalBusinesses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};