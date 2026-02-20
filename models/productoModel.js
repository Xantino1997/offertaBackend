// models/productoModel.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    discount: { type: Number, default: 0, min: 0, max: 100 }, // % de descuento
    category: String,
    stock: { type: Number, default: 10 },
    image: String,
    imagePublicId: String,
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
    },
  },
  { timestamps: true }
);

// Virtual: precio final con descuento aplicado
productSchema.virtual("finalPrice").get(function () {
  if (!this.discount) return this.price;
  return parseFloat((this.price * (1 - this.discount / 100)).toFixed(2));
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);