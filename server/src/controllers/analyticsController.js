const mongoose = require("mongoose");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

const monthBounds = (month) => {
  const date = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date();
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
};

const getDashboard = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const { start, end } = monthBounds(req.query.month);

    const [accountTotals, monthlySummary, categoryBreakdown, incomeVsExpense, recentTransactions] =
      await Promise.all([
        Account.aggregate([
          { $match: { user: userId } },
          {
            $group: {
              _id: null,
              totalBalance: { $sum: "$balance" },
              accountCount: { $sum: 1 }
            }
          }
        ]),
        Transaction.aggregate([
          {
            $match: {
              user: userId,
              date: { $gte: start, $lt: end },
              type: { $in: ["income", "expense"] }
            }
          },
          { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } }
        ]),
        Transaction.aggregate([
          {
            $match: {
              user: userId,
              type: "expense",
              date: { $gte: start, $lt: end },
              category: { $ne: null }
            }
          },
          { $group: { _id: "$category", total: { $sum: "$amount" } } },
          {
            $lookup: {
              from: "categories",
              localField: "_id",
              foreignField: "_id",
              as: "category"
            }
          },
          { $unwind: "$category" },
          {
            $project: {
              _id: 0,
              categoryId: "$category._id",
              name: "$category.name",
              color: "$category.color",
              total: 1
            }
          },
          { $sort: { total: -1 } }
        ]),
        Transaction.aggregate([
          {
            $match: {
              user: userId,
              type: { $in: ["income", "expense"] },
              date: {
                $gte: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 5, 1)),
                $lt: end
              }
            }
          },
          {
            $group: {
              _id: {
                month: { $dateToString: { format: "%Y-%m", date: "$date" } },
                type: "$type"
              },
              total: { $sum: "$amount" }
            }
          },
          { $sort: { "_id.month": 1 } }
        ]),
        Transaction.find({ user: req.user._id })
          .populate("category", "name type color")
          .populate("fromAccount", "name type")
          .populate("toAccount", "name type")
          .sort({ date: -1, createdAt: -1 })
          .limit(6)
      ]);

    const summary = monthlySummary.reduce(
      (acc, item) => ({ ...acc, [item._id]: item.total }),
      { income: 0, expense: 0 }
    );

    const sixMonths = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - i, 1));
      sixMonths.push(date.toISOString().slice(0, 7));
    }

    const trend = sixMonths.map((month) => {
      const income =
        incomeVsExpense.find((item) => item._id.month === month && item._id.type === "income")?.total || 0;
      const expense =
        incomeVsExpense.find((item) => item._id.month === month && item._id.type === "expense")?.total || 0;

      return { month, income, expense };
    });

    res.json({
      totalBalance: accountTotals[0]?.totalBalance || 0,
      accountCount: accountTotals[0]?.accountCount || 0,
      monthlySummary: {
        income: summary.income,
        expense: summary.expense,
        net: summary.income - summary.expense
      },
      categoryBreakdown,
      incomeVsExpense: trend,
      recentTransactions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
