const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Category = require("../models/Category");
const Transaction = require("../models/Transaction");

const monthRange = (month) => {
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));
  return { start, end };
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

const listBudgets = async (req, res, next) => {
  try {
    const month = req.query.month || currentMonth();
    const budgets = await Budget.find({ user: req.user._id, month })
      .populate("category", "name type color")
      .sort({ createdAt: -1 });

    const { start, end } = monthRange(month);
    const spent = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          type: "expense",
          date: { $gte: start, $lt: end },
          category: { $ne: null }
        }
      },
      { $group: { _id: "$category", amount: { $sum: "$amount" } } }
    ]);

    const spentByCategory = new Map(spent.map((item) => [String(item._id), item.amount]));

    res.json(
      budgets.map((budget) => ({
        ...budget.toObject(),
        spent: spentByCategory.get(String(budget.category._id)) || 0
      }))
    );
  } catch (error) {
    next(error);
  }
};

const upsertBudget = async (req, res, next) => {
  try {
    const { category, month, amount } = req.body;
    if (!category || !month || amount === undefined) {
      res.status(400);
      throw new Error("Category, month and amount are required");
    }

    const categoryDoc = await Category.findOne({ _id: category, user: req.user._id, type: "expense" });
    if (!categoryDoc) {
      res.status(400);
      throw new Error("Budget category must be an expense category");
    }

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month },
      { amount: Number(amount) },
      { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("category", "name type color");

    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
};

const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      res.status(404);
      throw new Error("Budget not found");
    }

    res.json({ message: "Budget deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { listBudgets, upsertBudget, deleteBudget };
