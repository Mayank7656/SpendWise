const express = require("express");
const { listBudgets, upsertBudget, deleteBudget } = require("../controllers/budgetController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.route("/").get(listBudgets).post(upsertBudget);
router.route("/:id").delete(deleteBudget);

module.exports = router;
