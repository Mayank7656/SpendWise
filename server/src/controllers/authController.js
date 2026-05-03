const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Category = require("../models/Category");
const DEFAULT_CATEGORIES = require("../utils/defaultCategories");
const { issueTokens } = require("../utils/tokens");

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  currency: user.currency
});

const register = async (req, res, next) => {
  try {
    const { name, email, password, currency } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email and password are required");
    }

    if (password.length < 8) {
      res.status(400);
      throw new Error("Password must be at least 8 characters");
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409);
      throw new Error("Email is already registered");
    }

    const user = await User.create({
      name,
      email,
      currency: currency || "USD",
      passwordHash: await bcrypt.hash(password, 12)
    });

    await Category.insertMany(
      DEFAULT_CATEGORIES.map((category) => ({ ...category, user: user._id }))
    );

    const tokens = await issueTokens(user);

    res.status(201).json({ user: publicUser(user), ...tokens });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const tokens = await issueTokens(user);

    res.json({ user: publicUser(user), ...tokens });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400);
      throw new Error("Refresh token is required");
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== "refresh") {
      res.status(401);
      throw new Error("Invalid refresh token");
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokenHash) {
      res.status(401);
      throw new Error("Refresh token revoked");
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      res.status(401);
      throw new Error("Invalid refresh token");
    }

    const tokens = await issueTokens(user);

    res.json({ user: publicUser(user), ...tokens });
  } catch (error) {
    res.status(401);
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshTokenHash = null;
      await user.save();
    }

    res.json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, currency, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (currency) user.currency = currency;

    if (newPassword) {
      if (!currentPassword) {
        res.status(400);
        throw new Error("Current password is required");
      }
      if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
        res.status(401);
        throw new Error("Current password is incorrect");
      }
      if (newPassword.length < 8) {
        res.status(400);
        throw new Error("New password must be at least 8 characters");
      }
      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await user.save();
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, me, updateProfile };
