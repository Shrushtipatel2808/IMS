const mongoose = require("mongoose");

const receiptProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema({
  supplierName: {
    type: String,
    required: [true, "Supplier name is required"],
    trim: true,
    maxlength: 100,
  },
  products: {
    type: [receiptProductSchema],
    validate: {
      validator: (arr) => arr.length > 0,
      message: "At least one product is required",
    },
  },
  status: {
    type: String,
    enum: {
      values: ["Draft", "Waiting", "Done"],
      message: "{VALUE} is not a valid status",
    },
    default: "Draft",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Receipt", receiptSchema);
