const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const createAccessToken = (userId) =>
  jwt.sign({ id: userId, type: "access" }, process.env.JWT_SECRET, { expiresIn: "15m" });

const createRefreshToken = (userId) =>
  jwt.sign({ id: userId, type: "refresh" }, process.env.JWT_SECRET, { expiresIn: "7d" });

const issueTokens = async (user) => {
  const accessToken = createAccessToken(user._id);
  const refreshToken = createRefreshToken(user._id);

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();

  return { accessToken, refreshToken };
};

module.exports = { createAccessToken, createRefreshToken, issueTokens };
