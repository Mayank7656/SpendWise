const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const { applyTransactionEffects, validateTransactionShape } = require("../utils/transactionEffects");

const cleanPayload = (body) => ({
  type: body.type,
  amount: Number(body.amount),
  date: body.date ? new Date(body.date) : new Date(),
  description: body.description || "",
  category: body.type === "transfer" ? null : body.category || null,
  fromAccount: ["expense", "transfer"].includes(body.type) ? body.fromAccount || null : null,
  toAccount: ["income", "transfer"].includes(body.type) ? body.toAccount || null : null
});

const listTransactions = async (req, res, next) => {
  try {
    const { type, account, category, from, to } = req.query;
    const filter = { user: req.user._id };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (account) filter.$or = [{ fromAccount: account }, { toAccount: account }];
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const transactions = await Transaction.find(filter)
      .populate("category", "name type color")
      .populate("fromAccount", "name type")
      .populate("toAccount", "name type")
      .sort({ date: -1, createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

const createTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let created;
    const payload = cleanPayload(req.body);

    await session.withTransaction(async () => {
      const validated = await validateTransactionShape(payload, req.user._id, session);
      await applyTransactionEffects(payload, req.user._id, session, 1);

      created = await Transaction.create(
        [
          {
            ...payload,
            amount: validated.amount,
            user: req.user._id
          }
        ],
        { session }
      );
    });

    const transaction = await Transaction.findById(created[0]._id)
      .populate("category", "name type color")
      .populate("fromAccount", "name type")
      .populate("toAccount", "name type");

    res.status(201).json(transaction);
  } catch (error) {
    res.status(res.statusCode === 200 ? 400 : res.statusCode);
    next(error);
  } finally {
    session.endSession();
  }
};

const updateTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const payload = cleanPayload(req.body);
    let transaction;

    await session.withTransaction(async () => {
      transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id }).session(session);
      if (!transaction) {
        res.status(404);
        throw new Error("Transaction not found");
      }

      await applyTransactionEffects(transaction.toObject(), req.user._id, session, -1);
      const validated = await validateTransactionShape(payload, req.user._id, session);
      await applyTransactionEffects(payload, req.user._id, session, 1);

      transaction.set({ ...payload, amount: validated.amount });
      await transaction.save({ session });
    });

    const updated = await Transaction.findById(transaction._id)
      .populate("category", "name type color")
      .populate("fromAccount", "name type")
      .populate("toAccount", "name type");

    res.json(updated);
  } catch (error) {
    res.status(res.statusCode === 200 ? 400 : res.statusCode);
    next(error);
  } finally {
    session.endSession();
  }
};

const deleteTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id }).session(session);
      if (!transaction) {
        res.status(404);
        throw new Error("Transaction not found");
      }

      await applyTransactionEffects(transaction.toObject(), req.user._id, session, -1);
      await transaction.deleteOne({ session });
    });

    res.json({ message: "Transaction deleted" });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

module.exports = { listTransactions, createTransaction, updateTransaction, deleteTransaction };
