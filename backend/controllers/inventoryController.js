const mongoose = require("mongoose");
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");
const StockMovement = require("../models/StockMovement");

const buildRefObjectId = () => new mongoose.Types.ObjectId();

exports.transferStock = async (req, res) => {
  try {
    const {
      productId,
      quantity,
      fromWarehouseId,
      toWarehouseId,
      fromRack,
      toRack,
      note,
    } = req.body;

    const qty = Number(quantity);
    if (!productId || !qty || qty <= 0) {
      return res.status(400).json({ message: "Product and valid quantity are required" });
    }

    if (!toWarehouseId && !(toRack || "").trim()) {
      return res.status(400).json({ message: "Target warehouse or rack is required" });
    }

    if (fromWarehouseId && toWarehouseId && fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ message: "Source and target warehouse cannot be same" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < qty) {
      return res.status(400).json({ message: `Insufficient stock. Available: ${product.stock}` });
    }

    if (toWarehouseId) {
      const targetWarehouse = await Warehouse.findById(toWarehouseId);
      if (!targetWarehouse) {
        return res.status(404).json({ message: "Target warehouse not found" });
      }
      product.warehouse = targetWarehouse._id;
    }

    if (typeof toRack === "string") {
      product.rack = toRack.trim();
    }

    await product.save();

    const transferRef = buildRefObjectId();
    const fromText = fromWarehouseId ? `warehouse:${fromWarehouseId}` : (fromRack ? `rack:${fromRack}` : "current location");
    const toText = toWarehouseId ? `warehouse:${toWarehouseId}` : (toRack ? `rack:${toRack}` : "target location");

    await StockMovement.insertMany(
      [
        {
          product: product._id,
          type: "OUT",
          quantity: qty,
          reference: "Transfer",
          referenceId: transferRef,
          note: `Transfer out ${fromText} -> ${toText}${note ? ` | ${note}` : ""}`,
        },
        {
          product: product._id,
          type: "IN",
          quantity: qty,
          reference: "Transfer",
          referenceId: transferRef,
          note: `Transfer in ${fromText} -> ${toText}${note ? ` | ${note}` : ""}`,
        },
      ],
      {}
    );

    res.status(200).json({
      message: "Transfer logged successfully",
      transfer: {
        id: transferRef,
        productId: product._id,
        quantity: qty,
        fromWarehouseId: fromWarehouseId || null,
        toWarehouseId: toWarehouseId || null,
        fromRack: fromRack || "",
        toRack: toRack || "",
        note: note || "",
      },
    });
  } catch (error) {
    console.error("Transfer stock error:", error);
    res.status(500).json({ message: "Server error while transferring stock" });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const { productId, actualStock, reason, note } = req.body;

    if (!productId || actualStock === undefined || actualStock === null) {
      return res.status(400).json({ message: "Product and actualStock are required" });
    }

    const actual = Number(actualStock);
    if (Number.isNaN(actual) || actual < 0) {
      return res.status(400).json({ message: "actualStock must be a non-negative number" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const previous = product.stock;
    const delta = actual - previous;

    if (delta === 0) {
      return res.status(200).json({
        message: "No adjustment needed. System stock already matches actual stock",
        product,
      });
    }

    product.stock = actual;
    await product.save();

    await StockMovement.create(
      [
        {
          product: product._id,
          type: delta > 0 ? "IN" : "OUT",
          quantity: Math.abs(delta),
          reference: "Adjustment",
          referenceId: buildRefObjectId(),
          note: `Adjustment ${previous} -> ${actual}${reason ? ` | reason: ${reason}` : ""}${note ? ` | ${note}` : ""}`,
        },
      ],
      {}
    );

    res.status(200).json({
      message: "Stock adjusted successfully",
      adjustment: {
        productId: product._id,
        previous,
        actual,
        delta,
        reason: reason || "",
        note: note || "",
      },
      product,
    });
  } catch (error) {
    console.error("Adjust stock error:", error);
    res.status(500).json({ message: "Server error while adjusting stock" });
  }
};

exports.getStockMovements = async (req, res) => {
  try {
    const { productId, reference, type, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (productId) filter.product = productId;
    if (reference) filter.reference = reference;
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [movements, total] = await Promise.all([
      StockMovement.find(filter)
        .populate("product", "name sku category unit stock warehouse rack")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StockMovement.countDocuments(filter),
    ]);

    res.status(200).json({
      movements,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Get stock movements error:", error);
    res.status(500).json({ message: "Server error while fetching movement history" });
  }
};

