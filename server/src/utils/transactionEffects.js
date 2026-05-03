const Account = require("../models/Account");
const Category = require("../models/Category");

const ensurePositiveAmount = (amount) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error("Amount must be greater than zero");
  }
  return Math.round(numeric * 100) / 100;
};

const ensureAccount = async (accountId, userId, session) => {
  if (!accountId) return null;
  const account = await Account.findOne({ _id: accountId, user: userId }).session(session);
  if (!account) throw new Error("Account not found");
  return account;
};

const ensureCategory = async (categoryId, userId, type, session) => {
  if (!categoryId) return null;
  const category = await Category.findOne({ _id: categoryId, user: userId }).session(session);
  if (!category) throw new Error("Category not found");
  if (category.type !== type) throw new Error(`Category must be ${type}`);
  return category;
};

const validateTransactionShape = async (payload, userId, session) => {
  const amount = ensurePositiveAmount(payload.amount);
  const type = payload.type;

  if (!["income", "expense", "transfer"].includes(type)) {
    throw new Error("Transaction type must be income, expense or transfer");
  }

  let fromAccount = null;
  let toAccount = null;
  let category = null;

  if (type === "income") {
    toAccount = await ensureAccount(payload.toAccount, userId, session);
    if (!toAccount) throw new Error("Income requires a destination account");
    category = await ensureCategory(payload.category, userId, "income", session);
  }

  if (type === "expense") {
    fromAccount = await ensureAccount(payload.fromAccount, userId, session);
    if (!fromAccount) throw new Error("Expense requires a source account");
    category = await ensureCategory(payload.category, userId, "expense", session);
  }

  if (type === "transfer") {
    fromAccount = await ensureAccount(payload.fromAccount, userId, session);
    toAccount = await ensureAccount(payload.toAccount, userId, session);
    if (!fromAccount || !toAccount) throw new Error("Transfer requires source and destination accounts");
    if (String(fromAccount._id) === String(toAccount._id)) {
      throw new Error("Transfer accounts must be different");
    }
  }

  return { amount, type, fromAccount, toAccount, category };
};

const applyTransactionEffects = async (payload, userId, session, direction = 1) => {
  const { amount, type, fromAccount, toAccount } = await validateTransactionShape(
    payload,
    userId,
    session
  );

  if (direction === 1 && (type === "expense" || type === "transfer") && fromAccount.balance < amount) {
    throw new Error("Insufficient account balance");
  }

  if (type === "income") {
    await Account.updateOne(
      { _id: toAccount._id, user: userId },
      { $inc: { balance: amount * direction } },
      { session }
    );
  }

  if (type === "expense") {
    await Account.updateOne(
      { _id: fromAccount._id, user: userId },
      { $inc: { balance: -amount * direction } },
      { session }
    );
  }

  if (type === "transfer") {
    await Account.updateOne(
      { _id: fromAccount._id, user: userId },
      { $inc: { balance: -amount * direction } },
      { session }
    );
    await Account.updateOne(
      { _id: toAccount._id, user: userId },
      { $inc: { balance: amount * direction } },
      { session }
    );
  }

  return { amount, type };
};

module.exports = { applyTransactionEffects, validateTransactionShape };
