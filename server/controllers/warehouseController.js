const Warehouse = require("../models/Warehouse");

exports.getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find()
      .populate("manager", "name email")
      .sort({ createdAt: -1 });
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id).populate(
      "manager",
      "name email"
    );

    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.createWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.create({
      ...req.body,
      manager: req.user.id,
    });
    res.status(201).json(warehouse);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);

    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res.json({ message: "Warehouse deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
