// models/businessModel.js
const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true },
    description:  String,
    city:         String,
    logo:         String,
    logoPublicId: String,
    rating:       { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },   // ← NUEVO: cantidad de votos
    ratingSum:    { type: Number, default: 0 },    // ← NUEVO: suma de votos
    totalProducts:{ type: Number, default: 0 },
    verified:     { type: Boolean, default: false },
    blocked:      { type: Boolean, default: false },
    blockedReason:{ type: String },
    followers:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ← NUEVO
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Business", businessSchema);