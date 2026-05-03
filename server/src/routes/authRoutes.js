const express = require("express");
const {
  register,
  login,
  refresh,
  logout,
  me,
  updateProfile
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.get("/me", protect, me);
router.put("/profile", protect, updateProfile);

module.exports = router;
