const express = require("express");
const {
  getMovements,
  getMovement,
  createMovement,
} = require("../controllers/stockMovementController");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.route("/").get(getMovements).post(createMovement);

router.route("/:id").get(getMovement);

module.exports = router;
