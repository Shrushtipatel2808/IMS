const mongoose = require("mongoose");
const Warehouse = require("../models/Warehouse");
const Product = require("../models/Product");
const TransferLog = require("../models/TransferLog");
const StockMovement = require("../models/StockMovement");
const Delivery = require("../models/Delivery");
const Receipt = require("../models/Receipt");

const LOW_STOCK_THRESHOLD = 20;
const HEALTHY_STOCK_THRESHOLD = 25;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const WAREHOUSE_BLUEPRINT = [
  { name: "Blinkit", city: "Delhi", productCount: 32, lowStockCount: 4, lat: 28.6139, lng: 77.209 },
  { name: "Instamart", city: "Pune", productCount: 25, lowStockCount: 3, lat: 18.5204, lng: 73.8567 },
  { name: "Flipkart", city: "Mumbai", productCount: 54, lowStockCount: 2, lat: 19.076, lng: 72.8777 },
  { name: "Amazon", city: "Ahmedabad", productCount: 41, lowStockCount: 5, lat: 23.0225, lng: 72.5714 },
];

const CATEGORY_ROTATION = [
  "Electronics",
  "Furniture",
  "Clothing",
  "Food & Beverage",
  "Raw Materials",
  "Office Supplies",
  "Tools",
  "Other",
];

const UNIT_ROTATION = ["pcs", "box", "pack", "unit", "kg", "metre", "litre"];

const SAMPLE_NAMES = [
  "Steel Bottle",
  "LED Lamp",
  "Storage Crate",
  "Desk Mat",
  "Barcode Scanner",
  "Safety Gloves",
  "Packaging Tape",
  "Router Kit",
  "Carton Roll",
  "Pallet Strap",
  "Warehouse Tag",
  "Monitor Stand",
  "Industrial Cleaner",
  "Cooling Fan",
  "Label Paper",
  "Sensor Unit",
];

const getPseudoCoordinates = (seedText = "") => {
  const seed = String(seedText)
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const baseLat = 22.9734;
  const baseLng = 78.6569;

  return {
    lat: Number((baseLat + ((seed % 140) - 70) * 0.06).toFixed(5)),
    lng: Number((baseLng + (((seed * 7) % 200) - 100) * 0.06).toFixed(5)),
  };
};

const parseLocationToCoordinates = (location, fallbackSeed) => {
  const raw = (location || "").trim();
  if (!raw) return getPseudoCoordinates(fallbackSeed);

  const nums = raw
    .replace(/[a-zA-Z:]/g, " ")
    .split(/[\s,]+/)
    .map((x) => Number(x))
    .filter((x) => !Number.isNaN(x));

  if (nums.length >= 2) {
    const [lat, lng] = nums;
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  }

  return getPseudoCoordinates(`${fallbackSeed}-${raw}`);
};

const shiftedDate = (minutesAgo) => new Date(Date.now() - minutesAgo * 60 * 1000);

const inferWarehouseFromNote = (note = "", warehouseByName = {}) => {
  const text = String(note || "").toLowerCase();
  const hit = Object.values(warehouseByName).find((w) => text.includes(String(w.name).toLowerCase()));
  return hit || null;
};

let demoSeedInFlight = null;

const normalizeWarehouseRegistry = async () => {
  const allWarehouses = await Warehouse.find({}).sort({ createdAt: 1 });
  if (!allWarehouses.length) return;

  for (const cfg of WAREHOUSE_BLUEPRINT) {
    const matches = allWarehouses.filter(
      (w) => String(w.name || "").trim().toLowerCase() === cfg.name.toLowerCase()
    );
    if (!matches.length) continue;

    const primary = matches.find((w) => w.name === cfg.name) || matches[0];
    const expectedLocation = `${cfg.city}, ${cfg.lat}, ${cfg.lng}`;

    const shouldFixName = primary.name !== cfg.name;
    const shouldFixLocation =
      !primary.location || !String(primary.location).toLowerCase().includes(cfg.city.toLowerCase());

    if (shouldFixName || shouldFixLocation) {
      await Warehouse.updateOne(
        { _id: primary._id },
        {
          $set: {
            ...(shouldFixName ? { name: cfg.name } : {}),
            ...(shouldFixLocation ? { location: expectedLocation } : {}),
          },
        }
      );
    }

    const duplicates = matches.filter((w) => String(w._id) !== String(primary._id));
    if (!duplicates.length) continue;

    const duplicateIds = duplicates.map((w) => w._id);

    await Promise.all([
      Product.updateMany(
        { warehouse: { $in: duplicateIds } },
        { $set: { warehouse: primary._id } }
      ),
      TransferLog.updateMany(
        { fromWarehouse: { $in: duplicateIds } },
        { $set: { fromWarehouse: primary._id } }
      ),
      TransferLog.updateMany(
        { toWarehouse: { $in: duplicateIds } },
        { $set: { toWarehouse: primary._id } }
      ),
      Warehouse.deleteMany({ _id: { $in: duplicateIds } }),
    ]);
  }
};

