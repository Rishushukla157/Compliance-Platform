const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [
    {
      label: { type: String, required: true },
      text: { type: String, required: true },
      weight: { type: Number, required: true },
    },
  ],
  complianceName: { type: String, required: true, index: true },
  weight: { type: Number, required: true },
  userType: { type: String, enum: ['user', 'company', 'both'], default: 'user', index: true },
  isActive: { type: Boolean, default: true, index: true },
  responses: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt on save
questionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Question', questionSchema);