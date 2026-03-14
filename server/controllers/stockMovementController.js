const StockMovement = require("../models/StockMovement");
const Product = require("../models/Product");

exports.getMovements = async (req, res) => {
  try {
    const movements = await StockMovement.find()
      .populate("product", "name sku")
      .populate("warehouse", "name location")
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMovement = async (req, res) => {
  try {
    const movement = await StockMovement.findById(req.params.id)
      .populate("product", "name sku")
      .populate("warehouse", "name location")
      .populate("performedBy", "name email");

    if (!movement) {
      return res.status(404).json({ message: "Stock movement not found" });
    }

    res.json(movement);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.createMovement = async (req, res) => {
  try {
    const { product: productId, type, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (type === "out" && product.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    if (type === "in") {
      product.quantity += quantity;
    } else if (type === "out") {
      product.quantity -= quantity;
    }

    await product.save();

    const movement = await StockMovement.create({
      ...req.body,
      performedBy: req.user.id,
    });

    res.status(201).json(movement);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
