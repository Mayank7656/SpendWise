const express = require("express");
const {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.route("/").get(listTransactions).post(createTransaction);
router.route("/:id").put(updateTransaction).delete(deleteTransaction);

module.exports = router;
