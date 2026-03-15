const mongoose = require("mongoose");

const deliveryProductSchema = new mongoose.Schema(
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

const deliverySchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, "Customer name is required"],
    trim: true,
    maxlength: 100,
  },
  products: {
    type: [deliveryProductSchema],
    validate: {
      validator: (arr) => arr.length > 0,
      message: "At least one product is required",
    },
  },
  status: {
    type: String,
    enum: {
      values: ["Draft", "Picking", "Packed", "Done"],
      message: "{VALUE} is not a valid delivery status",
    },
    default: "Draft",
  },
  priority: {
    type: String,
    enum: ["Normal", "Urgent", "Express"],
    default: "Normal",
  },
  expectedDate: { type: Date },
  notes: { type: String, maxlength: 500 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Delivery", deliverySchema);
