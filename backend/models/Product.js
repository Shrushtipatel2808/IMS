const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    maxlength: 100,
  },
  sku: {
    type: String,
    required: [true, "SKU is required"],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9-]+$/, "SKU may only contain letters, numbers, and hyphens"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    trim: true,
    enum: {
      values: [
        "Electronics",
        "Furniture",
        "Clothing",
        "Food & Beverage",
        "Raw Materials",
        "Office Supplies",
        "Tools",
        "Other",
      ],
      message: "{VALUE} is not a supported category",
    },
  },
  unit: {
    type: String,
    required: [true, "Unit is required"],
    trim: true,
    enum: {
      values: ["pcs", "kg", "litre", "box", "pack", "metre", "unit"],
      message: "{VALUE} is not a supported unit",
    },
    default: "pcs",
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, "Stock cannot be negative"],
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    default: null,
  },
  rack: {
    type: String,
    trim: true,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast SKU lookups and category filtering
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });

module.exports = mongoose.model("Product", productSchema);
