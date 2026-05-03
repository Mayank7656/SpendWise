const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

const listAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    next(error);
  }
};

const createAccount = async (req, res, next) => {
  try {
    const { name, type, balance, currency } = req.body;
    if (!name || !type) {
      res.status(400);
      throw new Error("Account name and type are required");
    }

    const account = await Account.create({
      user: req.user._id,
      name,
      type,
      balance: Number(balance || 0),
      currency: currency || req.user.currency
    });

    res.status(201).json(account);
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      error.message = "An account with this name already exists";
    }
    next(error);
  }
};

const updateAccount = async (req, res, next) => {
  try {
    const updates = (({ name, type, currency }) => ({ name, type, currency }))(req.body);
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!account) {
      res.status(404);
      throw new Error("Account not found");
    }

    res.json(account);
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) {
      res.status(404);
      throw new Error("Account not found");
    }

    const used = await Transaction.exists({
      user: req.user._id,
      $or: [{ fromAccount: account._id }, { toAccount: account._id }]
    });

    if (used) {
      res.status(409);
      throw new Error("Accounts with transactions cannot be deleted");
    }

    await account.deleteOne();
    res.json({ message: "Account deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { listAccounts, createAccount, updateAccount, deleteAccount };
