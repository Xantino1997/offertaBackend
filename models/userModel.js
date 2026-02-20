// models/userModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['user', 'seller', 'admin'], default: 'user' },
  avatar: { type: String, default: '/assets/offerton.jpg' },
  avatarPublicId: String,
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  verificationCode: String,
  verified: { type: Boolean, default: false },
  purchases: { type: Number, default: 0 },
  favorites:           [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  followingBusinesses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Business' }], // ← NUEVO
  favoriteBusinesses:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Business' }], // ← NUEVO
  ratedBusinesses: [{                                                                // ← NUEVO
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
    rating: Number,
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);