const express = require("express");
const {
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount
} = require("../controllers/accountController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.route("/").get(listAccounts).post(createAccount);
router.route("/:id").put(updateAccount).delete(deleteAccount);

module.exports = router;
