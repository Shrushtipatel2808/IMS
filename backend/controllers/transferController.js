const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");
const StockMovement = require("../models/StockMovement");
const TransferLog = require("../models/TransferLog");

const LOW_STOCK_THRESHOLD = 20;
const HIGH_STOCK_THRESHOLD = 120;

const buildRisk = ({ qty, currentStock, fromWarehouse, toWarehouse }) => {
  if (qty > currentStock * 0.7) {
    return {
      level: "HIGH",
      message: "High risk: transfer quantity is more than 70% of current stock.",
    };
  }

  if (fromWarehouse && toWarehouse && String(fromWarehouse) === String(toWarehouse)) {
    return {
      level: "HIGH",
      message: "High risk: source and destination warehouse are identical.",
    };
  }

  if (qty > currentStock * 0.4) {
    return {
      level: "MEDIUM",
      message: "Medium risk: transfer quantity is a large chunk of available stock.",
    };
  }

  return {
    level: "LOW",
    message: "Low risk transfer.",
  };
};

exports.createTransfer = async (req, res) => {
  try {
    const { productId, fromWarehouse, toWarehouse, quantity, note } = req.body;
    const qty = Number(quantity);

    if (!productId || !fromWarehouse || !toWarehouse || !qty || qty <= 0) {
      return res.status(400).json({
        message: "productId, fromWarehouse, toWarehouse and valid quantity are required",
      });
    }

    if (String(fromWarehouse) === String(toWarehouse)) {
      return res.status(400).json({ message: "Source and destination warehouse must be different" });
    }

    const [product, fromWh, toWh] = await Promise.all([
      Product.findById(productId),
      Warehouse.findById(fromWarehouse),
      Warehouse.findById(toWarehouse),
    ]);

    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!fromWh) return res.status(404).json({ message: "Source warehouse not found" });
    if (!toWh) return res.status(404).json({ message: "Destination warehouse not found" });

    if (product.stock < qty) {
      return res.status(400).json({ message: `Insufficient stock. Available: ${product.stock}` });
    }

    // Existing data model has stock on product level. Keep total stock stable and update location.
    product.warehouse = toWh._id;
    await product.save();

    const log = await TransferLog.create({
      productId: product._id,
      fromWarehouse: fromWh._id,
      toWarehouse: toWh._id,
      quantity: qty,
      note: note || "",
    });

    await StockMovement.insertMany([
      {
        product: product._id,
        type: "OUT",
        quantity: qty,
        reference: "Transfer",
        referenceId: log._id,
        note: `Transfer OUT ${fromWh.name} -> ${toWh.name}${note ? ` | ${note}` : ""}`,
      },
      {
        product: product._id,
        type: "IN",
        quantity: qty,
        reference: "Transfer",
        referenceId: log._id,
        note: `Transfer IN ${fromWh.name} -> ${toWh.name}${note ? ` | ${note}` : ""}`,
      },
    ]);

    const impactPreview = {
      before: { stock: product.stock, warehouse: fromWh.name },
      after: { stock: product.stock, warehouse: toWh.name },
      stockDelta: 0,
      transferQty: qty,
    };

    const risk = buildRisk({
      qty,
      currentStock: product.stock,
      fromWarehouse: fromWh._id,
      toWarehouse: toWh._id,
    });

    return res.status(201).json({
      message: "Transfer created successfully",
      transfer: log,
      impactPreview,
      risk,
    });
  } catch (error) {
    console.error("Create transfer error:", error);
    return res.status(500).json({ message: "Server error while creating transfer" });
  }
};

exports.getRecentTransfers = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const transfers = await TransferLog.find({})
      .populate("productId", "name sku category unit stock")
      .populate("fromWarehouse", "name location")
      .populate("toWarehouse", "name location")
      .sort({ timestamp: -1 })
      .limit(limit);

    return res.status(200).json({ transfers });
  } catch (error) {
    console.error("Get recent transfers error:", error);
    return res.status(500).json({ message: "Server error while fetching recent transfers" });
  }
};

exports.getTransferRecommendations = async (_req, res) => {
  try {
    const products = await Product.find({}).populate("warehouse", "name location");
    const warehouses = await Warehouse.find({});

    // Aggregate product stock by warehouse from current product snapshot model
    const stockByWarehouse = warehouses.reduce((acc, w) => {
      acc[w._id.toString()] = { warehouse: w, totalStock: 0 };
      return acc;
    }, {});

    products.forEach((p) => {
      const key = p.warehouse ? p.warehouse._id.toString() : null;
      if (key && stockByWarehouse[key]) {
        stockByWarehouse[key].totalStock += Number(p.stock || 0);
      }
    });

    const lowWarehouses = Object.values(stockByWarehouse)
      .filter((x) => x.totalStock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.totalStock - b.totalStock);
    const highWarehouses = Object.values(stockByWarehouse)
      .filter((x) => x.totalStock >= HIGH_STOCK_THRESHOLD)
      .sort((a, b) => b.totalStock - a.totalStock);

    const recommendations = [];

    lowWarehouses.forEach((low) => {
      const donor = highWarehouses[0];
      if (!donor || String(donor.warehouse._id) === String(low.warehouse._id)) return;

      const candidateProducts = products
        .filter((p) => p.warehouse && String(p.warehouse._id) === String(donor.warehouse._id) && p.stock > 0)
        .sort((a, b) => b.stock - a.stock);

      const bestProduct = candidateProducts[0];
      if (!bestProduct) return;

      const suggestedQty = Math.max(1, Math.floor(bestProduct.stock * 0.2));
      recommendations.push({
        productId: bestProduct._id,
        productName: bestProduct.name,
        sku: bestProduct.sku,
        fromWarehouse: donor.warehouse,
        toWarehouse: low.warehouse,
        quantity: suggestedQty,
        reason: `Low stock in ${low.warehouse.name} and high stock in ${donor.warehouse.name}`,
      });
    });

    return res.status(200).json({
      recommendations,
      thresholds: {
        low: LOW_STOCK_THRESHOLD,
        high: HIGH_STOCK_THRESHOLD,
      },
      warehouseStock: Object.values(stockByWarehouse).map((x) => ({
        warehouseId: x.warehouse._id,
        name: x.warehouse.name,
        location: x.warehouse.location,
        totalStock: x.totalStock,
        zone:
          x.totalStock <= LOW_STOCK_THRESHOLD
            ? "LOW"
            : x.totalStock >= HIGH_STOCK_THRESHOLD
            ? "HIGH"
            : "MEDIUM",
      })),
    });
  } catch (error) {
    console.error("Get transfer recommendations error:", error);
    return res.status(500).json({ message: "Server error while generating recommendations" });
  }
};