const ensureDemoInventorySeeded = async () => {
  if (demoSeedInFlight) return demoSeedInFlight;

  demoSeedInFlight = (async () => {
  await normalizeWarehouseRegistry();

  const [assignedProductCount, transferCount, movementCount] = await Promise.all([
    Product.countDocuments({ warehouse: { $ne: null } }),
    TransferLog.countDocuments({}),
    StockMovement.countDocuments({}),
  ]);

  // Seed not only for empty DB, but also for "warehouse dashboard empty" states
  // where products exist without warehouse mapping / operational logs.
  if (assignedProductCount >= 40 && transferCount > 0 && movementCount > 0) return;

  const warehouseDocs = [];
  for (const cfg of WAREHOUSE_BLUEPRINT) {
    let warehouse = await Warehouse.findOne({ name: cfg.name });
    if (!warehouse) {
      warehouse = await Warehouse.create({
        name: cfg.name,
        location: `${cfg.city}, ${cfg.lat}, ${cfg.lng}`,
      });
    }
    warehouseDocs.push({ cfg, warehouse });
  }

  const existingProducts = await Product.find({}, "sku warehouse").lean();
  const existingSkuSet = new Set(existingProducts.map((p) => String(p.sku || "").toUpperCase()));
  const maxStlNumber = existingProducts.reduce((max, p) => {
    const m = String(p.sku || "").toUpperCase().match(/^STL-(\d+)$/);
    if (!m) return max;
    return Math.max(max, Number(m[1] || 0));
  }, 0);

  const existingByWarehouse = existingProducts.reduce((acc, p) => {
    const key = p.warehouse ? String(p.warehouse) : null;
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const productsToCreate = [];
  let skuCounter = maxStlNumber + 1;
  warehouseDocs.forEach(({ cfg, warehouse }, whIndex) => {
    const already = existingByWarehouse[String(warehouse._id)] || 0;
    const required = Math.max(0, cfg.productCount - already);

    for (let idx = 0; idx < required; idx += 1) {
      const isLowStock = idx < cfg.lowStockCount;
      const stock = isLowStock
        ? clamp(6 + ((idx + whIndex * 2) % 11), 4, LOW_STOCK_THRESHOLD - 1)
        : 45 + ((idx * 9 + whIndex * 13) % 180);

      let sku = `STL-${String(skuCounter).padStart(3, "0")}`;
      while (existingSkuSet.has(sku)) {
        skuCounter += 1;
        sku = `STL-${String(skuCounter).padStart(3, "0")}`;
      }
      existingSkuSet.add(sku);
      skuCounter += 1;

      productsToCreate.push({
        name: `${SAMPLE_NAMES[idx % SAMPLE_NAMES.length]} ${cfg.city.slice(0, 2).toUpperCase()}-${String(idx + 1).padStart(2, "0")}`,
        sku,
        category: CATEGORY_ROTATION[(idx + whIndex) % CATEGORY_ROTATION.length],
        unit: UNIT_ROTATION[(idx + whIndex) % UNIT_ROTATION.length],
        stock,
        warehouse: warehouse._id,
        rack: `R-${(idx % 6) + 1}`,
        createdAt: shiftedDate(3000 - idx * 3),
      });
    }
  });

  if (productsToCreate.length > 0) {
    await Product.insertMany(productsToCreate, { ordered: false });
  }

  const allProducts = await Product.find({ warehouse: { $ne: null } }, "_id warehouse stock").lean();
  const productsByWarehouse = allProducts.reduce((acc, p) => {
    const key = String(p.warehouse);
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const hasTransferData = transferCount > 0;
  const hasMovementData = movementCount > 0;
  if (hasTransferData && hasMovementData) return;

  // Receipts
  const receipts = [];
  for (const [wIndex, { warehouse }] of warehouseDocs.entries()) {
    const whProducts = productsByWarehouse[String(warehouse._id)] || [];
    if (!whProducts.length) continue;
    for (let i = 0; i < 4; i += 1) {
      const lineA = whProducts[(i * 2) % whProducts.length];
      const lineB = whProducts[(i * 2 + 1) % whProducts.length];
      receipts.push({
        supplierName: `${warehouse.name} Supplies`,
        status: "Done",
        products: [
          { productId: lineA._id, quantity: 10 + ((wIndex + i) % 7) },
          { productId: lineB._id, quantity: 8 + ((wIndex + i * 2) % 6) },
        ],
        createdAt: shiftedDate(1300 - wIndex * 90 - i * 23),
      });
    }
  }
  const createdReceipts = receipts.length ? await Receipt.insertMany(receipts, { ordered: false }) : [];

  // Deliveries with success-rate variance
  const deliveryTargets = {
    Blinkit: { total: 25, done: 24 },
    Instamart: { total: 30, done: 28 },
    Flipkart: { total: 24, done: 23 },
    Amazon: { total: 27, done: 25 },
  };

  const deliveries = [];
  for (const { warehouse } of warehouseDocs) {
    const cfg = deliveryTargets[warehouse.name] || { total: 16, done: 14 };
    const whProducts = productsByWarehouse[String(warehouse._id)] || [];
    if (!whProducts.length) continue;
    for (let i = 0; i < cfg.total; i += 1) {
      const p = whProducts[i % whProducts.length];
      deliveries.push({
        customerName: `${warehouse.name} Customer ${String(i + 1).padStart(2, "0")}`,
        status: i < cfg.done ? "Done" : i % 2 ? "Packed" : "Picking",
        products: [{ productId: p._id, quantity: 2 + (i % 4) }],
        createdAt: shiftedDate(900 - i * 11),
      });
    }
  }
  const createdDeliveries = deliveries.length ? await Delivery.insertMany(deliveries, { ordered: false }) : [];

  // Transfer network
  const warehouseByName = Object.fromEntries(warehouseDocs.map(({ warehouse }) => [warehouse.name, warehouse]));
  const transferTemplate = [
    { source: "Flipkart", target: "Amazon", runs: 20, qtyBase: 11 },
    { source: "Amazon", target: "Blinkit", runs: 10, qtyBase: 9 },
    { source: "Instamart", target: "Blinkit", runs: 8, qtyBase: 7 },
    { source: "Blinkit", target: "Instamart", runs: 6, qtyBase: 6 },
    { source: "Amazon", target: "Instamart", runs: 9, qtyBase: 8 },
  ];

  const transferLogs = [];
  const transferMovements = [];
  transferTemplate.forEach((edge, edgeIndex) => {
    const fromWh = warehouseByName[edge.source];
    const toWh = warehouseByName[edge.target];
    if (!fromWh || !toWh) return;
    const products = productsByWarehouse[String(fromWh._id)] || [];
    if (!products.length) return;

    for (let r = 0; r < edge.runs; r += 1) {
      const product = products[r % products.length];
      const quantity = edge.qtyBase + (r % 4);
      const transferId = new mongoose.Types.ObjectId();
      const timestamp = shiftedDate(480 - edgeIndex * 40 - r * 6);

      transferLogs.push({
        _id: transferId,
        productId: product._id,
        fromWarehouse: fromWh._id,
        toWarehouse: toWh._id,
        quantity,
        note: `Scheduled inter-city transfer ${edge.source} → ${edge.target}`,
        timestamp,
      });

      transferMovements.push(
        {
          product: product._id,
          type: "OUT",
          quantity,
          reference: "Transfer",
          referenceId: transferId,
          note: `Transfer OUT ${edge.source} -> ${edge.target}`,
          createdAt: timestamp,
        },
        {
          product: product._id,
          type: "IN",
          quantity,
          reference: "Transfer",
          referenceId: transferId,
          note: `Transfer IN ${edge.source} -> ${edge.target}`,
          createdAt: timestamp,
        }
      );
    }
  });
  if (transferLogs.length) {
    await TransferLog.insertMany(transferLogs, { ordered: false });
  }

  // Stock movement feed events (receipt/delivery/adjustment)
  const stockEvents = [];
  createdReceipts.slice(0, 12).forEach((receipt, i) => {
    receipt.products.forEach((line, idx) => {
      stockEvents.push({
        product: line.productId,
        type: "IN",
        quantity: line.quantity,
        reference: "Receipt",
        referenceId: receipt._id,
        note: `Received ${line.quantity} units (${idx + 1})`,
        createdAt: shiftedDate(360 - i * 9 - idx),
      });
    });
  });

  createdDeliveries.slice(0, 18).forEach((delivery, i) => {
    delivery.products.forEach((line, idx) => {
      stockEvents.push({
        product: line.productId,
        type: "OUT",
        quantity: line.quantity,
        reference: "Delivery",
        referenceId: delivery._id,
        note: `Delivered ${line.quantity} units (${idx + 1})`,
        createdAt: shiftedDate(300 - i * 7 - idx),
      });
    });
  });

  warehouseDocs.forEach(({ warehouse }, i) => {
    const whProducts = productsByWarehouse[String(warehouse._id)] || [];
    if (!whProducts.length) return;
    const p = whProducts[(i * 5) % whProducts.length];
    const refId = new mongoose.Types.ObjectId();
    stockEvents.push({
      product: p._id,
      type: i % 2 ? "OUT" : "IN",
      quantity: 3 + i,
      reference: "Adjustment",
      referenceId: refId,
      note: `Cycle adjustment at ${warehouse.name}`,
      createdAt: shiftedDate(100 - i * 12),
    });
  });

  const movementRows = [...stockEvents, ...transferMovements];
  if (movementRows.length) {
    await StockMovement.insertMany(movementRows, { ordered: false });
  }
  })()
    .finally(() => {
      demoSeedInFlight = null;
    });

  return demoSeedInFlight;
};

const buildWarehouseDashboardData = async () => {
  const [warehouses, products, transfers, movements, deliveries] = await Promise.all([
    Warehouse.find({}).sort({ createdAt: 1 }),
    Product.find({}).populate("warehouse", "name location"),
    TransferLog.find({})
      .populate("fromWarehouse", "name location")
      .populate("toWarehouse", "name location")
      .sort({ timestamp: -1 }),
    StockMovement.find({ reference: { $in: ["Receipt", "Delivery", "Adjustment", "Transfer"] } })
      .populate({
        path: "product",
        select: "name sku warehouse",
        populate: { path: "warehouse", select: "name location" },
      })
      .sort({ createdAt: -1 })
      .limit(200),
    Delivery.find({})
      .populate("products.productId", "warehouse")
      .sort({ createdAt: -1 }),
  ]);

  const warehouseById = Object.fromEntries(warehouses.map((w) => [String(w._id), w]));
  const warehouseByName = Object.fromEntries(warehouses.map((w) => [w.name, w]));

  const productsByWarehouse = products.reduce((acc, p) => {
    const key = p.warehouse?._id ? String(p.warehouse._id) : null;
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const transferEdgeMap = {};
  const transferStatsByWarehouse = {};
  transfers.forEach((log) => {
    const fromId = log.fromWarehouse?._id ? String(log.fromWarehouse._id) : null;
    const toId = log.toWarehouse?._id ? String(log.toWarehouse._id) : null;
    if (!fromId || !toId) return;

    const edgeKey = `${fromId}->${toId}`;
    if (!transferEdgeMap[edgeKey]) {
      transferEdgeMap[edgeKey] = {
        source: log.fromWarehouse.name,
        target: log.toWarehouse.name,
        sourceId: fromId,
        targetId: toId,
        quantity: 0,
        successfulTransfers: 0,
      };
    }

    transferEdgeMap[edgeKey].quantity += Number(log.quantity || 0);
    transferEdgeMap[edgeKey].successfulTransfers += 1;

    [fromId, toId].forEach((wid) => {
      if (!transferStatsByWarehouse[wid]) transferStatsByWarehouse[wid] = { successful: 0, failed: 0 };
      transferStatsByWarehouse[wid].successful += 1;
    });
  });

  Object.values(transferEdgeMap).forEach((edge) => {
    // Simulated failed attempts based on successful history for demo realism
    const failed = edge.successfulTransfers > 12 ? 1 : edge.successfulTransfers > 20 ? 2 : 0;
    if (!transferStatsByWarehouse[edge.sourceId]) transferStatsByWarehouse[edge.sourceId] = { successful: 0, failed: 0 };
    if (!transferStatsByWarehouse[edge.targetId]) transferStatsByWarehouse[edge.targetId] = { successful: 0, failed: 0 };
    transferStatsByWarehouse[edge.sourceId].failed += failed;
    transferStatsByWarehouse[edge.targetId].failed += failed;
  });

  const deliveryStatsByWarehouse = {};
  deliveries.forEach((d) => {
    const firstProduct = d.products?.[0]?.productId;
    const wid = firstProduct?.warehouse ? String(firstProduct.warehouse) : null;
    if (!wid) return;
    if (!deliveryStatsByWarehouse[wid]) deliveryStatsByWarehouse[wid] = { total: 0, done: 0 };
    deliveryStatsByWarehouse[wid].total += 1;
    if (d.status === "Done") deliveryStatsByWarehouse[wid].done += 1;
  });

  const warehousesView = warehouses.map((w) => {
    const id = String(w._id);
    const whProducts = productsByWarehouse[id] || [];
    const totalProducts = whProducts.length;
    const lowStockItems = whProducts.filter((p) => Number(p.stock || 0) <= LOW_STOCK_THRESHOLD).length;
    const healthyStockItems = whProducts.filter((p) => Number(p.stock || 0) > HEALTHY_STOCK_THRESHOLD).length;
    const totalStock = whProducts.reduce((sum, p) => sum + Number(p.stock || 0), 0);

    const stockHealth = totalProducts ? Math.round((healthyStockItems / totalProducts) * 100) : 0;

    const t = transferStatsByWarehouse[id] || { successful: 0, failed: 0 };
    const transferEfficiency = t.successful + t.failed
      ? Math.round((t.successful / (t.successful + t.failed)) * 100)
      : 0;

    const d = deliveryStatsByWarehouse[id] || { total: 0, done: 0 };
    const deliverySuccessRate = d.total ? Math.round((d.done / d.total) * 100) : 0;

    const city = (w.location || "").split(",")[0]?.trim() || "Unknown";
    const coordinates = parseLocationToCoordinates(w.location, w.name);

    // Hackathon demo behavior: avoid empty zero-state for newly added warehouses
    // by showing projected operational baseline until real stock appears.
    const projectedMode = totalProducts === 0;
    const projectedProducts = projectedMode ? 18 : totalProducts;
    const projectedLowStock = projectedMode ? 2 : lowStockItems;
    const projectedStock = projectedMode ? 860 : totalStock;
    const projectedStockHealth = projectedMode ? 84 : stockHealth;
    const projectedTransferEfficiency = projectedMode ? 88 : transferEfficiency;
    const projectedDeliverySuccess = projectedMode ? 93 : deliverySuccessRate;

    return {
      warehouseId: w._id,
      name: w.name,
      city,
      location: w.location || city,
      coordinates,
      totalProducts: projectedProducts,
      totalStock: projectedStock,
      lowStockItems: projectedLowStock,
      stockHealth: projectedStockHealth,
      transferEfficiency: projectedTransferEfficiency,
      deliverySuccessRate: projectedDeliverySuccess,
      healthyStockItems,
      successfulTransfers: t.successful,
      failedTransfers: t.failed,
      totalTransfers: t.successful + t.failed,
      completedDeliveries: d.done,
      totalDeliveries: d.total,
      projected: projectedMode,
    };
  });

  const transferNetwork = Object.values(transferEdgeMap).map((edge) => ({
    source: edge.source,
    target: edge.target,
    quantity: edge.quantity,
    successfulTransfers: edge.successfulTransfers,
    failedTransfers: edge.successfulTransfers > 12 ? 1 : 0,
  }));

  const insights = [];
  const richest = [...warehousesView].sort((a, b) => b.totalStock - a.totalStock);
  warehousesView.forEach((w) => {
    if (w.stockHealth < 75) {
      const donor = richest.find((x) => x.warehouseId.toString() !== w.warehouseId.toString() && x.totalStock > w.totalStock);
      if (!donor) return;
      const qty = clamp(Math.round((donor.totalStock - w.totalStock) * 0.08), 8, 40);
      insights.push({
        level: "warning",
        title: `⚠ ${w.name} warehouse running low on inventory.`,
        recommendation: `Transfer ${qty} units from ${donor.name} warehouse.`,
      });
    }
  });

  if (richest.length >= 2) {
    const high = richest[0];
    const low = richest[richest.length - 1];
    if (high.totalStock - low.totalStock > 700) {
      insights.push({
        level: "info",
        title: `High stock imbalance detected between ${high.name} and ${low.name}.`,
        recommendation: "Redistribute inventory to optimize fulfillment speed and reduce holding risk.",
      });
    }
  }

  if (!insights.length) {
    insights.push({
      level: "success",
      title: "Warehouse network is stable.",
      recommendation: "Continue proactive transfers to keep low-stock SKUs balanced across cities.",
    });
  }

  warehousesView
    .filter((w) => w.projected)
    .forEach((w) => {
      insights.push({
        level: "info",
        title: `${w.name} warehouse is newly added and running in projected demo mode.`,
        recommendation: `Create receipts or transfer starter SKUs to ${w.name} to switch from projected intelligence to live metrics.`,
      });
    });

  const activityFeed = movements
    .map((m) => {
      const warehouse = m.product?.warehouse || inferWarehouseFromNote(m.note, warehouseByName);
      const warehouseName = warehouse?.name || "Unknown";
      const created = m.createdAt || new Date();

      if (m.reference === "Receipt") {
        return {
          id: `receipt-${m._id}`,
          timestamp: created,
          type: "receipt",
          title: `Received ${m.quantity} units (${warehouseName} warehouse)`,
          quantity: Number(m.quantity || 0),
          warehouseName,
        };
      }

      if (m.reference === "Delivery") {
        return {
          id: `delivery-${m._id}`,
          timestamp: created,
          type: "delivery",
          title: `Delivered ${m.quantity} units (${warehouseName} warehouse)`,
          quantity: Number(m.quantity || 0),
          warehouseName,
        };
      }

      if (m.reference === "Adjustment") {
        return {
          id: `adjustment-${m._id}`,
          timestamp: created,
          type: "adjustment",
          title: `Adjustment ${m.type} ${m.quantity} units (${warehouseName} warehouse)`,
          quantity: Number(m.quantity || 0),
          warehouseName,
        };
      }

      return {
        id: `transfer-${m._id}`,
        timestamp: created,
        type: "transfer",
        title: m.note || "Transfer movement",
        quantity: Number(m.quantity || 0),
        warehouseName,
      };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  return {
    warehouses: warehousesView,
    transferNetwork,
    insights,
    activityFeed,
    thresholds: {
      lowStock: LOW_STOCK_THRESHOLD,
      healthyStock: HEALTHY_STOCK_THRESHOLD,
    },
  };
};

exports.createWarehouse = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Warehouse name is required" });
    }

    const trimmedName = name.trim();
    const existing = await Warehouse.findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (existing) {
      return res.status(409).json({ message: "Warehouse with this name already exists" });
    }

    const warehouse = await Warehouse.create({
      name: trimmedName,
      location: (location || "").trim(),
      city: (location || "").trim(),
    });

    res.status(201).json({ message: "Warehouse created", warehouse });
  } catch (error) {
    console.error("Create warehouse error:", error);
    const msg = error?.code === 11000
      ? "Warehouse with this name already exists"
      : error?.message || "Server error while creating warehouse";
    res.status(error?.code === 11000 ? 409 : 500).json({ message: msg });
  }
};

exports.getWarehouses = async (_req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ createdAt: -1 });
    res.status(200).json({ warehouses });
  } catch (error) {
    console.error("Get warehouses error:", error);
    res.status(500).json({ message: "Server error while fetching warehouses" });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    const updates = {};
    if (typeof name === "string") updates.name = name.trim();
    if (typeof location === "string") updates.location = location.trim();

    if (updates.name) {
      const dup = await Warehouse.findOne({ name: updates.name, _id: { $ne: id } });
      if (dup) return res.status(409).json({ message: "Warehouse name already in use" });
    }

    const warehouse = await Warehouse.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });

    res.status(200).json({ message: "Warehouse updated", warehouse });
  } catch (error) {
    console.error("Update warehouse error:", error);
    const msg = error?.code === 11000
      ? "Warehouse name already in use"
      : error?.message || "Server error while updating warehouse";
    res.status(error?.code === 11000 ? 409 : 500).json({ message: msg });
  }
};

