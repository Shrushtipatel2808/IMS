const mongoose = require("mongoose");
const Receipt = require("../models/Receipt");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");

// ─── create receipt ─────────────────────────────────────────────────────────
exports.createReceipt = async (req, res) => {
  try {
    const { supplierName, products, status } = req.body;

    if (!supplierName || !products || products.length === 0) {
      return res
        .status(400)
        .json({ message: "Supplier name and at least one product are required" });
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

    const receipt = await Receipt.create({
      supplierName,
      products,
      status: status || "Draft",
    });

    res.status(201).json({ message: "Receipt created", receipt });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    console.error("Create receipt error:", error);
    res.status(500).json({ message: "Server error while creating receipt" });
  }
};

// ─── get receipts ───────────────────────────────────────────────────────────
exports.getReceipts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .populate("products.productId", "name sku unit")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Receipt.countDocuments(filter),
    ]);

    res.status(200).json({
      receipts,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Get receipts error:", error);
    res.status(500).json({ message: "Server error while fetching receipts" });
  }
};

// ─── get single receipt by id ────────────────────────────────────────────────
exports.getReceiptById = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findById(id)
      .populate("products.productId", "name sku unit category");
    if (!receipt) return res.status(404).json({ message: "Receipt not found" });
    res.status(200).json({ receipt });
  } catch (error) {
    console.error("Get receipt by id error:", error);
    res.status(500).json({ message: "Server error while fetching receipt" });
  }
};


exports.validateReceipt = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const receipt = await Receipt.findById(id).session(session);
    if (!receipt) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Receipt not found" });
    }

    if (receipt.status === "Done") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Receipt is already validated" });
    }

    // 1. Increase stock for each product
    const bulkOps = receipt.products.map((item) => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { stock: item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps, { session });

    // 2. Log each movement in the StockMovement ledger
    const movements = receipt.products.map((item) => ({
      product: item.productId,
      type: "IN",
      quantity: item.quantity,
      reference: "Receipt",
      referenceId: receipt._id,
      note: `Receipt from ${receipt.supplierName}`,
    }));
    await StockMovement.insertMany(movements, { session });

    // 3. Mark receipt as Done
    receipt.status = "Done";
    await receipt.save({ session });

    await session.commitTransaction();

    res.status(200).json({ message: "Receipt validated — stock updated", receipt });
  } catch (error) {
    await session.abortTransaction();
    console.error("Validate receipt error:", error);
    res.status(500).json({ message: "Server error while validating receipt" });
  } finally {
    session.endSession();
  }
};
