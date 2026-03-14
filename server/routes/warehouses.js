const express = require("express");
const {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} = require("../controllers/warehouseController");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.route("/").get(getWarehouses).post(createWarehouse);

router
  .route("/:id")
  .get(getWarehouse)
  .put(updateWarehouse)
  .delete(deleteWarehouse);

module.exports = router;
