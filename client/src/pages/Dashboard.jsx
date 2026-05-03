import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import ChartCanvas from "../components/ChartCanvas";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { currentMonth, money } from "../utils/format";

export default function Dashboard() {
  const { user } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await api.get(`/analytics/dashboard?month=${month}`);
      setData(response.data);
      setLoading(false);
    };

    load();
  }, [month]);

  const incomeExpenseConfig = useMemo(
    () => ({
      type: "bar",
      data: {
        labels: data?.incomeVsExpense?.map((item) => item.month) || [],
        datasets: [
          {
            label: "Income",
            data: data?.incomeVsExpense?.map((item) => item.income) || [],
            backgroundColor: "#0f766e"
          },
          {
            label: "Expense",
            data: data?.incomeVsExpense?.map((item) => item.expense) || [],
            backgroundColor: "#e85d4f"
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    }),
    [data]
  );

  const categoryConfig = useMemo(
    () => ({
      type: "doughnut",
      data: {
        labels: data?.categoryBreakdown?.map((item) => item.name) || [],
        datasets: [
          {
            data: data?.categoryBreakdown?.map((item) => item.total) || [],
            backgroundColor: data?.categoryBreakdown?.map((item) => item.color) || []
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
    }),
    [data]
  );

  if (loading) return <div className="text-sm text-slate-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-slate-500">Balances, monthly flow, and spending patterns.</p>
        </div>
        <input className="field max-w-48" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Balance" value={money(data.totalBalance, user.currency)} />
        <StatCard label="Monthly Income" value={money(data.monthlySummary.income, user.currency)} tone="good" />
        <StatCard label="Monthly Expense" value={money(data.monthlySummary.expense, user.currency)} tone="bad" />
        <StatCard label="Net Flow" value={money(data.monthlySummary.net, user.currency)} tone={data.monthlySummary.net >= 0 ? "good" : "bad"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <section className="panel xl:col-span-3">
          <h2 className="mb-4 text-base font-semibold text-ink">Income vs Expense</h2>
          <ChartCanvas config={incomeExpenseConfig} />
        </section>
        <section className="panel xl:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-ink">Category Breakdown</h2>
          {data.categoryBreakdown.length ? (
            <ChartCanvas config={categoryConfig} />
          ) : (
            <div className="flex h-72 items-center justify-center text-sm text-slate-500">No expenses this month</div>
          )}
        </section>
      </div>

      <section className="panel">
        <h2 className="mb-4 text-base font-semibold text-ink">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2">Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Account</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.map((transaction) => (
                <tr key={transaction._id} className="border-t border-slate-100">
                  <td className="py-3">{new Date(transaction.date).toLocaleDateString()}</td>
                  <td>{transaction.description || transaction.category?.name || "Transfer"}</td>
                  <td className="capitalize">{transaction.type}</td>
                  <td>{transaction.fromAccount?.name || transaction.toAccount?.name}</td>
                  <td className="text-right font-semibold">{money(transaction.amount, user.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