exports.getWarehouseDashboard = async (_req, res) => {
  try {
    await ensureDemoInventorySeeded();
    const dashboard = await buildWarehouseDashboardData();
    return res.status(200).json(dashboard);
  } catch (error) {
    console.error("Get warehouse dashboard error:", error);
    return res.status(500).json({ message: "Server error while fetching warehouse dashboard" });
  }
};

exports.getWarehouseCommandCenter = async (_req, res) => {
  try {
    await ensureDemoInventorySeeded();
    const dashboard = await buildWarehouseDashboardData();

    const warehouses = dashboard.warehouses.map((w) => ({
      warehouseId: w.warehouseId,
      name: w.name,
      location: w.location,
      coordinates: w.coordinates,
      metrics: {
        stockHealth: w.stockHealth,
        transferEfficiency: w.transferEfficiency,
        deliverySuccessRate: w.deliverySuccessRate,
        lowStockItems: w.lowStockItems,
        totalProducts: w.totalProducts,
        totalStock: w.totalStock,
        transfersToday: 0,
      },
    }));

    const nodeMap = warehouses.map((w) => ({
      id: String(w.warehouseId),
      label: w.name,
      location: w.location,
      coordinates: w.coordinates,
      stock: w.metrics.totalStock,
      lowStockItems: w.metrics.lowStockItems,
    }));

    const warehouseIdByName = Object.fromEntries(warehouses.map((w) => [w.name, String(w.warehouseId)]));
    const edgeMap = {};
    dashboard.transferNetwork.forEach((e) => {
      const fromWarehouseId = warehouseIdByName[e.source];
      const toWarehouseId = warehouseIdByName[e.target];
      if (!fromWarehouseId || !toWarehouseId) return;
      const key = `${fromWarehouseId}->${toWarehouseId}`;
      if (!edgeMap[key]) {
        edgeMap[key] = {
          fromWarehouseId,
          fromWarehouseName: e.source,
          toWarehouseId,
          toWarehouseName: e.target,
          count: 0,
          quantity: 0,
          lastTransferAt: new Date(),
        };
      }
      edgeMap[key].count += Number(e.successfulTransfers || 0);
      edgeMap[key].quantity += Number(e.quantity || 0);
    });

    const activityFeed = dashboard.activityFeed.map((a) => ({
      id: a.id,
      type: a.type,
      timestamp: a.timestamp,
      message: a.title,
      quantity: a.quantity,
      warehouseName: a.warehouseName,
      productName: "Inventory",
    }));

    return res.status(200).json({
      warehouses,
      insights: dashboard.insights,
      activityFeed,
      network: {
        nodes: nodeMap,
        edges: Object.values(edgeMap),
      },
      thresholds: dashboard.thresholds,
      dashboard,
    });
  } catch (error) {
    console.error("Get warehouse command center error:", error);
    return res.status(500).json({ message: "Server error while fetching warehouse command center" });
  }
};

