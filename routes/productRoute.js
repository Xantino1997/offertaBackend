// routes/productRoute.js
const express = require("express");
const router  = express.Router();
const upload  = require("../middleware/upload");
const auth    = require("../middleware/authMiddleware");
const {
  getMyProducts, createProduct, updateProduct, deleteProduct,
  getPublicProducts, getRandomProducts, getFeaturedBusinesses, getPublicStats,
} = require("../authController/productController");

// ── Públicas (sin auth) ───────────────────────────
router.get("/public-stats",          getPublicStats);
router.get("/random",                getRandomProducts);
router.get("/featured-businesses",   getFeaturedBusinesses);
router.get("/",                      getPublicProducts);

// ── Privadas (auth requerido) ─────────────────────
router.get("/my-products",           auth, getMyProducts);
router.post("/",                     auth, upload.single("image"), createProduct);
router.put("/:id",                   auth, upload.single("image"), updateProduct);
router.delete("/:id",                auth, deleteProduct);

module.exports = router;