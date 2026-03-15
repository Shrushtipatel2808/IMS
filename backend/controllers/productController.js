const Product = require("../models/Product");

// ─── create product ─────────────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const { name, sku, category, unit, stock, warehouse } = req.body;

    if (!name || !sku || !category) {
      return res.status(400).json({ message: "Name, SKU, and category are required" });
    }

    const existing = await Product.findOne({ sku: sku.toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: `Product with SKU "${sku}" already exists` });
    }

    const product = await Product.create({
      name,
      sku: sku.toUpperCase(),
      category,
      unit,
      stock: stock ?? 0,
      warehouse: warehouse || null,
    });

    res.status(201).json({ message: "Product created", product });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    console.error("Create product error:", error);
    res.status(500).json({ message: "Server error while creating product" });
  }
};

// ─── get products (with search & filter) ────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;

    const filter = {};

    // SKU or name search
    if (search) {
      filter.$or = [
        { sku: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("warehouse", "name location")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Server error while fetching products" });
  }
};

// ─── update product ─────────────────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If SKU is being changed, enforce uppercase + uniqueness
    if (updates.sku) {
      updates.sku = updates.sku.toUpperCase();
      const duplicate = await Product.findOne({ sku: updates.sku, _id: { $ne: id } });
      if (duplicate) {
        return res.status(409).json({ message: `SKU "${updates.sku}" is already in use` });
      }
    }

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product updated", product });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    console.error("Update product error:", error);
    res.status(500).json({ message: "Server error while updating product" });
  }
};

// ─── delete product ─────────────────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted", product });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error while deleting product" });
  }
};
