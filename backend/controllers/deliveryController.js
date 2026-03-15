const mongoose = require("mongoose");
const Delivery = require("../models/Delivery");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");

// ─── create delivery ────────────────────────────────────────────────────────
exports.createDelivery = async (req, res) => {
  try {
    const { customerName, products, status } = req.body;

    if (!customerName || !products || products.length === 0) {
      return res
        .status(400)
        .json({ message: "Customer name and at least one product are required" });
    }

    // Verify every referenced product exists
    const productIds = products.map((p) => p.productId);
    const existing = await Product.find({ _id: { $in: productIds } }).select("_id");
    const existingIds = new Set(existing.map((p) => p._id.toString()));

    const missing = productIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      return res
        .status(404)
        .json({ message: `Products not found: ${missing.join(", ")}` });
    }

    const delivery = await Delivery.create({
      customerName,
      products,
      status: status || "Draft",
    });

    res.status(201).json({ message: "Delivery order created", delivery });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    console.error("Create delivery error:", error);
    res.status(500).json({ message: "Server error while creating delivery" });
  }
};

// ─── get deliveries ─────────────────────────────────────────────────────────
exports.getDeliveries = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [deliveries, total] = await Promise.all([
      Delivery.find(filter)
        .populate("products.productId", "name sku unit stock")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Delivery.countDocuments(filter),
    ]);

    res.status(200).json({
      deliveries,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Get deliveries error:", error);
    res.status(500).json({ message: "Server error while fetching deliveries" });
  }
};

// ─── get single delivery ─────────────────────────────────────────────────────
exports.getDeliveryById = async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await Delivery.findById(id)
      .populate("products.productId", "name sku unit category");
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });
    res.status(200).json({ delivery });
  } catch (error) {
    console.error("Get delivery by id error:", error);
    res.status(500).json({ message: "Server error while fetching delivery" });
  }
};

// ─── validate delivery (approve & deduct stock) ────────────────────────────
exports.validateDelivery = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const delivery = await Delivery.findById(id).session(session);
    if (!delivery) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Delivery order not found" });
    }

    if (delivery.status === "Done") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Delivery is already validated" });
    }

    // 1. Check stock availability for every line item
    const productIds = delivery.products.map((p) => p.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);

    const stockMap = new Map(products.map((p) => [p._id.toString(), p]));
    const insufficient = [];

    for (const item of delivery.products) {
      const product = stockMap.get(item.productId.toString());
      if (!product) {
        insufficient.push({ id: item.productId, reason: "not found" });
        continue;
      }
      if (product.stock < item.quantity) {
        insufficient.push({
          sku: product.sku,
          name: product.name,
          available: product.stock,
          requested: item.quantity,
        });
      }
    }

    if (insufficient.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Insufficient stock for one or more products",
        details: insufficient,
      });
    }

    // 2. Decrease stock for each product
    const bulkOps = delivery.products.map((item) => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { stock: -item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps, { session });

    // 3. Log each movement in the StockMovement ledger
    const movements = delivery.products.map((item) => ({
      product: item.productId,
      type: "OUT",
      quantity: item.quantity,
      reference: "Delivery",
      referenceId: delivery._id,
      note: `Delivery to ${delivery.customerName}`,
    }));
    await StockMovement.insertMany(movements, { session });

    // 4. Mark delivery as Done
    delivery.status = "Done";
    await delivery.save({ session });

    await session.commitTransaction();

    res.status(200).json({ message: "Delivery validated — stock deducted", delivery });
  } catch (error) {
    await session.abortTransaction();
    console.error("Validate delivery error:", error);
    res.status(500).json({ message: "Server error while validating delivery" });
  } finally {
    session.endSession();
  }
};
